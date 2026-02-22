/**
 * Naukri Scraper - Uses Naukri's internal API endpoint
 */
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
    'Referer': 'https://www.naukri.com/',
    'appid': '109',
    'systemid': 'Naukri',
    'x-http-method-override': 'GET',
    'Content-Type': 'application/json',
};

function makeHash(title, company, location) {
    const str = `naukri:${title}:${company}:${location}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `naukri_${Math.abs(hash)}`;
}

async function scrapeNaukri() {
    const jobs = [];
    // Naukri job API - works without auth for basic search
    const searches = [
        { keyword: 'analyst', experience: 0 },
        { keyword: 'data analyst', experience: 0 },
        { keyword: 'business analyst', experience: 0 },
    ];

    for (const search of searches) {
        try {
            // Naukri's public search API
            const url = `https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_keyword&searchType=adv&keyword=${encodeURIComponent(search.keyword)}&experience=${search.experience}&k=${encodeURIComponent(search.keyword)}&seoKey=analyst-jobs&src=jobsearchDesk&latLong=`;

            const { data } = await axios.get(url, {
                headers: HEADERS,
                timeout: 20000,
            });

            const jobsList = data?.jobDetails || data?.jobs || data?.data?.jobs || [];

            if (Array.isArray(jobsList)) {
                for (const job of jobsList) {
                    const title = job.title || job.jobTitle || '';
                    const company = job.companyName || job.company || '';
                    const locations = (job.placeholders || []).find(p => p.type === 'location');
                    const location = locations?.label || job.location || 'India';
                    const salary = job.salary || job.packageInLacs || null;
                    const exp = job.experienceText || job.experience || '0-3 years';
                    const applyUrl = job.jdURL || `https://www.naukri.com${job.jobLink || ''}`;
                    const skillsArr = job.tagsAndSkills || job.keySkills || job.skills || [];
                    const skills = Array.isArray(skillsArr) ? skillsArr.join(', ') : skillsArr;
                    const desc = job.jobDescription || job.description || '';
                    const dateText = job.createdDate || job.footerPlaceholderLabel || '';
                    const isRemote = (location.toLowerCase().includes('remote') || location.toLowerCase().includes('work from home')) ? 1 : 0;

                    if (!title) continue;

                    const hash = makeHash(title, company, location);
                    jobs.push({
                        id: uuidv4(),
                        title,
                        company: company || 'Company',
                        location,
                        experience: exp,
                        salary: salary ? String(salary) : null,
                        source: 'Naukri',
                        source_url: `https://www.naukri.com/${search.keyword.replace(/ /g, '-')}-jobs`,
                        apply_url: applyUrl,
                        description: typeof desc === 'string' ? desc.replace(/<[^>]*>/g, '').slice(0, 500) : null,
                        posted_at: dateText || new Date().toISOString(),
                        fetched_at: new Date().toISOString(),
                        is_remote: isRemote,
                        job_hash: hash,
                        skills: typeof skills === 'string' ? skills : '',
                    });
                }
            }

            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            console.error(`[Naukri] Error for "${search.keyword}":`, err.message);
        }
    }

    // Deduplicate
    const seen = new Set();
    const unique = jobs.filter(j => {
        if (seen.has(j.job_hash)) return false;
        seen.add(j.job_hash);
        return true;
    });

    console.log(`[Naukri] Found ${unique.length} jobs`);
    return unique;
}

module.exports = { scrapeNaukri };
