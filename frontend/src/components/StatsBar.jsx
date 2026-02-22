import React from 'react';

const SOURCE_COLORS = {
    LinkedIn: '#0077b5',
    Indeed: '#003a9b',
    Naukri: '#f44336',
    Internshala: '#0f9d58',
    Remotive: '#7c3aed',
    TimesJobs: '#ff6600',
};

export default function StatsBar({ stats }) {
    if (!stats) return (
        <div className="stats-bar">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="stat-item">
                    <div className="skeleton" style={{ width: 48, height: 26, marginBottom: 4 }} />
                    <div className="skeleton" style={{ width: 64, height: 12 }} />
                </div>
            ))}
        </div>
    );

    const sources = stats.by_source || {};

    return (
        <div className="stats-bar">
            <div className="stat-item">
                <div className="stat-value">{stats.total?.toLocaleString() || 0}</div>
                <div className="stat-label">Total Jobs</div>
            </div>
            <div className="stat-item">
                <div className="stat-value new">{stats.new_count || 0}</div>
                <div className="stat-label">🆕 Just Added</div>
            </div>
            <div className="stat-item">
                <div className="stat-value remote">{stats.remote_count || 0}</div>
                <div className="stat-label">🌐 Remote</div>
            </div>
            <div className="stat-item">
                <div className="stat-value applied">{stats.applied_count || 0}</div>
                <div className="stat-label">✅ Applied</div>
            </div>

            <div className="source-pills">
                {Object.entries(sources).map(([src, count]) => (
                    <div key={src} className="source-pill">
                        <div
                            className="source-dot"
                            style={{ background: SOURCE_COLORS[src] || '#6b7280' }}
                        />
                        {src}
                        <span style={{ opacity: 0.6, fontSize: 11 }}>{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
