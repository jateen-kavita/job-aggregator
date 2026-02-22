const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/jobs.db');

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    experience TEXT,
    salary TEXT,
    source TEXT NOT NULL,
    source_url TEXT,
    apply_url TEXT,
    description TEXT,
    posted_at TEXT,
    fetched_at TEXT NOT NULL,
    is_remote INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 1,
    applied_at TEXT DEFAULT NULL,
    job_hash TEXT UNIQUE NOT NULL,
    skills TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
  CREATE INDEX IF NOT EXISTS idx_jobs_is_new ON jobs(is_new);
  CREATE INDEX IF NOT EXISTS idx_jobs_is_remote ON jobs(is_remote);
  CREATE INDEX IF NOT EXISTS idx_jobs_fetched_at ON jobs(fetched_at);
  CREATE INDEX IF NOT EXISTS idx_jobs_applied_at ON jobs(applied_at);
  CREATE INDEX IF NOT EXISTS idx_jobs_hash ON jobs(job_hash);

  CREATE TABLE IF NOT EXISTS scrape_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    jobs_found INTEGER DEFAULT 0,
    jobs_new INTEGER DEFAULT 0,
    error TEXT,
    scraped_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Helper: upsert job (insert or skip if hash exists)
const insertJob = db.prepare(`
  INSERT OR IGNORE INTO jobs 
    (id, title, company, location, experience, salary, source, source_url, apply_url, description, posted_at, fetched_at, is_remote, is_new, job_hash, skills)
  VALUES 
    (@id, @title, @company, @location, @experience, @salary, @source, @source_url, @apply_url, @description, @posted_at, @fetched_at, @is_remote, 1, @job_hash, @skills)
`);

const resetNewFlags = db.prepare(`UPDATE jobs SET is_new = 0 WHERE is_new = 1`);

const getJobs = db.prepare(`
  SELECT * FROM jobs
  WHERE 
    (@source IS NULL OR source = @source)
    AND (@isRemote IS NULL OR is_remote = @isRemote)
    AND (@newOnly IS NULL OR is_new = 1)
    AND (@appliedOnly IS NULL OR applied_at IS NOT NULL)
    AND (@search IS NULL OR (
      title LIKE '%' || @search || '%' 
      OR company LIKE '%' || @search || '%'
      OR location LIKE '%' || @search || '%'
      OR skills LIKE '%' || @search || '%'
    ))
  ORDER BY 
    is_new DESC,
    fetched_at DESC
  LIMIT @limit OFFSET @offset
`);

const countJobs = db.prepare(`
  SELECT COUNT(*) as total FROM jobs
  WHERE 
    (@source IS NULL OR source = @source)
    AND (@isRemote IS NULL OR is_remote = @isRemote)
    AND (@newOnly IS NULL OR is_new = 1)
    AND (@appliedOnly IS NULL OR applied_at IS NOT NULL)
    AND (@search IS NULL OR (
      title LIKE '%' || @search || '%' 
      OR company LIKE '%' || @search || '%'
      OR location LIKE '%' || @search || '%'
      OR skills LIKE '%' || @search || '%'
    ))
`);

const getStats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_new = 1 THEN 1 ELSE 0 END) as new_count,
    SUM(CASE WHEN applied_at IS NOT NULL THEN 1 ELSE 0 END) as applied_count,
    SUM(CASE WHEN is_remote = 1 THEN 1 ELSE 0 END) as remote_count,
    source,
    COUNT(*) as source_count
  FROM jobs
  GROUP BY source
`);

const getTotalStats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN is_new = 1 THEN 1 ELSE 0 END) as new_count,
    SUM(CASE WHEN applied_at IS NOT NULL THEN 1 ELSE 0 END) as applied_count,
    SUM(CASE WHEN is_remote = 1 THEN 1 ELSE 0 END) as remote_count
  FROM jobs
`);

const markApplied = db.prepare(`UPDATE jobs SET applied_at = @applied_at WHERE id = @id`);
const unmarkApplied = db.prepare(`UPDATE jobs SET applied_at = NULL WHERE id = @id`);
const getJobById = db.prepare(`SELECT * FROM jobs WHERE id = @id`);

const setState = db.prepare(`INSERT OR REPLACE INTO app_state (key, value) VALUES (@key, @value)`);
const getState = db.prepare(`SELECT value FROM app_state WHERE key = @key`);

const logScrape = db.prepare(`
  INSERT INTO scrape_logs (source, status, jobs_found, jobs_new, error, scraped_at)
  VALUES (@source, @status, @jobs_found, @jobs_new, @error, @scraped_at)
`);

module.exports = {
  db,
  insertJob,
  resetNewFlags,
  getJobs,
  countJobs,
  getStats,
  getTotalStats,
  markApplied,
  unmarkApplied,
  getJobById,
  setState,
  getState,
  logScrape
};
