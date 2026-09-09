import axios from 'axios';
import { tokenStorage } from '../storage/tokenStorage';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api';
const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production' || !__DEV__;
if (isProduction && !baseURL.startsWith('https://')) {
  throw new Error('Production mobile builds require EXPO_PUBLIC_API_URL to use HTTPS');
}
export const api = axios.create({ baseURL, timeout: 10000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, async (error) => {
  if (error.response?.status === 401) await tokenStorage.clear();
  return Promise.reject(error);
});
