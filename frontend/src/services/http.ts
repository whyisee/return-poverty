import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
});

http.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.detail || error.response?.data?.message || '请求失败，请稍后重试';
    return Promise.reject(new Error(message));
  },
);

