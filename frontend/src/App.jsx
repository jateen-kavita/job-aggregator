import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import JobGrid from './components/JobGrid';
import StatsBar from './components/StatsBar';
import Toast from './components/Toast';
import { fetchJobs, fetchStats, markApplied, unmarkApplied } from './services/api';
import './App.css';

function App() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toasts, setToasts] = useState([]);

  const [filters, setFilters] = useState({
    source: '',
    isRemote: '',
    search: '',
    newOnly: false,
    appliedOnly: false,
  });

  useEffect(() => {
    loadJobs(1, filters);
    loadStats();
    document.title = 'JobSync – Analyst Jobs Aggregator';
  }, []);

  // Poll every 30 seconds for live updates to stats or cache expiration
  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs(page, filters);
    }, 30000);
    return () => clearInterval(interval);
  }, [page, filters]);

  async function loadJobs(pageNum = 1, activeFilters = filters) {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        limit: 24,
        ...(activeFilters.source && { source: activeFilters.source }),
        ...(activeFilters.isRemote !== '' && { isRemote: activeFilters.isRemote }),
        ...(activeFilters.search && { search: activeFilters.search }),
        ...(activeFilters.newOnly && { newOnly: 'true' }),
        ...(activeFilters.appliedOnly && { appliedOnly: 'true' }),
      };
      const data = await fetchJobs(params);
      setJobs(data.jobs || []);
      setTotalPages(data.pagination.totalPages || 1);
      setTotal(data.pagination.total || 0);
      setPage(pageNum);
    } catch (err) {
      addToast('error', 'Failed to load jobs.');
    } finally {
      setLoading(false);
      loadStats();
    }
  }

  async function loadStats() {
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err) {
      // silent fail for stats
    }
  }

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    loadJobs(1, newFilters);
  }

  async function handleApply(jobId, currentlyApplied) {
    try {
      if (currentlyApplied) {
        await unmarkApplied(jobId);
        addToast('info', 'Application removed');
      } else {
        await markApplied(jobId);
        addToast('success', 'Marked as applied! 🎉');
      }
      // Update job in local state
      setJobs(prev => prev.map(j =>
        j.id === jobId
          ? { ...j, applied_at: currentlyApplied ? null : new Date().toISOString() }
          : j
      ));
      loadStats();
    } catch (err) {
      addToast('error', 'Failed to update application status');
    }
  }

  function addToast(type, message) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }

  return (
    <div className="app">
      <Header stats={stats} />
      <StatsBar stats={stats} />
      <div className="main-layout">
        <aside className="sidebar">
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            stats={stats}
          />
        </aside>
        <main className="content">
          <JobGrid
            jobs={jobs}
            loading={loading}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => loadJobs(p, filters)}
            onApply={handleApply}
            filters={filters}
          />
        </main>
      </div>
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} type={t.type} message={t.message} />
        ))}
      </div>
    </div>
  );
}

export default App;
