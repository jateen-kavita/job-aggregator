import React from 'react';

const SOURCE_COLORS = {
    LinkedIn: '#0077b5',
    Indeed: '#003a9b',
    Naukri: '#f44336',
    Internshala: '#0f9d58',
    Remotive: '#7c3aed',
    TimesJobs: '#ff6600',
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function JobCard({ job, onApply }) {
    const isApplied = !!job.applied_at;
    const isNew = !!job.is_new;
    const isRemote = !!job.is_remote;
    const sourceColor = SOURCE_COLORS[job.source] || '#6b7280';

    const skills = job.skills ? job.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4) : [];

    function handleApplyClick(e) {
        e.stopPropagation();
        // Open the job URL
        if (job.apply_url) {
            window.open(job.apply_url, '_blank', 'noopener,noreferrer');
        }
        // Also mark as applied if not already
        if (!isApplied) {
            onApply(job.id, false);
        }
    }

    function handleTrackClick(e) {
        e.stopPropagation();
        onApply(job.id, isApplied);
    }

    return (
        <div
            className={`job-card ${isNew ? 'is-new' : ''} ${isApplied ? 'is-applied' : ''}`}
            style={{ '--source-color': sourceColor }}
        >
            {/* Top Row: Badges + Source */}
            <div className="card-top">
                <div className="card-badges">
                    {isNew && <span className="badge badge-new">🆕 New</span>}
                    {isRemote && <span className="badge badge-remote">🌐 Remote</span>}
                    {isApplied && <span className="badge badge-applied">✅ Applied</span>}
                </div>
                <span
                    className="source-badge"
                    style={{ background: sourceColor }}
                >
                    {job.source}
                </span>
            </div>

            {/* Title + Company */}
            <div>
                <div className="card-title">{job.title}</div>
                <div className="card-company">🏢 {job.company}</div>
            </div>

            {/* Meta */}
            <div className="card-meta">
                {job.location && (
                    <div className="card-meta-item">
                        <span className="card-meta-icon">📍</span>
                        <span>{job.location}</span>
                    </div>
                )}
                {job.experience && (
                    <div className="card-meta-item">
                        <span className="card-meta-icon">💼</span>
                        <span>{job.experience}</span>
                    </div>
                )}
                {job.salary && (
                    <div className="card-meta-item">
                        <span className="card-meta-icon">💰</span>
                        <span>{job.salary}</span>
                    </div>
                )}
                <div className="card-meta-item">
                    <span className="card-meta-icon">🕐</span>
                    <span style={{ color: isNew ? 'var(--new-badge)' : undefined }}>
                        {isNew ? '🆕 ' : ''}{timeAgo(job.fetched_at)}
                    </span>
                </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
                <div className="card-skills">
                    {skills.map((s, i) => (
                        <span key={i} className="skill-tag">{s}</span>
                    ))}
                </div>
            )}

            {/* Description */}
            {job.description && (
                <div className="card-description">{job.description}</div>
            )}

            {/* Footer: Apply + Track */}
            <div className="card-footer">
                <button
                    className="apply-btn"
                    onClick={handleApplyClick}
                    id={`apply-btn-${job.id}`}
                    title={`Apply on ${job.source}`}
                >
                    Apply on {job.source} ↗
                </button>
                <button
                    className={`track-btn ${isApplied ? 'tracked' : ''}`}
                    onClick={handleTrackClick}
                    title={isApplied ? 'Remove from applied' : 'Mark as applied'}
                    id={`track-btn-${job.id}`}
                >
                    {isApplied ? '✅' : '📌'}
                </button>
            </div>
        </div>
    );
}
