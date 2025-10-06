import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config';

// Keys must stay in sync with AuthContext
const TOKEN_KEY = 'auth.token';

// Base instance
const api = axios.create({
  baseURL: `${BACKEND_URL.replace(/\/$/, '')}/v1`,
  timeout: 30000,
});

let inMemoryToken = null;

export const setAuthToken = (token) => {
  inMemoryToken = token || null;
};

// Request interceptor to inject Authorization header
api.interceptors.request.use(async (config) => {
  try {
    // Prefer in-memory (from context). Fallback to AsyncStorage for edge refresh scenarios.
    let token = inMemoryToken;
    if (!token) {
      token = await AsyncStorage.getItem(TOKEN_KEY);
    }
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // silent fail
    // console.warn('Auth header inject failed', e);
  }
  return config;
});

// Optional response interceptor for centralized 401 handling
let onUnauthorizedHandler = null;
export const registerUnauthorizedHandler = (fn) => { onUnauthorizedHandler = fn; };

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401) {
      if (typeof onUnauthorizedHandler === 'function') {
        try { await onUnauthorizedHandler(err); } catch {}
      }
    }
    return Promise.reject(err);
  }
);

export default api;
