/**
 * Remotive Scraper - Free public API for remote jobs
 * https://remotive.com/api/remote-jobs
 */
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

function makeHash(title, company) {
    const str = `remotive:${title}:${company}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `remotive_${Math.abs(hash)}`;
}

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
}

async function scrapeRemotive() {
    const jobs = [];

    // Fetch all jobs and filter locally - their category system is limited
    const categories = ['', 'data', 'analyst', 'business'];
    const seen = new Set();

    for (const cat of categories) {
        try {
            const params = { limit: 50 };
            if (cat) params.category = cat;

            const { data } = await axios.get('https://remotive.com/api/remote-jobs', {
                params,
                timeout: 15000,
            });

            const listings = data['jobs'] || [];
            for (const job of listings) {
                const titleLower = (job.title || '').toLowerCase();
                // Filter for analyst-related roles
                if (!titleLower.includes('analyst') && !titleLower.includes('analysis')
                    && !titleLower.includes('data') && !titleLower.includes('business intelligence')) continue;

                const hash = makeHash(job.title, job.company_name);
                if (seen.has(hash)) continue;
                seen.add(hash);

                const skills = Array.isArray(job.tags) ? job.tags.join(', ') : '';
                jobs.push({
                    id: uuidv4(),
                    title: job.title,
                    company: job.company_name || 'Company',
                    location: 'Remote',
                    experience: '0-3 years',
                    salary: job.salary || null,
                    source: 'Remotive',
                    source_url: 'https://remotive.com/remote-jobs',
                    apply_url: job.url,
                    description: stripHtml(job.description).slice(0, 500),
                    posted_at: job.publication_date || new Date().toISOString(),
                    fetched_at: new Date().toISOString(),
                    is_remote: 1,
                    job_hash: hash,
                    skills,
                });
            }

            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.error(`[Remotive] Error (category=${cat}):`, err.message);
        }
    }

    console.log(`[Remotive] Found ${jobs.length} analyst jobs`);
    return jobs;
}

module.exports = { scrapeRemotive };
