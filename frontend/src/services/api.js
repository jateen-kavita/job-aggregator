import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
});

export async function fetchJobs(params = {}) {
    const { data } = await api.get('/jobs', { params });
    return data;
}

export async function fetchStats() {
    const { data } = await api.get('/jobs/stats');
    return data;
}

export async function fetchHealth() {
    const { data } = await api.get('/jobs/health');
    return data;
}

export async function markApplied(jobId) {
    const { data } = await api.post(`/jobs/${jobId}/apply`);
    return data;
}

export async function unmarkApplied(jobId) {
    const { data } = await api.delete(`/jobs/${jobId}/apply`);
    return data;
}

export default api;
