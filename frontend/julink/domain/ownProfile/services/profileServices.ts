import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { UserProfileDTO, UpdateProfileDTO, ApiResponse } from "../types";

export const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const getRequest = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await api.get(url);
  return response.data;
};

const patchRequest = async <T>(url: string, data?: unknown): Promise<T> => {
  const response: AxiosResponse<T> = await api.patch(url, data);
  return response.data;
};

export const getMyProfile = () => 
  getRequest<ApiResponse<UserProfileDTO>>('/users/me');

export const getUserProfile = (username: string) => 
  getRequest<ApiResponse<UserProfileDTO>>(`/users/${username.toLowerCase().trim()}`);

export const updateMyProfile = (data: UpdateProfileDTO) => 
  patchRequest<ApiResponse<UserProfileDTO>>('/users/me', data);