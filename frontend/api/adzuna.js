import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
};

function makeHash(title, company, location) {
    const str = `adzuna:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return `adzuna_${Math.abs(hash)}`;
}

export default async function handler(req, res) {
    try {
        const jobs = [];
        const url = `https://www.adzuna.in/search?q=analyst&w=india&days_old=7&sort=date`;

        // Scrape Adzuna India (public HTML search, requires no API key!)
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(data);

        $('[data-cy="result"],.result, article.result').each((i, el) => {
            if (i >= 20) return false;
            const title = $(el).find('h2 a, h3 a, .result-title').text().trim();
            const company = $(el).find('.result-company, [data-cy="company"]').text().trim();
            const location = $(el).find('.result-location, [data-cy="location"]').text().trim();
            const salary = $(el).find('.result-salary, [data-cy="salary"]').text().trim();
            const desc = $(el).find('.result-description, .description').text().trim();
            const href = $(el).find('h2 a, h3 a').attr('href') || '';

            if (!title) return;

            jobs.push({
                id: uuidv4(),
                title, company: company || 'Company', location: location || 'India',
                experience: '0-3 years', salary: salary || null,
                source: 'Adzuna', source_url: url, apply_url: href.startsWith('http') ? href : `https://www.adzuna.in${href}`,
                description: desc.slice(0, 500) || null, posted_at: new Date().toISOString(), fetched_at: new Date().toISOString(),
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
