import { get, patch, put } from "@/util/api/axios";
import { UserProfileDTO, UpdateProfileDTO, ApiResponse } from "../types";

export interface OnboardingData {
    bio: string;
    profilePicture: string;
    bannerPhoto: string;
}

export const completeOnboardingService = async (data: OnboardingData) => {
    return await put("/profile/setup", data);
};
export const getMyProfile = () => 
  get<ApiResponse<UserProfileDTO>>('/profile/me');

export const getUserProfile = (username: string) => 
  get<ApiResponse<UserProfileDTO>>(`/profile/${username.toLowerCase().trim()}`);

export const updateMyProfile = (data: UpdateProfileDTO) => 
  patch<ApiResponse<UserProfileDTO>>('/profile/me', data); // Fixed: changed '/profiler/me' to '/profile/me'

export const getMyUsername = () => 
  get<{ Status: string; username: string }>('/profile/ownusername');