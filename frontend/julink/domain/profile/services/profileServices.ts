import { get, patch, put } from "@/util/api/axios";
import { UserProfileDTO, UpdateProfileDTO, ApiResponse } from "../types";

export interface OnboardingData {
  bio: string;
  profilePicture: string;
  bannerPhoto: string;
  themePreference?: string;
}

interface BackendProfile {
  id: string;
  username: string;
  display_name: string;
  email?: string;
  email_verified?: boolean;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  college: string | null;
  theme_preference: string;
  first_login?: boolean;
  created_at: string;
}

const splitName = (displayName: string) => {
  const parts = displayName.trim().split(/\s+/);
  const firstName = parts.shift() || displayName;
  return { firstName, lastName: parts.join(" ") };
};

export const mapProfile = (profile: BackendProfile): UserProfileDTO => {
  const { firstName, lastName } = splitName(profile.display_name);
  return {
    id: profile.id,
    username: profile.username,
    firstName,
    lastName,
    college: profile.college || "",
    bio: profile.bio || "",
    profilePicture: profile.avatar_url || undefined,
    bannerPhoto: profile.banner_url || undefined,
    themePreference: profile.theme_preference,
    firstLogin: profile.first_login,
  };
};

export const completeOnboardingService = async (data: OnboardingData) => {
  const response = await put<BackendProfile>("/profile/setup", {
    bio: data.bio,
    avatar_url: data.profilePicture,
    banner_url: data.bannerPhoto,
    theme_preference: data.themePreference,
  });
  return { status: "success" as const, user: mapProfile(response) };
};

export const getMyProfile = async (): Promise<ApiResponse<UserProfileDTO>> => {
  const response = await get<BackendProfile>("/profile/me");
  return { status: "success", user: mapProfile(response) };
};

export const getUserProfile = async (
  username: string,
): Promise<ApiResponse<UserProfileDTO>> => {
  const response = await get<BackendProfile>(
    `/profile/${encodeURIComponent(username.toLowerCase().trim())}`,
  );
  return { status: "success", user: mapProfile(response) };
};

export const updateMyProfile = async (
  data: UpdateProfileDTO,
): Promise<ApiResponse<UserProfileDTO>> => {
  const displayName = [data.firstName, data.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ");

  const response = await patch<BackendProfile>("/profile/me", {
    display_name: displayName || undefined,
    bio: data.bio,
    avatar_url: data.profilePicture,
    banner_url: data.bannerPhoto,
    college: data.college,
    theme_preference: data.themePreference,
  });

  return { status: "success", user: mapProfile(response) };
};

export const getMyUsername = async () => {
  const response = await get<{ username: string }>("/profile/ownusername");
  return { Status: "Success", username: response.username };
};
