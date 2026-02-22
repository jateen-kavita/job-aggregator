import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.linkedin.com/jobs/search',
};

function makeHash(title, company, location) {
    const str = `linkedin:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return `linkedin_${Math.abs(hash)}`;
}

export default async function handler(req, res) {
    try {
        const jobs = [];
        const url = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=analyst&location=India&geoId=102713980&f_E=1%2C2%2C3&sortBy=DD&start=0';

        const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(data);

        $('li').each((i, el) => {
            if (i >= 20) return false;
            const title = $(el).find('.base-search-card__title').text().trim();
            const company = $(el).find('.base-search-card__subtitle').text().trim();
            const location = $(el).find('.job-search-card__location').text().trim();
            const dateStr = $(el).find('time').attr('datetime') || new Date().toISOString();
            const applyUrl = $(el).find('a.base-card__full-link, a').first().attr('href') || '';

            if (!title || !company) return;

            jobs.push({
                id: uuidv4(),
                title, company, location: location || 'India',
                experience: '0-3 years', salary: null,
                source: 'LinkedIn', source_url: 'https://www.linkedin.com/jobs/search/', apply_url: applyUrl,
                description: null, posted_at: dateStr, fetched_at: new Date().toISOString(),
                is_remote: location.toLowerCase().includes('remote') ? 1 : 0,
                job_hash: makeHash(title, company, location), skills: null
            });
        });

        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message, jobs: [] });
    }
}
