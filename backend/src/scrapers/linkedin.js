/**
 * LinkedIn Scraper - Uses LinkedIn's public guest jobs API
 * No auth required for browsing public job listings
 */
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.linkedin.com/jobs/search',
    'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
};

function makeHash(title, company, location) {
    const str = `linkedin:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `linkedin_${Math.abs(hash)}`;
}

async function scrapeLinkedIn() {
    const jobs = [];
    // LinkedIn public guest endpoint - returns HTML job cards
    const searches = [
        // f_E=2 = Entry level, f_E=3 = Associate, geoId=102713980 = India
        'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=analyst&location=India&geoId=102713980&f_E=1%2C2%2C3&sortBy=DD&start=0',
        'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=data+analyst&location=India&geoId=102713980&f_E=1%2C2%2C3&sortBy=DD&start=0',
        'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=business+analyst&location=India&geoId=102713980&f_E=1%2C2%2C3&sortBy=DD&start=0',
        'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=analyst&location=India&f_WT=2&geoId=102713980&f_E=1%2C2%2C3&sortBy=DD&start=0',
    ];

    for (const url of searches) {
        try {
            const { data } = await axios.get(url, { headers: HEADERS, timeout: 20000 });
            const $ = cheerio.load(data);

            $('li').each((i, el) => {
                if (i >= 20) return false;
                const title = $(el).find('.base-search-card__title, h3.base-search-card__title').text().trim();
                const company = $(el).find('.base-search-card__subtitle, h4.base-search-card__subtitle').text().trim();
                const location = $(el).find('.job-search-card__location').text().trim();
                const dateStr = $(el).find('time').attr('datetime') || $(el).find('.job-search-card__listdate').text().trim();
                const applyUrl = $(el).find('a.base-card__full-link, a').first().attr('href') || '';
                const isRemote = (location.toLowerCase().includes('remote') || url.includes('f_WT=2')) ? 1 : 0;

                if (!title || !company) return;

                const hash = makeHash(title, company, location);
                jobs.push({
                    id: uuidv4(),
                    title,
                    company,
                    location: location || 'India',
                    experience: '0-3 years',
                    salary: null,
                    source: 'LinkedIn',
                    source_url: 'https://www.linkedin.com/jobs/search/?keywords=analyst&location=India',
                    apply_url: applyUrl.startsWith('http') ? applyUrl : `https://www.linkedin.com${applyUrl}`,
                    description: null,
                    posted_at: dateStr || new Date().toISOString(),
                    fetched_at: new Date().toISOString(),
                    is_remote: isRemote,
                    job_hash: hash,
                    skills: null,
                });
            });

            await new Promise(r => setTimeout(r, 3000));
        } catch (err) {
            console.error(`[LinkedIn] Error for ${url}:`, err.message);
        }
    }

    // Deduplicate
    const seen = new Set();
    return jobs.filter(j => {
        if (seen.has(j.job_hash)) return false;
        seen.add(j.job_hash);
        return true;
    });
}

module.exports = { scrapeLinkedIn };
