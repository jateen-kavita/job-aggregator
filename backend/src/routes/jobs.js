const express = require('express');
const router = express.Router();
const { getJobs, countJobs, getStats, getTotalStats, markApplied, unmarkApplied, getJobById } = require('../db');
const { getLastFetchTime, getNextFetchTime, getLastFetchResults } = require('../jobManager');

// GET /api/jobs - List jobs with filters and pagination
router.get('/', (req, res) => {
    try {
        const {
            source = null,
            isRemote = null,
            search = null,
            newOnly = null,
            appliedOnly = null,
            page = 1,
            limit = 24,
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const params = {
            source: source || null,
            isRemote: isRemote === 'true' ? 1 : isRemote === 'false' ? 0 : null,
            search: search || null,
            newOnly: newOnly === 'true' ? 1 : null,
            appliedOnly: appliedOnly === 'true' ? 1 : null,
            limit: parseInt(limit),
            offset,
        };

        const jobs = getJobs.all(params);
        const { total } = countJobs.get(params);

        res.json({
            jobs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            }
        });
    } catch (err) {
        console.error('[API] GET /jobs error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/jobs/stats - Aggregated statistics
router.get('/stats', (req, res) => {
    try {
        const sourceStats = getStats.all();
        const totals = getTotalStats.get();
        const lastFetch = getLastFetchTime();
        const nextFetch = getNextFetchTime();
        const lastResults = getLastFetchResults();

        const bySource = {};
        sourceStats.forEach(row => {
            bySource[row.source] = row.source_count;
        });

        res.json({
            total: totals.total || 0,
            new_count: totals.new_count || 0,
            applied_count: totals.applied_count || 0,
            remote_count: totals.remote_count || 0,
            by_source: bySource,
            last_fetch: lastFetch,
            next_fetch: nextFetch,
            last_fetch_results: lastResults,
        });
    } catch (err) {
        console.error('[API] GET /stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/jobs/health
router.get('/health', (req, res) => {
    const lastFetch = getLastFetchTime();
    const nextFetch = getNextFetchTime();
    res.json({
        status: 'ok',
        last_fetch: lastFetch,
        next_fetch: nextFetch,
        timestamp: new Date().toISOString(),
    });
});

// POST /api/jobs/:id/apply - Mark a job as applied
router.post('/:id/apply', (req, res) => {
    try {
        const { id } = req.params;
        const job = getJobById.get({ id });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        markApplied.run({ id, applied_at: new Date().toISOString() });
        res.json({ success: true, message: 'Marked as applied' });
    } catch (err) {
        console.error('[API] POST /apply error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/jobs/:id/apply - Unmark applied
router.delete('/:id/apply', (req, res) => {
    try {
        const { id } = req.params;
        const job = getJobById.get({ id });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        unmarkApplied.run({ id });
        res.json({ success: true, message: 'Unmarked as applied' });
    } catch (err) {
        console.error('[API] DELETE /apply error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
