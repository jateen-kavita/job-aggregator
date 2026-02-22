import axios from 'axios';

// All the scraper APIs (Serverless functions)
const SOURCES = ['adzuna', 'internshala', 'linkedin', 'naukri', 'remotive', 'timesjobs'];

// LocalStorage Keys
const CACHE_KEY = 'job_aggregator_cache';
const APPLIED_KEY = 'job_aggregator_applied';
const STATS_KEY = 'job_aggregator_stats';

// Keep cache for 30 minutes
const CACHE_TTL = 30 * 60 * 1000;

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

    // 6. Pagination
    filtered.sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
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
