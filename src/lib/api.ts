import axios from 'axios';
import { NavigationService } from '../services/NavigationService';
import { ErrorService } from '../services/ErrorService';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Backend base URL without /api suffix for static assets (e.g., /uploads/)
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
});

// Track if we're currently refreshing the token to avoid multiple refresh calls
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await api.post('/auth/refresh');
        isRefreshing = false;
        onTokenRefreshed('refreshed');

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login with state preservation
        isRefreshing = false;
        localStorage.removeItem('adminSession');

        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
          // Use NavigationService for state-preserving navigation
          NavigationService.navigateTo('/admin/login', {
            replace: true,
            state: {
              from: currentPath,
              message: 'Your session has expired. Please log in again.',
            },
          });

          // Log the authentication failure
          ErrorService.logError(
            new Error('Authentication token refresh failed'),
            {
              componentName: 'ApiInterceptor',
              action: 'token_refresh',
              metadata: {
                fromPath: currentPath,
              },
            }
          );
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
