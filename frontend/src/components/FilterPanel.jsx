import React, { useState } from 'react';

const SOURCES = ['LinkedIn', 'Indeed', 'Naukri', 'Internshala', 'Remotive', 'TimesJobs'];

const SOURCE_COLORS = {
    LinkedIn: '#0077b5',
    Indeed: '#003a9b',
    Naukri: '#f44336',
    Internshala: '#0f9d58',
    Remotive: '#7c3aed',
    TimesJobs: '#ff6600',
};

const SOURCE_EMOJIS = {
    LinkedIn: '💼',
    Indeed: '🔍',
    Naukri: '🇮🇳',
    Internshala: '🎓',
    Remotive: '🌐',
    TimesJobs: '⏰',
};

export default function FilterPanel({ filters, onChange, stats }) {
    const [searchVal, setSearchVal] = useState(filters.search);

    function update(key, value) {
        onChange({ ...filters, [key]: value });
    }

    function handleSearchSubmit(e) {
        e.preventDefault();
        update('search', searchVal);
    }

    function clearAll() {
        setSearchVal('');
        onChange({ source: '', isRemote: '', search: '', newOnly: false, appliedOnly: false });
    }

    const bySource = stats?.by_source || {};
    const hasActiveFilters = filters.source || filters.isRemote !== '' || filters.search || filters.newOnly || filters.appliedOnly;

    return (
        <div>
            {/* Search */}
            <div className="filter-section">
                <div className="filter-title">🔍 Search</div>
                <form onSubmit={handleSearchSubmit}>
                    <input
                        id="search-input"
                        type="text"
                        className="search-input"
                        placeholder="Role, company, skill..."
                        value={searchVal}
                        onChange={e => setSearchVal(e.target.value)}
                    />
                </form>
            </div>

            {/* Quick Filters */}
            <div className="filter-section">
                <div className="filter-title">✨ Quick Filters</div>
                <div className="filter-chip-group">
                    <button
                        className={`toggle-chip ${filters.newOnly ? 'active' : ''}`}
                        onClick={() => update('newOnly', !filters.newOnly)}
                    >
                        <span>🆕 Newly Added</span>
                        <span className="toggle-icon">{filters.newOnly ? '✓' : ''}</span>
                    </button>
                    <button
                        className={`toggle-chip ${filters.appliedOnly ? 'active' : ''}`}
                        onClick={() => update('appliedOnly', !filters.appliedOnly)}
                    >
                        <span>✅ Already Applied</span>
                        <span className="toggle-icon">{filters.appliedOnly ? '✓' : ''}</span>
                    </button>
                </div>
            </div>

            {/* Job Type */}
            <div className="filter-section">
                <div className="filter-title">🌍 Location Type</div>
                <div className="filter-chip-group">
                    <button
                        className={`filter-chip ${filters.isRemote === '' ? 'active' : ''}`}
                        onClick={() => update('isRemote', '')}
                    >
                        🗂️ All Jobs
                    </button>
                    <button
                        className={`filter-chip ${filters.isRemote === 'true' ? 'active' : ''}`}
                        onClick={() => update('isRemote', 'true')}
                    >
                        🌐 Remote Only
                    </button>
                    <button
                        className={`filter-chip ${filters.isRemote === 'false' ? 'active' : ''}`}
                        onClick={() => update('isRemote', 'false')}
                    >
                        🏢 Onsite / Hybrid
                    </button>
                </div>
            </div>

            {/* Source Filter */}
            <div className="filter-section">
                <div className="filter-title">📡 Source Platform</div>
                <div className="filter-chip-group">
                    <button
                        className={`filter-chip ${!filters.source ? 'active' : ''}`}
                        onClick={() => update('source', '')}
                    >
                        <span>All Sources</span>
                        <span className="count">{stats?.total || 0}</span>
                    </button>
                    {SOURCES.map(src => (
                        <button
                            key={src}
                            className={`filter-chip ${filters.source === src ? 'active' : ''}`}
                            onClick={() => update('source', filters.source === src ? '' : src)}
                            style={filters.source === src ? {
                                background: `${SOURCE_COLORS[src]}22`,
                                borderColor: SOURCE_COLORS[src],
                            } : {}}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <span
                                    style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: SOURCE_COLORS[src], flexShrink: 0
                                    }}
                                />
                                {SOURCE_EMOJIS[src]} {src}
                            </span>
                            <span className="count">{bySource[src] || 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Clear */}
            {hasActiveFilters && (
                <div className="filter-section">
                    <button className="clear-btn" onClick={clearAll}>✕ Clear All Filters</button>
                </div>
            )}
        </div>
    );
}
