// services/api.ts

import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { encode as toBase64 } from "base64-arraybuffer";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import type { ApiResponse, ApiError } from "../@types/api";

const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_BACKEND_BASE_URL || "http://localhost:3000",
  timeout: 30000, // 30 secs
  headers: {
    "Content-Type": "application/json",
  },
};

const DEVICE_ID_KEY = "apiDeviceId";
const NONCE_BYTE_LENGTH = 16;
const TIMESTAMP_DIVISOR = 1000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

let cachedDeviceId: string | null = null;
let isRefreshingToken = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const textEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

const api = axios.create(API_CONFIG);

/**
 * Get shared secret from environment
 */
const getSecret = (): string => {
  const secret = process.env.EXPO_PUBLIC_API_SHARED_SECRET;
  if (!secret) {
    throw new Error("Missing API_SHARED_SECRET for request signing");
  }
  return secret;
};

/**
 * Encode string to utf8 bytes
 */
const encodeUtf8 = (value: string): Uint8Array => {
  if (!textEncoder) {
    throw new Error("TextEncoder is not available in this environment");
  }
  return textEncoder.encode(value);
};

/**
 * Convert bytes to hex string
 */
const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

/**
 * Get or create device id
 */
const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
  } catch (error) {
    console.warn("Failed to read device ID from SecureStore:", error);
  }

  const randomBytes = await Crypto.getRandomBytesAsync(16);
  const id = bytesToHex(randomBytes);
  cachedDeviceId = id;

  try {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  } catch (error) {
    console.warn("Failed to store device ID in SecureStore:", error);
  }

  return id;
};

/**
 * Generate cryptographic nonce
 */
const generateNonce = async (): Promise<string> => {
  const bytes = await Crypto.getRandomBytesAsync(NONCE_BYTE_LENGTH);
  return bytesToHex(bytes);
};

/**
 * Extract path with query from full url
 */
const extractPathWithQuery = (fullUrl: string): string => {
  try {
    const url = new URL(fullUrl);
    return url.pathname + url.search;
  } catch {
    const schemeIndex = fullUrl.indexOf("://");
    const startIndex =
      schemeIndex >= 0 ? fullUrl.indexOf("/", schemeIndex + 3) : 0;
    const pathWithQuery =
      startIndex >= 0
        ? fullUrl.slice(startIndex)
        : fullUrl.startsWith("/")
          ? fullUrl
          : `/${fullUrl}`;
    const hashIndex = pathWithQuery.indexOf("#");
    return hashIndex >= 0 ? pathWithQuery.slice(0, hashIndex) : pathWithQuery;
  }
};

/**
 * Normalize path and query params
 */
const normalizePathWithQuery = (pathWithQuery: string): string => {
  const [pathname, query] = pathWithQuery.split("?");
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (!query) return normalizedPathname;

  const params = new URLSearchParams(query);
  const sortedParams = new URLSearchParams();
  
  // Sort params alphabetically for signing
  Array.from(params.keys())
    .sort()
    .forEach((key) => {
      params.getAll(key).forEach((value) => {
        sortedParams.append(key, value);
      });
    });

  const normalizedQuery = sortedParams.toString();
  return normalizedQuery
    ? `${normalizedPathname}?${normalizedQuery}`
    : normalizedPathname;
};

/**
 * Create request signature
 */
const createSignature = async (
  method: string,
  canonicalPath: string,
  body: string,
  deviceId: string,
  timestamp: string,
  nonce: string,
): Promise<string> => {
  const secret = getSecret();
  
  const canonical = [
    method.toUpperCase(),
    canonicalPath,
    body,
    deviceId,
    timestamp,
    nonce,
  ].join("\n");

  const mac = hmac(sha256, encodeUtf8(secret), encodeUtf8(canonical));
  
  return toBase64(mac.buffer as ArrayBuffer);
  
};

/**
 * Add auth headers to request
 */
const addAuthHeaders = async (
  config: InternalAxiosRequestConfig,
  headers: AxiosHeaders,
): Promise<void> => {
  const secret = getSecret();
  const method = (config.method ?? "get").toUpperCase();
  
  // Get request URL
  const urlWithParams = api.getUri(config);
  const pathWithQuery = extractPathWithQuery(urlWithParams);
  const canonicalPath = normalizePathWithQuery(pathWithQuery);

  // Prepare body string
  let bodyString = "";
  if (config.data != null) {
    if (typeof config.data === "string") {
      bodyString = config.data;
    } else {
      bodyString = JSON.stringify(config.data);
      config.data = bodyString;
    }
  }

  // Get auth parameters
  const deviceId = await getDeviceId();
  const timestamp = Math.floor(Date.now() / TIMESTAMP_DIVISOR).toString();
  const nonce = await generateNonce();
  const signature = await createSignature(
    method,
    canonicalPath,
    bodyString,
    deviceId,
    timestamp,
    nonce,
  );

  // Set headers
  headers.set("X-Device-Id", deviceId);
  headers.set("X-Timestamp", timestamp);
  headers.set("X-Nonce", nonce);
  headers.set("X-Signature", signature);

  const appId = process.env.EXPO_PUBLIC_APP_ID;
  if (appId) headers.set("X-App-Id", appId);

  const bypassToken = process.env.EXPO_PUBLIC_VERCEL_BYPASS_TOKEN;
  if (bypassToken) {
    headers.set("x-vercel-protection-bypass", bypassToken);
  }

  const token = await SecureStore.getItemAsync("authToken");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
};

/**
 * Request interceptor
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const headers = AxiosHeaders.from(config.headers ?? {});
    
    headers.set("Content-Type", "application/json");
    
    await addAuthHeaders(config, headers);
    
    config.headers = headers;
    
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    // 401
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshingToken) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshingToken = true;

      try {
        // Refresh token
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (refreshToken) {
          const response = await api.post("/auth/refresh", { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          await SecureStore.setItemAsync("authToken", accessToken);
          if (newRefreshToken) {
            await SecureStore.setItemAsync("refreshToken", newRefreshToken);
          }

          failedQueue.forEach(({ resolve }) => resolve(undefined));
          failedQueue = [];

          return api(originalRequest);
        }
      } catch (refreshError) {
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("refreshToken");
        
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshingToken = false;
      }
    }

    if (!error.response && originalRequest) {
      const retryCount = (originalRequest as any)._retryCount || 0;
      
      if (retryCount < RETRY_ATTEMPTS) {
        (originalRequest as any)._retryCount = retryCount + 1;
        
        return new Promise((resolve) => {
          setTimeout(() => resolve(api(originalRequest)), RETRY_DELAY);
        });
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Generic api service methods (add according to what we decided the specific
 * endpoints services will look like)
 */
export class ApiService {
  /**
   * GET request
   */
  static async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await api.get<ApiResponse<T>>(endpoint, {
      params,
      ...config,
    });
    return response.data;
  }

  /**
   * POST request
   */
  static async post<T = any, D = any>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await api.post<ApiResponse<T>>(endpoint, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  static async put<T = any, D = any>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await api.put<ApiResponse<T>>(endpoint, data, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  static async patch<T = any, D = any>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await api.patch<ApiResponse<T>>(endpoint, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  static async delete<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await api.delete<ApiResponse<T>>(endpoint, config);
    return response.data;
  }

  /**
   * Upload files
   */
  static async upload<T = any>(
    endpoint: string,
    files: Array<{ uri: string; type: string; name?: string }>,
    data?: Record<string, any>,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append("files", {
        uri: file.uri,
        type: file.type,
        name: file.name || `file-${index}`,
      } as any);
    });

    if (data) {
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
    }

    const response = await api.post<ApiResponse<T>>(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  }

  /**
   * Set authentication tokens
   */
  static async setAuthTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await SecureStore.setItemAsync("authToken", accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync("refreshToken", refreshToken);
    }
  }

  /**
   * Clear authentication tokens
   */
  static async clearAuthTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync("authToken"),
      SecureStore.deleteItemAsync("refreshToken"),
    ]);
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync("authToken");
    return !!token;
  }
}

export default api;