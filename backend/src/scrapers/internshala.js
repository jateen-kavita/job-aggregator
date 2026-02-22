/**
 * Internshala Scraper - Entry-level analyst jobs
 */
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://internshala.com/',
};

function makeHash(title, company, location) {
    const str = `internshala:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `internshala_${Math.abs(hash)}`;
}

async function scrapeInternshala() {
    const jobs = [];
    const urls = [
        'https://internshala.com/jobs/analyst-jobs/',
        'https://internshala.com/jobs/data-analyst-jobs/',
        'https://internshala.com/jobs/business-analyst-jobs/',
        'https://internshala.com/jobs/work-from-home-analyst-jobs/',
    ];

    for (const url of urls) {
        try {
            const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
            const $ = cheerio.load(data);

            $('.individual_internship, .internship-item-main, #internship_list_container_1 .internship_meta').each((i, el) => {
                if (i >= 15) return false;
                const title = $(el).find('.job-title-href, .heading_4_5 a, h3 a').first().text().trim()
                    || $(el).find('[data-analytics="profile_title"]').text().trim();
                const company = $(el).find('.link_display_like_text, .company, .company_name').first().text().trim();
                const location = $(el).find('.location_link, .locations span, .location').text().trim();
                const salary = $(el).find('.stipend, .salary').first().text().trim();
                const skills = $(el).find('.round_tabs span').map((_, s) => $(s).text().trim()).get().join(', ');
                const jobHref = $(el).find('.job-title-href, h3 a').attr('href') || '';
                const dateText = $(el).find('.status-inactive, .posted_by_container').text().trim();

                if (!title) return;

                const isRemote = (
                    (location || '').toLowerCase().includes('remote')
                    || (location || '').toLowerCase().includes('work from home')
                    || url.includes('work-from-home')
                ) ? 1 : 0;

                const hash = makeHash(title, company, location);
                jobs.push({
                    id: uuidv4(),
                    title,
                    company: company || 'Company',
                    location: location || 'India',
                    experience: '0-2 years',
                    salary: salary || null,
                    source: 'Internshala',
                    source_url: url,
                    apply_url: jobHref.startsWith('http') ? jobHref : `https://internshala.com${jobHref}`,
                    description: null,
                    posted_at: dateText || new Date().toISOString(),
                    fetched_at: new Date().toISOString(),
                    is_remote: isRemote,
                    job_hash: hash,
                    skills,
                });
            });

            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            console.error(`[Internshala] Error for ${url}:`, err.message);
        }
    }

    const seen = new Set();
    return jobs.filter(j => {
        if (seen.has(j.job_hash)) return false;
        seen.add(j.job_hash);
        return true;
    });
}

module.exports = { scrapeInternshala };
