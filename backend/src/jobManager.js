/**
 * Job Manager - Orchestrates all scrapers and manages DB operations
 */
const { v4: uuidv4 } = require('uuid');
const { scrapeIndeed } = require('./scrapers/indeed');
const { scrapeRemotive } = require('./scrapers/remotive');
const { scrapeLinkedIn } = require('./scrapers/linkedin');
const { scrapeNaukri } = require('./scrapers/naukri');
const { scrapeInternshala } = require('./scrapers/internshala');
const { scrapeTimesJobs } = require('./scrapers/timesjobs');
const { scrapeAdzuna } = require('./scrapers/adzuna');
const { insertJob, resetNewFlags, setState, getState, logScrape } = require('./db');

let isFetching = false;

const SCRAPERS = [
    { name: 'LinkedIn', fn: scrapeLinkedIn },
    { name: 'Remotive', fn: scrapeRemotive },
    { name: 'Naukri', fn: scrapeNaukri },
    { name: 'Internshala', fn: scrapeInternshala },
    { name: 'TimesJobs', fn: scrapeTimesJobs },
    { name: 'Adzuna', fn: scrapeAdzuna },
    { name: 'Indeed', fn: scrapeIndeed },
];

async function runScraper(scraper) {
    const startTime = Date.now();
    console.log(`[JobManager] Starting scraper: ${scraper.name}`);
    try {
        const jobs = await scraper.fn();
        let newCount = 0;
        for (const job of jobs) {
            try {
                const result = insertJob.run(job);
                if (result.changes > 0) newCount++;
            } catch (e) {
                // duplicate or constraint error - skip silently
            }
        }
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[JobManager] ${scraper.name}: ${jobs.length} found, ${newCount} new (${duration}s)`);
        logScrape.run({
            source: scraper.name,
            status: 'success',
            jobs_found: jobs.length,
            jobs_new: newCount,
            error: null,
            scraped_at: new Date().toISOString(),
        });
        return { source: scraper.name, found: jobs.length, new: newCount, success: true };
    } catch (err) {
        console.error(`[JobManager] ${scraper.name} failed:`, err.message);
        logScrape.run({
            source: scraper.name,
            status: 'error',
            jobs_found: 0,
            jobs_new: 0,
            error: err.message,
            scraped_at: new Date().toISOString(),
        });
        return { source: scraper.name, found: 0, new: 0, success: false, error: err.message };
    }
}

async function fetchAllJobs() {
    if (isFetching) {
        console.log('[JobManager] Already fetching, skipping...');
        return;
    }
    isFetching = true;
    const fetchStartTime = new Date().toISOString();
    console.log(`\n[JobManager] ====== Starting fetch cycle at ${fetchStartTime} ======`);

    // Reset "new" flags from previous cycle before inserting new ones
    resetNewFlags.run();

    // Run all scrapers (with concurrency limit to avoid being flagged)
    const results = [];
    // Run 2 scrapers at a time
    for (let i = 0; i < SCRAPERS.length; i += 2) {
        const batch = SCRAPERS.slice(i, i + 2);
        const batchResults = await Promise.allSettled(batch.map(s => runScraper(s)));
        batchResults.forEach(r => {
            if (r.status === 'fulfilled') results.push(r.value);
        });
        // Brief pause between batches
        if (i + 2 < SCRAPERS.length) {
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    const totalNew = results.reduce((sum, r) => sum + r.new, 0);
    const now = new Date().toISOString();
    const nextFetch = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    setState.run({ key: 'last_fetch', value: now });
    setState.run({ key: 'next_fetch', value: nextFetch });
    setState.run({ key: 'last_fetch_results', value: JSON.stringify(results) });

    console.log(`[JobManager] ====== Fetch complete: ${totalNew} new jobs added ======\n`);
    isFetching = false;
    return results;
}

function getLastFetchTime() {
    try {
        return getState.get({ key: 'last_fetch' })?.value || null;
    } catch { return null; }
}

function getNextFetchTime() {
    try {
        return getState.get({ key: 'next_fetch' })?.value || null;
    } catch { return null; }
}

function getLastFetchResults() {
    try {
        const val = getState.get({ key: 'last_fetch_results' })?.value;
        return val ? JSON.parse(val) : [];
    } catch { return []; }
}

module.exports = { fetchAllJobs, getLastFetchTime, getNextFetchTime, getLastFetchResults };
