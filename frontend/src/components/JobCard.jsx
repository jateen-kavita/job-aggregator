import React from 'react';

const SOURCE_COLORS = {
    LinkedIn: '#0077b5',
    Indeed: '#003a9b',
    Naukri: '#f44336',
    Internshala: '#0f9d58',
    Remotive: '#7c3aed',
    TimesJobs: '#ff6600',
    Adzuna: '#1b8354'
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
        if (job.apply_url) window.open(job.apply_url, '_blank', 'noopener,noreferrer');
        if (!isApplied) onApply(job.id, false);
    }

    function handleTrackClick(e) {
        e.stopPropagation();
        onApply(job.id, isApplied);
    }

    return (
        <div className={`job-card ${isNew ? 'is-new' : ''} ${isApplied ? 'is-applied' : ''}`} style={{ '--source-color': sourceColor }}>

            <div className="badges">
                {isNew && <span className="badge new">New</span>}
                {isRemote && <span className="badge remote">Remote</span>}
                {isApplied && <span className="badge applied">Applied</span>}
            </div>

            <div className="job-header">
                <h3 className="job-title">{job.title}</h3>
                <p className="job-company">{job.company}</p>
                {job.location && (
                    <p className="job-location">
                        <span style={{ opacity: 0.6 }}>📍</span> {job.location}
                    </p>
                )}
            </div>

            <div className="job-meta">
                {job.experience && (
                    <div className="meta-item">
                        <span style={{ opacity: 0.6 }}>💼</span> {job.experience}
                    </div>
                )}
                {job.salary && (
                    <div className="meta-item">
                        <span style={{ opacity: 0.6 }}>💰</span> {job.salary}
                    </div>
                )}
                <div className="meta-item" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                    {timeAgo(job.posted_at)}
                </div>
            </div>

            {skills.length > 0 && (
                <div className="job-skills">
                    {skills.map((s, i) => (
                        <span key={i} className="skill-tag">{s}</span>
                    ))}
                </div>
            )}

            {job.description && (
                <div className="job-desc">{job.description}</div>
            )}

            <div className="job-actions">
                <span className="source-badge" style={{ color: sourceColor }}>
                    {job.source}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className={`track-btn ${isApplied ? 'tracked' : ''}`} onClick={handleTrackClick} title={isApplied ? 'Remove from applied' : 'Mark as applied'}>
                        {isApplied ? '✅' : '📌'}
                    </button>
                    <button className="apply-btn" onClick={handleApplyClick} title={`Apply on ${job.source}`}>
                        Apply {job.source !== 'LinkedIn' ? '↗' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}
