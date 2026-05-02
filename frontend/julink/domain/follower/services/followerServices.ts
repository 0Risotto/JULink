import { get, post, del } from "@/util/api/axios";
import {
  FollowActionResponse,
  IsFollowingResponse,
  IsMutualResponse,
  PaginatedFollowersResponse,
} from "../types";

export const followUser = (username: string) =>
  post<FollowActionResponse>(`/follow/${username}`, {});

export const unfollowUser = (username: string) =>
  del<FollowActionResponse>(`/follow/${username}`);

export const getFollowers = (username: string, page = 0, size = 20) =>
  get<PaginatedFollowersResponse>(`/follow/${username}/followers?page=${page}&size=${size}&sort=username,asc`);

export const getFollowings = (username: string, page = 0, size = 20) =>
  get<PaginatedFollowersResponse>(`/follow/${username}/followings?page=${page}&size=${size}&sort=username,asc`);

export const getMutualFollowers = (username: string, page = 0, size = 20) =>
  get<PaginatedFollowersResponse>(`/follow/mutual-followers/${username}?page=${page}&size=${size}&sort=username,asc`);

export const getMutualFollowings = (username: string, page = 0, size = 20) =>
  get<PaginatedFollowersResponse>(`/follow/mutual-followings/${username}?page=${page}&size=${size}&sort=username,asc`);

export const getIsFollowing = (username: string) =>
  get<IsFollowingResponse>(`/follow/${username}/is-following`);

export const getIsMutual = (username: string) =>
  get<IsMutualResponse>(`/follow/${username}/mutual`);
