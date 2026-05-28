export interface FollowerUser {
  username: string;
  fullName: string;
  profilePictureUrl: string | null;
}

export interface PaginatedFollowersResponse {
  status: "success" | "error";
  message?: string;
  followers?: FollowerUser[];
  followings?: FollowerUser[];
  friends?: FollowerUser[];
  mutualFollowers?: string[];
  mutualFollowings?: string[];
  totalPages?: number;
  totalElements?: number;
  currentPage?: number;
  pageSize?: number;
}

export interface FollowActionResponse {
  status: "success" | "error";
  message?: string;
}

export interface IsFollowingResponse {
  status: "success" | "error";
  following?: boolean;
}

export interface IsMutualResponse {
  status: "success" | "error";
  mutual?: boolean;
}
