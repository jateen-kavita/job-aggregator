import React, { useState, useEffect } from 'react';

const SOURCE_COLORS = {
    LinkedIn: '#0077b5',
    Indeed: '#003a9b',
    Naukri: '#f44336',
    Internshala: '#0f9d58',
    Remotive: '#7c3aed',
    TimesJobs: '#ff6600',
};

function formatCountdown(nextFetch) {
    if (!nextFetch) return 'Updating...';
    const diff = new Date(nextFetch) - new Date();
    if (diff <= 0) return 'Refreshing...';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export default function Header({ stats }) {
    const [countdown, setCountdown] = useState('--');

    useEffect(() => {
        if (!stats?.next_fetch) return;
        const tick = () => setCountdown(formatCountdown(stats.next_fetch));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [stats?.next_fetch]);

    const activeSources = stats?.by_source ? Object.keys(stats.by_source).length : 0;

    return (
        <header className="header">
            <div className="header-logo">
                <div className="logo-icon">🎯</div>
                <div>
                    <div className="logo-text">JobSync</div>
                    <div className="logo-sub">Analyst Jobs · 0–3 Years · Pan India + Remote</div>
                </div>
            </div>

            <div className="header-right">
                {stats && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {Object.entries(SOURCE_COLORS).map(([src, color]) => (
                                stats.by_source?.[src] ? (
                                    <div key={src} style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: color, title: src
                                    }} title={`${src}: ${stats.by_source[src]}`} />
                                ) : null
                            ))}
                        </div>
                        <div className="refresh-info">
                            <div className="refresh-label">Next refresh in</div>
                            <div className="refresh-timer">{countdown}</div>
                        </div>
                    </>
                )}
                <div className="refresh-dot" title="Live" />
            </div>
        </header>
    );
}
