import { get, post, del } from "@/util/api/axios";
import {
  FollowActionResponse,
  IsFollowingResponse,
  IsMutualResponse,
  PaginatedFollowersResponse,
  FollowerUser,
} from "../types";

interface BackendFollowUser {
  user_id: string;
  username: string;
}

interface BackendPage<T> {
  items: T[];
  next_cursor: string | null;
}

const toUser = (user: BackendFollowUser): FollowerUser => ({
  username: user.username,
  fullName: user.username,
  profilePictureUrl: null,
});

const listUsers = async (url: string) => {
  const data = await get<BackendPage<BackendFollowUser>>(url, {
    params: { limit: 100 },
  });
  return data.items.map(toUser);
};

export const followUser = async (username: string): Promise<FollowActionResponse> => {
  await post<void>(`/follow/${encodeURIComponent(username)}`);
  return { status: "success" };
};

export const unfollowUser = async (
  username: string,
): Promise<FollowActionResponse> => {
  await del<void>(`/follow/${encodeURIComponent(username)}`);
  return { status: "success" };
};

export const getFollowers = async (
  username: string,
  _page = 0,
  _size = 20,
): Promise<PaginatedFollowersResponse> => {
  const followers = await listUsers(
    `/follow/${encodeURIComponent(username)}/followers`,
  );
  return { status: "success", followers, totalElements: followers.length, totalPages: 1 };
};

export const getFollowings = async (
  username: string,
  _page = 0,
  _size = 20,
): Promise<PaginatedFollowersResponse> => {
  const followings = await listUsers(
    `/follow/${encodeURIComponent(username)}/followings`,
  );
  return { status: "success", followings, totalElements: followings.length, totalPages: 1 };
};

export const getFriends = async (
  _page = 0,
  _size = 100,
): Promise<PaginatedFollowersResponse> => {
  const friends = await listUsers("/follow/friends");
  return { status: "success", friends, totalElements: friends.length, totalPages: 1 };
};

export const getMutualFollowers = async (
  username: string,
  _page = 0,
  _size = 20,
): Promise<PaginatedFollowersResponse> => {
  const users = await listUsers(
    `/follow/mutual-followers/${encodeURIComponent(username)}`,
  );
  return {
    status: "success",
    mutualFollowers: users.map((user) => user.username),
    totalElements: users.length,
    totalPages: 1,
  };
};

export const getMutualFollowings = async (
  username: string,
  _page = 0,
  _size = 20,
): Promise<PaginatedFollowersResponse> => {
  const users = await listUsers(
    `/follow/mutual-followings/${encodeURIComponent(username)}`,
  );
  return {
    status: "success",
    mutualFollowings: users.map((user) => user.username),
    totalElements: users.length,
    totalPages: 1,
  };
};

export const getIsFollowing = async (
  username: string,
): Promise<IsFollowingResponse> => {
  const data = await get<{ following: boolean }>(
    `/follow/${encodeURIComponent(username)}/is-following`,
  );
  return { status: "success", following: data.following };
};

export const getIsMutual = async (
  username: string,
): Promise<IsMutualResponse> => {
  const data = await get<{ mutual: boolean }>(
    `/follow/${encodeURIComponent(username)}/mutual`,
  );
  return { status: "success", mutual: data.mutual };
};
