import React from 'react';
import JobCard from './JobCard';

export default function JobGrid({ jobs, loading, total, page, totalPages, onPageChange, onApply, filters }) {
    const hasActiveFilters = filters.source || filters.isRemote !== '' || filters.search || filters.newOnly || filters.appliedOnly;

    return (
        <div>
            {/* Results Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#191919' }}>
                    {loading ? 'Finding jobs...' : (
                        <>
                            {total} <span style={{ color: '#666', fontWeight: 400 }}>Analyst Jobs {hasActiveFilters ? 'Found' : ''}</span>
                        </>
                    )}
                </h2>

                {/* Active Filter Summary tag */}
                {hasActiveFilters && !loading && (
                    <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>Sorted by:</span>
                        <span style={{ background: '#e0dfdc', padding: '2px 8px', borderRadius: '4px', color: '#333' }}>Priority (LinkedIn > Naukri)</span>
                    </div>
                )}
            </div>

            {/* Grid */}
            <div className="job-grid">
                {loading ? (
                    // Skeletons
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-card loading-skeleton" />
                    ))
                ) : jobs.length > 0 ? (
                    jobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onApply={onApply}
                        />
                    ))
                ) : (
                    // Empty State
                    <div style={{ gridColumn: '1 / -1' }} className="empty-state">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3>No jobs found</h3>
                        <p style={{ maxWidth: '400px', margin: '0 auto' }}>
                            We couldn't find any recent analyst jobs matching your exact filters.
                            Try removing some filters or check back later!
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    marginTop: '1.5rem',
                                    background: '#0a66c2',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* End of results hint */}
            {!loading && totalPages > 0 && page === totalPages && (
                <div style={{ textAlign: 'center', marginTop: '3rem', color: '#999', fontSize: '0.85rem' }}>
                    You've reached the end of the list. We only show jobs posted within the last 30 days!
                </div>
            )}
        </div>
    );
}
