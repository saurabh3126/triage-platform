import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const fetchClaims    = (params) => API.get('/claims', { params });
export const fetchClaimById = (id)     => API.get(`/claims/${id}`);
export const submitClaim    = (data)   => API.post('/claims', data);
export const reviewClaim    = (id, d)  => API.patch(`/claims/${id}/review`, d);
export const disputeClaim   = (id)     => API.patch(`/claims/${id}/dispute`);
export const fetchStats     = ()       => API.get('/claims/stats');
export const fetchTrending  = ()       => API.get('/claims/trending');
export const loginUser      = (data)   => API.post('/auth/login', data);
export const registerUser   = (data)   => API.post('/auth/register', data);
export const getMe          = ()       => API.get('/auth/me');
export const extractLinkContent = (url) => API.post('/claims/extract-link', { url });
export const analyzeWithGemini = (data) => API.post('/claims/gemini-analyze', data);
export const voteOnClaim   = (id, vote) => API.post(`/claims/${id}/vote`, { vote });
export const resolveClaim  = (id)       => API.post(`/claims/${id}/resolve`);
export default API;