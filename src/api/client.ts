import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const TOKEN_STORAGE_KEY = '@silayi_master_token';
const USER_STORAGE_KEY = '@silayi_master_user';

export const DEFAULT_PRODUCTION_API_URL = 'https://silayi-master-backend.mjbsoft.tech';

export const getApiBaseUrl = (): string => {
  // 1. Explicit environment variable if provided
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Default to live deployed production server
  return DEFAULT_PRODUCTION_API_URL;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// In-memory token cache for ultra-fast synchronous access
let cachedAuthToken: string | null = null;

export const setAuthToken = async (token: string | null): Promise<void> => {
  cachedAuthToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  if (cachedAuthToken) return cachedAuthToken;
  try {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    cachedAuthToken = token;
    return token;
  } catch {
    return null;
  }
};

export const setCachedUser = async (user: any): Promise<void> => {
  try {
    if (user) {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {}
};

export const getCachedUser = async (): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const clearAuthSession = async (): Promise<void> => {
  cachedAuthToken = null;
  try {
    await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
  } catch {}
};

// Request Interceptor: Inject JWT token into Authorization header
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Extract clean error message
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  }
);
