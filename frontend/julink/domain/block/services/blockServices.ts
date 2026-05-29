import { get, post, del } from "@/util/api/axios";
import {
  GetBlockedUsersResponse,
  GetBlockStatusResponse,
  BlockActionResponse,
} from "../types";

export const blockUser = (username: string) =>
  post<BlockActionResponse>(`/blocks/${username}`);

export const unblockUser = (username: string) =>
  del<BlockActionResponse>(`/blocks/${username}`);

export const getBlockedUsers = () =>
  get<GetBlockedUsersResponse>("/blocks");

export const getBlockStatus = (username: string) =>
  get<GetBlockStatusResponse>(`/blocks/${username}/status`);
