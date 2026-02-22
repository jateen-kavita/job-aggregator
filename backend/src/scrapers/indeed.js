/**
 * Indeed Scraper - Uses Indeed's job search page scraping
 * Target: Analyst roles, 0-3 years exp, India
 */
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
};

function makeHash(title, company, location) {
    const str = `indeed:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `indeed_${Math.abs(hash)}`;
}

async function scrapeIndeed() {
    const jobs = [];
    const queries = [
        'https://in.indeed.com/jobs?q=analyst&l=India&explvl=entry_level&fromage=7&sort=date',
        'https://in.indeed.com/jobs?q=business+analyst&l=India&fromage=7&sort=date',
        'https://in.indeed.com/jobs?q=data+analyst&l=India&fromage=7&sort=date',
        'https://in.indeed.com/jobs?q=analyst+remote&l=&fromage=7&sort=date&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11',
    ];

    for (const url of queries) {
        try {
            const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
            const $ = cheerio.load(data);

            $('div.job_seen_beacon, .jobsearch-SerpJobCard, [data-jk]').each((i, el) => {
                if (i >= 15) return false;
                const title = $(el).find('h2.jobTitle span[title], h2.jobTitle a span, .title a').text().trim()
                    || $(el).find('[data-testid="job-title"]').text().trim();
                const company = $(el).find('[data-testid="company-name"], .companyName, .company').first().text().trim();
                const location = $(el).find('[data-testid="text-location"], .companyLocation').first().text().trim();
                const salary = $(el).find('[data-testid="attribute_snippet_testid"], .salarySnippet, .salary-snippet').first().text().trim();
                const jobKey = $(el).attr('data-jk') || $(el).find('a[data-jk]').attr('data-jk') || $(el).find('a').attr('id');
                const applyUrl = jobKey
                    ? `https://in.indeed.com/viewjob?jk=${jobKey}`
                    : `https://in.indeed.com${$(el).find('h2.jobTitle a, a.jcs-JobTitle').attr('href') || ''}`;
                const snippet = $(el).find('.job-snippet, [data-testid="job-snippet"]').text().trim();
                const dateText = $(el).find('.date, [data-testid="myJobsStateDate"]').text().trim();

                if (!title || !company) return;

                const isRemote = (location.toLowerCase().includes('remote') || url.includes('remotejob')) ? 1 : 0;
                const hash = makeHash(title, company, location);

                jobs.push({
                    id: uuidv4(),
                    title,
                    company,
                    location: location || 'India',
                    experience: '0-3 years',
                    salary: salary || null,
                    source: 'Indeed',
                    source_url: url,
                    apply_url: applyUrl,
                    description: snippet,
                    posted_at: dateText || new Date().toISOString(),
                    fetched_at: new Date().toISOString(),
                    is_remote: isRemote,
                    job_hash: hash,
                    skills: null,
                });
            });

            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            console.error(`[Indeed] Error for ${url}:`, err.message);
        }
    }

    return jobs;
}

module.exports = { scrapeIndeed };
