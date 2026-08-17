import axios from 'axios';
import { extractToken, normalizeItem } from '../utils/api';
import { API_BASE_URL, API_TIMEOUT, SEND_CREDENTIALS } from '../config/env';

const parseEndpointList = (value, fallback) => {
  if (!value) return fallback;

  const endpoints = value.
    split(',').
    map((item) => item.trim()).
    filter(Boolean).
    map((item) => item.startsWith('/') ? item : `/${item}`);

  return endpoints.length ? endpoints : fallback;
};

const AUTH_USER_ENDPOINTS = parseEndpointList(import.meta.env.VITE_AUTH_ME_ROUTES, [
  '/auth/me',
  '/auth/user',
  '/me',
  '/user',
  '/profile']
);
const AUTH_LOGIN_ENDPOINTS = parseEndpointList(import.meta.env.VITE_AUTH_LOGIN_ROUTES, [
  '/auth/login',
  '/login']
);
const AUTH_REGISTER_ENDPOINTS = parseEndpointList(import.meta.env.VITE_AUTH_REGISTER_ROUTES, [
  '/auth/register',
  '/register']
);
const AUTH_LOGOUT_ENDPOINTS = parseEndpointList(import.meta.env.VITE_AUTH_LOGOUT_ROUTES, [
  '/auth/logout',
  '/logout']
);

export const getStoredToken = () => localStorage.getItem('token');

export const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const storeAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: SEND_CREDENTIALS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAuthFormRequest = requestUrl.includes('/login') || requestUrl.includes('/register');

    if (status === 401 && !isAuthFormRequest && getStoredToken()) {
      clearStoredAuth();

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const fetchAuthenticatedUser = async () => {
  let lastError = null;

  for (const endpoint of AUTH_USER_ENDPOINTS) {
    try {
      const { data } = await api.get(endpoint);
      return data?.user || data?.data?.user || data?.data || data;
    } catch (error) {
      if (error.response?.status === 404) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('Unable to resolve an authenticated user endpoint');
};

const requestFirstAvailable = async (method, endpoints, payload, config) => {
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      return await api.request({
        method,
        url: endpoint,
        data: payload,
        ...config
      });
    } catch (error) {
      if (error.response?.status === 404) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('No matching endpoint was found');
};

export const authenticate = async (type, payload) => {
  const endpoints = type === 'register' ? AUTH_REGISTER_ENDPOINTS : AUTH_LOGIN_ENDPOINTS;
  const response = await requestFirstAvailable('post', endpoints, payload);
  const payloadData = response.data;
  const user = normalizeItem(
    payloadData?.user ||
    payloadData?.data?.user ||
    payloadData?.data?.account ||
    payloadData?.account ||
    payloadData?.data
  );
  const token = extractToken(response.data);

  return { response, user, token };
};

export const logoutRequest = async () => {
  try {
    await requestFirstAvailable('post', AUTH_LOGOUT_ENDPOINTS);
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error;
    }
  }
};

export default api;
