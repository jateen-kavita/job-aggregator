import React from 'react';

const ICONS = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
};

export default function Toast({ type, message }) {
    return (
        <div className={`toast ${type}`}>
            <span>{ICONS[type] || '💬'}</span>
            <span>{message}</span>
        </div>
    );
}
