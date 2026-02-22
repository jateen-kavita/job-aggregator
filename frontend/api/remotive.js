const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
}

function makeHash(title, company) {
    const str = `remotive:${title}:${company}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return `remotive_${Math.abs(hash)}`;
}

export default async function handler(req, res) {
    try {
        const jobs = [];

        const { data } = await axios.get('https://remotive.com/api/remote-jobs', {
            params: { search: 'analyst', limit: 30 },
            timeout: 8000,
        });

        const listings = data['jobs'] || [];
        for (const job of listings) {
            const titleLower = (job.title || '').toLowerCase();
            if (!titleLower.includes('analyst') && !titleLower.includes('analysis') && !titleLower.includes('data')) continue;

            jobs.push({
                id: uuidv4(),
                title: job.title, company: job.company_name || 'Company', location: 'Remote',
                experience: '0-3 years', salary: job.salary || null,
                source: 'Remotive', source_url: 'https://remotive.com/remote-jobs', apply_url: job.url,
                description: stripHtml(job.description).slice(0, 500),
                posted_at: job.publication_date || new Date().toISOString(), fetched_at: new Date().toISOString(),
                is_remote: 1, job_hash: makeHash(job.title, job.company_name),
                skills: Array.isArray(job.tags) ? job.tags.join(', ') : ''
            });
        }

        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message, jobs: [] });
    }
}
