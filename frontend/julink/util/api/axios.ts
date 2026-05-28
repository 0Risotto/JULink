import axios, { AxiosResponse, InternalAxiosRequestConfig, Method } from "axios";

// Create and configure axios instance
export const api = axios.create({
  baseURL: "http://192.168.1.18:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Generic request interface
interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document' | 'stream';
}

// Ultra generic request method
export async function request<T = any>(
  method: Method,
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await api.request({
    method,
    url,
    data,
    ...config,
  });
  return response.data;
}

// Convenience methods with generics
export const get = <T = any>(url: string, config?: RequestConfig) => 
  request<T>('GET', url, undefined, config);

export const post = <T = any>(url: string, data?: any, config?: RequestConfig) => 
  request<T>('POST', url, data, config);

export const put = <T = any>(url: string, data?: any, config?: RequestConfig) => 
  request<T>('PUT', url, data, config);

export const patch = <T = any>(url: string, data?: any, config?: RequestConfig) => 
  request<T>('PATCH', url, data, config);

export const del = <T = any>(url: string, config?: RequestConfig) => 
  request<T>('DELETE', url, undefined, config);

