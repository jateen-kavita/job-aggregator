/**
 * TimesJobs Scraper - Uses direct HTTP scraping with SSL bypass for their cert issues
 * Also uses their search API
 */
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

// Create agent that ignores SSL errors (TimesJobs has cert issues)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
};

function makeHash(title, company, location) {
    const str = `timesjobs:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `timesjobs_${Math.abs(hash)}`;
}

async function scrapeTimesJobs() {
    const jobs = [];
    const searches = [
        'https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&searchTextSrc=ft&searchTextText=analyst&txtKeywords=analyst&txtLocation=&pDate=I&sequence=1&startPage=1',
        'https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&searchTextSrc=ft&searchTextText=data+analyst&txtKeywords=data+analyst&txtLocation=&pDate=I&sequence=1&startPage=1',
    ];

    for (const url of searches) {
        try {
            const { data } = await axios.get(url, {
                headers: HEADERS,
                httpsAgent,
                timeout: 20000,
            });

            const $ = cheerio.load(data);

            $('li.clearfix.job-bx').each((i, el) => {
                if (i >= 20) return false;
                const title = $(el).find('h2 a').text().trim()
                    || $(el).find('.job-title a').text().trim();
                const company = $(el).find('.joblist-comp-name').text().trim()
                    || $(el).find('.comp-name').text().trim();
                const location = $(el).find('.srp-skills li').last().text().trim()
                    || $(el).find('.job-location').text().trim()
                    || 'India';
                const salary = $(el).find('.salary').text().trim();
                const skills = $(el).find('.srp-skills li').map((_, s) => $(s).text().trim()).get().slice(0, 5).join(', ');
                const exp = $(el).find('.srp-exp').text().trim() || '0-3 years';
                const jobHref = $(el).find('h2 a').attr('href') || '';
                const dateText = $(el).find('.job-post-day').text().trim();
                const desc = $(el).find('.list-job-dtl').text().trim();

                if (!title) return;

                const isRemote = location.toLowerCase().includes('remote') ? 1 : 0;
                const hash = makeHash(title, company, location);

                jobs.push({
                    id: uuidv4(),
                    title,
                    company: company || 'Company',
                    location,
                    experience: exp,
                    salary: salary || null,
                    source: 'TimesJobs',
                    source_url: url,
                    apply_url: jobHref.startsWith('http') ? jobHref : `https://www.timesjobs.com${jobHref}`,
                    description: desc.slice(0, 500) || null,
                    posted_at: dateText || new Date().toISOString(),
                    fetched_at: new Date().toISOString(),
                    is_remote: isRemote,
                    job_hash: hash,
                    skills,
                });
            });

            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            console.error(`[TimesJobs] Error for ${url}:`, err.message);
        }
    }

    const seen = new Set();
    const unique = jobs.filter(j => {
        if (seen.has(j.job_hash)) return false;
        seen.add(j.job_hash);
        return true;
    });

    console.log(`[TimesJobs] Found ${unique.length} jobs`);
    return unique;
}

module.exports = { scrapeTimesJobs };
