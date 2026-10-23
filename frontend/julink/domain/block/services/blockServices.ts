import { get, post, del } from "@/util/api/axios";
import {
  GetBlockedUsersResponse,
  GetBlockStatusResponse,
  BlockActionResponse,
  BlockedUser,
} from "../types";

interface BackendPage<T> {
  items: T[];
  next_cursor: string | null;
}

interface BackendFollowUser {
  user_id: string;
  username: string;
}

export const blockUser = async (username: string): Promise<BlockActionResponse> => {
  await post<void>(`/blocks/${encodeURIComponent(username)}`);
  return { status: "success" };
};

export const unblockUser = async (
  username: string,
): Promise<BlockActionResponse> => {
  await del<void>(`/blocks/${encodeURIComponent(username)}`);
  return { status: "success" };
};

export const getBlockedUsers = async (): Promise<GetBlockedUsersResponse> => {
  const data = await get<BackendPage<BackendFollowUser>>("/blocks", {
    params: { limit: 100 },
  });
  const blockedUsers: BlockedUser[] = data.items.map((user) => ({
    username: user.username,
    fullName: user.username,
    profilePictureUrl: null,
    blockedAt: "",
  }));
  return { status: "success", blockedUsers };
};

export const getBlockStatus = async (
  username: string,
): Promise<GetBlockStatusResponse> => {
  const data = await get<{ blocked: boolean; blocked_by: boolean }>(
    `/blocks/${encodeURIComponent(username)}/status`,
  );
  return {
    status: "success",
    blockStatus: {
      blockedByMe: data.blocked,
      blockedMe: data.blocked_by,
      blockedEitherWay: data.blocked || data.blocked_by,
    },
  };
};
