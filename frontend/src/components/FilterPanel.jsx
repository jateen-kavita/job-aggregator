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
        <div className="filter-panel">
            {/* Search */}
            <div className="filter-group">
                <label>Search</label>
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
            <div className="filter-group">
                <label>Quick Filters</label>
                <div className="quick-filters">
                    <label className="checkbox-label" style={{ fontWeight: 500 }}>
                        <input
                            type="checkbox"
                            checked={filters.newOnly}
                            onChange={() => update('newOnly', !filters.newOnly)}
                        />
                        Newly Added Only
                    </label>
                    <label className="checkbox-label" style={{ fontWeight: 500 }}>
                        <input
                            type="checkbox"
                            checked={filters.appliedOnly}
                            onChange={() => update('appliedOnly', !filters.appliedOnly)}
                        />
                        Already Applied Only
                    </label>
                </div>
            </div>

            {/* Job Type */}
            <div className="filter-group">
                <label>Location Type</label>
                <div className="toggle-group">
                    <button
                        className={`toggle-btn ${filters.isRemote === '' ? 'active' : ''}`}
                        onClick={() => update('isRemote', '')}
                    >
                        All
                    </button>
                    <button
                        className={`toggle-btn ${filters.isRemote === 'true' ? 'active' : ''}`}
                        onClick={() => update('isRemote', 'true')}
                    >
                        Remote
                    </button>
                    <button
                        className={`toggle-btn ${filters.isRemote === 'false' ? 'active' : ''}`}
                        onClick={() => update('isRemote', 'false')}
                    >
                        Onsite
                    </button>
                </div>
            </div>

            {/* Source Filter */}
            <div className="filter-group">
                <label>Source Platform</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                        style={{
                            background: !filters.source ? '#f3f2ef' : 'transparent',
                            border: '1px solid #e0dfdc',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: !filters.source ? 600 : 400
                        }}
                        onClick={() => update('source', '')}
                    >
                        <span>All Sources</span>
                        <span style={{ color: '#666' }}>{stats?.total || 0}</span>
                    </button>
                    {SOURCES.map(src => (
                        <button
                            key={src}
                            onClick={() => update('source', filters.source === src ? '' : src)}
                            style={{
                                background: filters.source === src ? `${SOURCE_COLORS[src]}11` : 'transparent',
                                border: `1px solid ${filters.source === src ? SOURCE_COLORS[src] : '#e0dfdc'}`,
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontWeight: filters.source === src ? 600 : 400
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: SOURCE_COLORS[src] }} />
                                {src}
                            </span>
                            <span style={{ color: '#666' }}>{bySource[src] || 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Clear */}
            {hasActiveFilters && (
                <button
                    onClick={clearAll}
                    style={{
                        width: '100%',
                        padding: '8px',
                        background: 'transparent',
                        border: '1px solid #cc1016',
                        color: '#cc1016',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Clear All Filters
                </button>
            )}
        </div>
    );
}
