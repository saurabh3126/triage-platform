import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Automatically inject JWT token from localStorage if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Claims API
export const fetchClaims = (params) => API.get('/claims', { params });
export const fetchClaimById = (id) => API.get(`/claims/${id}`);
export const submitClaim = (data) => API.post('/claims', data);
export const reviewClaim = (id, data) => API.patch(`/claims/${id}/review`, data);
export const disputeClaim = (id) => API.patch(`/claims/${id}/dispute`);
export const fetchStats = () => API.get('/claims/stats');
export const fetchTrending = () => API.get('/claims/trending');

// Auth API
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');

export default API;