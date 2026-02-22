const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
};

function makeHash(title, company, location) {
    const str = `timesjobs:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return `timesjobs_${Math.abs(hash)}`;
}

export default async function handler(req, res) {
    try {
        const jobs = [];
        const url = 'https://www.timesjobs.com/candidate/job-search.html?searchType=personalizedSearch&from=submit&searchTextSrc=ft&searchTextText=analyst&txtKeywords=analyst&txtLocation=&pDate=I&sequence=1&startPage=1';

        const { data } = await axios.get(url, { headers: HEADERS, httpsAgent, timeout: 8000 });
        const $ = cheerio.load(data);

        $('li.clearfix.job-bx').each((i, el) => {
            if (i >= 20) return false;
            const title = $(el).find('h2 a').text().trim() || $(el).find('.job-title a').text().trim();
            const company = $(el).find('.joblist-comp-name').text().trim() || $(el).find('.comp-name').text().trim();
            const location = $(el).find('.srp-skills li').last().text().trim() || $(el).find('.job-location').text().trim() || 'India';
            const salary = $(el).find('.salary').text().trim();
            const skills = $(el).find('.srp-skills li').map((_, s) => $(s).text().trim()).get().slice(0, 5).join(', ');
            const exp = $(el).find('.srp-exp').text().trim() || '0-3 years';
            const jobHref = $(el).find('h2 a').attr('href') || '';

            if (!title) return;

            jobs.push({
                id: uuidv4(),
                title, company: company || 'Company', location, experience: exp, salary: salary || null,
                source: 'TimesJobs', source_url: url, apply_url: jobHref.startsWith('http') ? jobHref : `https://www.timesjobs.com${jobHref}`,
                description: $(el).find('.list-job-dtl').text().trim().slice(0, 500) || null,
                posted_at: $(el).find('.job-post-day').text().trim() || new Date().toISOString(), fetched_at: new Date().toISOString(),
                is_remote: location.toLowerCase().includes('remote') ? 1 : 0,
                job_hash: makeHash(title, company, location), skills
            });
        });

        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate'); // 30 min cache
        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message, jobs: [] });
    }
}
