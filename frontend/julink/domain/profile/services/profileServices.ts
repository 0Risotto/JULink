import { get, patch } from "@/util/api/axios";
import { UserProfileDTO, UpdateProfileDTO, ApiResponse } from "../types";

export const getMyProfile = () => 
  get<ApiResponse<UserProfileDTO>>('/profile/me');

export const getUserProfile = (username: string) => 
  get<ApiResponse<UserProfileDTO>>(`/profile/${username.toLowerCase().trim()}`);

export const updateMyProfile = (data: UpdateProfileDTO) => 
  patch<ApiResponse<UserProfileDTO>>('/profile/me', data); // Fixed: changed '/profiler/me' to '/profile/me'

export const getMyUsername = () => 
  get<{ Status: string; username: string }>('/profile/ownusername');