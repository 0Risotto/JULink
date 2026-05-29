export interface BlockedUser {
  username: string;
  fullName: string;
  profilePictureUrl: string | null;
  blockedAt: string;
}

export interface BlockStatus {
  blockedByMe: boolean;
  blockedMe: boolean;
  blockedEitherWay: boolean;
}

export interface GetBlockedUsersResponse {
  status: "success" | "error";
  blockedUsers?: BlockedUser[];
  message?: string;
}

export interface GetBlockStatusResponse {
  status: "success" | "error";
  blockStatus?: BlockStatus;
  message?: string;
}

export interface BlockActionResponse {
  status: "success" | "error";
  message?: string;
}
