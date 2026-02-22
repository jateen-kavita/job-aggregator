import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'appid': '109', 'systemid': 'Naukri',
};

function makeHash(title, company, location) {
    const str = `naukri:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return `naukri_${Math.abs(hash)}`;
}

export default async function handler(req, res) {
    try {
        const jobs = [];
        const url = `https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_keyword&searchType=adv&keyword=analyst&experience=0&k=analyst&seoKey=analyst-jobs&src=jobsearchDesk&latLong=`;

        const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        const jobsList = data?.jobDetails || data?.jobs || data?.data?.jobs || [];

        if (Array.isArray(jobsList)) {
            for (const job of jobsList.slice(0, 20)) {
                const title = job.title || job.jobTitle || '';
                const company = job.companyName || job.company || '';
                const locations = (job.placeholders || []).find(p => p.type === 'location');
                const location = locations?.label || job.location || 'India';

                if (!title) continue;

                const skillsArr = job.tagsAndSkills || job.keySkills || job.skills || [];
                const desc = job.jobDescription || job.description || '';

                jobs.push({
                    id: uuidv4(),
                    title, company: company || 'Company', location,
                    experience: job.experienceText || job.experience || '0-3 years',
                    salary: job.salary ? String(job.salary) : null,
                    source: 'Naukri', source_url: 'https://www.naukri.com/analyst-jobs', apply_url: job.jdURL || `https://www.naukri.com${job.jobLink || ''}`,
                    description: typeof desc === 'string' ? desc.replace(/<[^>]*>/g, '').slice(0, 500) : null,
                    posted_at: job.createdDate || job.footerPlaceholderLabel || new Date().toISOString(),
                    fetched_at: new Date().toISOString(),
                    is_remote: (location.toLowerCase().includes('remote') || location.toLowerCase().includes('work from home')) ? 1 : 0,
                    job_hash: makeHash(title, company, location),
                    skills: Array.isArray(skillsArr) ? skillsArr.join(', ') : (typeof skillsArr === 'string' ? skillsArr : '')
                });
            }
        }

        res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
        res.status(200).json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message, jobs: [] });
    }
}
