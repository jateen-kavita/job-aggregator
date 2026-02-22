const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { fetchAllJobs } = require('./jobManager');
const jobsRouter = require('./routes/jobs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/jobs', jobsRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Job Aggregator API', version: '1.0.0' });
});

// Start server
app.listen(PORT, async () => {
    console.log(`\n🚀 Job Aggregator API running on http://localhost:${PORT}`);
    console.log('📋 Endpoints:');
    console.log(`   GET  /api/jobs         - List jobs`);
    console.log(`   GET  /api/jobs/stats   - Statistics`);
    console.log(`   GET  /api/jobs/health  - Health check`);
    console.log(`   POST /api/jobs/:id/apply    - Mark applied`);
    console.log(`   DELETE /api/jobs/:id/apply  - Unmark applied`);

    // Initial fetch on startup
    console.log('\n⏳ Running initial job fetch...');
    try {
        await fetchAllJobs();
    } catch (err) {
        console.error('Initial fetch error:', err.message);
    }

    // Schedule hourly refresh: every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('\n⏰ Cron: Starting scheduled hourly job fetch...');
        try {
            await fetchAllJobs();
        } catch (err) {
            console.error('Scheduled fetch error:', err.message);
        }
    });
    console.log('✅ Hourly cron scheduled (runs at the top of every hour)');
});

module.exports = app;
