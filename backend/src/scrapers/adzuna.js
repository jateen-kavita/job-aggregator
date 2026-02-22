/**
 * Adzuna Scraper - Free job search API (no API key needed for basic requests)
 * Great alternative to Indeed for India analyst jobs
 */
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Adzuna free API - requires app_id and app_key (free registration)
// Fallback: Use their search page scraping
const cheerio = require('cheerio');
const https = require('https');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html, */*',
    'Accept-Language': 'en-US,en;q=0.9',
};

function makeHash(title, company, location) {
    const str = `adzuna:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `adzuna_${Math.abs(hash)}`;
}

async function scrapeAdzuna() {
    const jobs = [];

    // Try Adzuna's public API (India country code = 'in')
    // They have free tier: https://developer.adzuna.com/
    // App ID and key from env or use public no-auth fallback endpoint
    const appId = process.env.ADZUNA_APP_ID || '';
    const appKey = process.env.ADZUNA_APP_KEY || '';

    const searches = ['analyst', 'data analyst', 'business analyst'];

    for (const keyword of searches) {
        try {
            let url;
            if (appId && appKey) {
                // Use official API if credentials provided
                url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${encodeURIComponent(keyword)}&where=india&max_days_old=7&sort_by=date`;
                const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
                const results = data?.results || [];
                for (const job of results) {
                    const hash = makeHash(job.title, job.company?.display_name || '', job.location?.display_name || '');
                    jobs.push({
                        id: uuidv4(),
                        title: job.title,
                        company: job.company?.display_name || 'Company',
                        location: job.location?.display_name || 'India',
                        experience: '0-3 years',
                        salary: job.salary_min ? `₹${Math.round(job.salary_min / 1000)}K - ₹${Math.round(job.salary_max / 1000)}K` : null,
                        source: 'Adzuna',
                        source_url: 'https://www.adzuna.in/jobs/search?q=analyst',
                        apply_url: job.redirect_url,
                        description: job.description ? job.description.slice(0, 500) : null,
                        posted_at: job.created || new Date().toISOString(),
                        fetched_at: new Date().toISOString(),
                        is_remote: (job.category?.label || '').toLowerCase().includes('remote') ? 1 : 0,
                        job_hash: hash,
                        skills: null,
                    });
                }
            } else {
                // Scrape Adzuna's India search page directly
                url = `https://www.adzuna.in/search?q=${encodeURIComponent(keyword)}&w=india&days_old=7&sort=date`;
                const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
                const $ = cheerio.load(data);

                $('[data-cy="result"],.result, article.result').each((i, el) => {
                    if (i >= 15) return false;
                    const title = $(el).find('h2 a, h3 a, .result-title').text().trim();
                    const company = $(el).find('.result-company, [data-cy="company"]').text().trim();
                    const location = $(el).find('.result-location, [data-cy="location"]').text().trim();
                    const salary = $(el).find('.result-salary, [data-cy="salary"]').text().trim();
                    const desc = $(el).find('.result-description, .description').text().trim();
                    const href = $(el).find('h2 a, h3 a').attr('href') || '';

                    if (!title) return;

                    const isRemote = location.toLowerCase().includes('remote') ? 1 : 0;
                    const hash = makeHash(title, company, location);
                    jobs.push({
                        id: uuidv4(),
                        title,
                        company: company || 'Company',
                        location: location || 'India',
                        experience: '0-3 years',
                        salary: salary || null,
                        source: 'Adzuna',
                        source_url: url,
                        apply_url: href.startsWith('http') ? href : `https://www.adzuna.in${href}`,
                        description: desc.slice(0, 500) || null,
                        posted_at: new Date().toISOString(),
                        fetched_at: new Date().toISOString(),
                        is_remote: isRemote,
                        job_hash: hash,
                        skills: null,
                    });
                });
            }
        } catch (err) {
            console.error(`[Adzuna] Error for "${keyword}":`, err.message);
        }
        await new Promise(r => setTimeout(r, 1500));
    }

    const seen = new Set();
    const unique = jobs.filter(j => {
        if (seen.has(j.job_hash)) return false;
        seen.add(j.job_hash);
        return true;
    });
    console.log(`[Adzuna] Found ${unique.length} jobs`);
    return unique;
}

module.exports = { scrapeAdzuna };
