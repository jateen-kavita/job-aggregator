import axios from 'axios';

// All the scraper APIs (Serverless functions)
const SOURCES = ['adzuna', 'internshala', 'linkedin', 'naukri', 'remotive', 'timesjobs'];

// LocalStorage Keys
const CACHE_KEY = 'job_aggregator_cache_v2';
const APPLIED_KEY = 'job_aggregator_applied';
const STATS_KEY = 'job_aggregator_stats';

// Keep cache for 10 minutes
const CACHE_TTL = 10 * 60 * 1000;

function getAppliedJobs() {
    try {
        return JSON.parse(localStorage.getItem(APPLIED_KEY)) || {};
    } catch { return {}; }
}

function saveAppliedJobs(data) {
    localStorage.setItem(APPLIED_KEY, JSON.stringify(data));
}

export async function fetchJobs(params = {}) {
    const { source, isRemote, search, newOnly, appliedOnly, page = 1, limit = 24 } = params;

    let allJobs = [];
    let stats = { total: 0, new_count: 0, applied_count: 0, remote_count: 0, by_source: {} };

    // 1. Check Cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    let useCache = false;

    if (cachedData) {
        try {
            const parsed = JSON.parse(cachedData);
            if (Date.now() - parsed.timestamp < CACHE_TTL) {
                allJobs = parsed.jobs;
                useCache = true;
            }
        } catch (e) { }
    }

    // 2. Fetch Live if no valid cache
    if (!useCache) {
        console.log("Fetching live jobs from serverless API...");
        // Run all 6 scrapers in parallel
        const promises = SOURCES.map(src => axios.get(`/api/${src}`).catch(() => ({ data: [] })));
        const results = await Promise.allSettled(promises);

        // Combine and deduplicate
        const seen = new Set();
        results.forEach(res => {
            if (res.status === 'fulfilled' && res.value.data) {
                const jobs = res.value.data;
                if (Array.isArray(jobs)) {
                    jobs.forEach(job => {
                        if (!seen.has(job.job_hash)) {
                            seen.add(job.job_hash);
                            allJobs.push({ ...job, is_new: 1 }); // newly fetched are always marked new
                        }
                    });
                }
            }
        });

        // Save to Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), jobs: allJobs }));
    }

    // 3. Merge Applied State from localStorage
    const appliedJobsMap = getAppliedJobs();
    allJobs = allJobs.map(job => ({
        ...job,
        applied_at: appliedJobsMap[job.id] || null
    }));

    // 4. Calculate Stats (pre-filter)
    stats.total = allJobs.length;
    allJobs.forEach(job => {
        if (job.is_new) stats.new_count++;
        if (job.applied_at) stats.applied_count++;
        if (job.is_remote) stats.remote_count++;
        stats.by_source[job.source] = (stats.by_source[job.source] || 0) + 1;
    });

    // Add next fetch countdown using cache timestamp + 10 mins
    const currentCache = localStorage.getItem(CACHE_KEY);
    if (currentCache) {
        try {
            const parsed = JSON.parse(currentCache);
            stats.next_fetch = new Date(parsed.timestamp + CACHE_TTL).toISOString();
        } catch (e) { }
    }

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));

    // 5. Apply Filters
    let filtered = allJobs;
    if (source) filtered = filtered.filter(j => j.source === source);
    if (isRemote !== undefined) filtered = filtered.filter(j => j.is_remote === (isRemote === 'true' ? 1 : 0));
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(j =>
            (j.title || '').toLowerCase().includes(s) ||
            (j.company || '').toLowerCase().includes(s) ||
            (j.location || '').toLowerCase().includes(s) ||
            (j.skills || '').toLowerCase().includes(s)
        );
    }
    if (newOnly === 'true') filtered = filtered.filter(j => j.is_new);
    if (appliedOnly === 'true') filtered = filtered.filter(j => !!j.applied_at);

    // 6. Filter by Date (Max 1 month old)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    filtered = filtered.filter(j => {
        try {
            const postedDate = new Date(j.posted_at);
            return postedDate >= thirtyDaysAgo;
        } catch (e) { return true; } // Keep if date parsing fails
    });

    // 7. Custom Priority Sorting: LinkedIn -> Naukri -> Others -> Then by Date
    const sourcePriority = {
        'LinkedIn': 1,
        'Naukri': 2,
        'Internshala': 3,
        'Adzuna': 4,
        'Remotive': 5,
        'TimesJobs': 6
    };

    filtered.sort((a, b) => {
        const priorityA = sourcePriority[a.source] || 99;
        const priorityB = sourcePriority[b.source] || 99;

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        // Fallback to date if same source
        return new Date(b.posted_at) - new Date(a.posted_at);
    });

    // 8. Pagination
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
        jobs: paginated,
        pagination: {
            total: filtered.length,
            page,
            limit,
            totalPages: Math.ceil(filtered.length / limit)
        }
    };
}

export async function fetchStats() {
    try {
        const cachedStats = localStorage.getItem(STATS_KEY);
        return cachedStats ? JSON.parse(cachedStats) : null;
    } catch { return null; }
}

export async function markApplied(jobId) {
    const applied = getAppliedJobs();
    applied[jobId] = new Date().toISOString();
    saveAppliedJobs(applied);
    return { success: true };
}

export async function unmarkApplied(jobId) {
    const applied = getAppliedJobs();
    delete applied[jobId];
    saveAppliedJobs(applied);
    return { success: true };
}

export default { fetchJobs, fetchStats, markApplied, unmarkApplied };
