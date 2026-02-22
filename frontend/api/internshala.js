import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://internshala.com/',
};

function makeHash(title, company, location) {
    const str = `internshala:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return `internshala_${Math.abs(hash)}`;
}

export default async function handler(req, res) {
    try {
        const jobs = [];
        const url = 'https://internshala.com/jobs/analyst-jobs/';

        const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        const $ = cheerio.load(data);

        $('.individual_internship, .internship-item-main, #internship_list_container_1 .internship_meta').each((i, el) => {
            if (i >= 20) return false;
            const title = $(el).find('.job-title-href, .heading_4_5 a, h3 a').first().text().trim() || $(el).find('[data-analytics="profile_title"]').text().trim();
            const company = $(el).find('.link_display_like_text, .company, .company_name').first().text().trim();
            const location = $(el).find('.location_link, .locations span, .location').text().trim();
            const salary = $(el).find('.stipend, .salary').first().text().trim();
            const skills = $(el).find('.round_tabs span').map((_, s) => $(s).text().trim()).get().join(', ');
            const jobHref = $(el).find('.job-title-href, h3 a').attr('href') || '';

            if (!title) return;

            jobs.push({
                id: uuidv4(),
                title, company: company || 'Company', location: location || 'India',
                experience: '0-2 years', salary: salary || null,
                source: 'Internshala', source_url: url, apply_url: jobHref.startsWith('http') ? jobHref : `https://internshala.com${jobHref}`,
                description: null, posted_at: new Date().toISOString(), fetched_at: new Date().toISOString(),
                is_remote: (location || '').toLowerCase().includes('remote') || (location || '').toLowerCase().includes('work from home') ? 1 : 0,
                job_hash: makeHash(title, company, location), skills
            });
        });

        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message, jobs: [] });
    }
}
