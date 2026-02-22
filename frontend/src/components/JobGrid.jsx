import React from 'react';
import JobCard from './JobCard';

function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton" style={{ width: 60, height: 20 }} />
                <div className="skeleton" style={{ width: 80, height: 20 }} />
            </div>
            <div>
                <div className="skeleton" style={{ width: '80%', height: 18, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '50%', height: 14 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton" style={{ width: '60%', height: 12 }} />
                <div className="skeleton" style={{ width: '45%', height: 12 }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
                <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 40, height: 36, borderRadius: 6 }} />
            </div>
        </div>
    );
}

function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <div className="pagination">
            <button
                className="page-btn"
                onClick={() => onPageChange(1)}
                disabled={page === 1}
                title="First page"
            >«</button>
            <button
                className="page-btn"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
            >‹</button>
            {pages.map(p => (
                <button
                    key={p}
                    className={`page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => onPageChange(p)}
                >{p}</button>
            ))}
            <button
                className="page-btn"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
            >›</button>
            <button
                className="page-btn"
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages}
                title="Last page"
            >»</button>
        </div>
    );
}

export default function JobGrid({ jobs, loading, total, page, totalPages, onPageChange, onApply, filters }) {
    const hasActiveFilter = filters.source || filters.isRemote !== '' || filters.search || filters.newOnly || filters.appliedOnly;

    if (loading) {
        return (
            <div>
                <div className="grid-header">
                    <div className="grid-title">Loading jobs...</div>
                </div>
                <div className="job-grid">
                    {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    if (!jobs || jobs.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <div className="empty-title">
                    {hasActiveFilter ? 'No jobs match your filters' : 'Jobs are loading...'}
                </div>
                <div className="empty-sub">
                    {hasActiveFilter
                        ? 'Try clearing some filters or broadening your search.'
                        : 'The backend is fetching real jobs from LinkedIn, Indeed, Naukri and more. This may take a few minutes on first run.'}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="grid-header">
                <div className="grid-title">
                    Showing <strong>{jobs.length}</strong> of <strong>{total?.toLocaleString()}</strong> analyst jobs
                    {filters.newOnly && ' · 🆕 New only'}
                    {filters.appliedOnly && ' · ✅ Applied only'}
                    {filters.source && ` · ${filters.source}`}
                    {filters.isRemote === 'true' && ' · 🌐 Remote'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Page {page} of {totalPages}
                </div>
            </div>

            <div className="job-grid">
                {jobs.map(job => (
                    <JobCard
                        key={job.id}
                        job={job}
                        onApply={onApply}
                    />
                ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
    );
}
