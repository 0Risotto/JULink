export interface UserFollowList {
  username: string;
  fullName: string;
  pfp: string;
}

export interface UserProfileDTO {
  id?: string;
  username: string;
  firstName: string;
  lastName: string;
  college: string;
  bio?: string;
  profilePicture?: string;
  bannerPhoto?: string;
  themePreference?: string;
  firstLogin?: boolean;
  followings?: UserFollowList[];
  followers?: UserFollowList[];
  postsNumber?: number;
}

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  college?: string;
  bio?: string;
  profilePicture?: string;
  bannerPhoto?: string;
  themePreference?: string;
}

export interface ApiResponse<T> {
  status: "Success" | "Error" | "success" | "error";
  user?: T;
  message?: string;
}

export interface Comment {
  commenterPfp: string;
  commenterUsername: string;
  commentText: string;
  likes: number;
  date: string;
}

export interface Post {
  postMedia: string;
  mediaType: "image" | "video";
  caption: string;
  ownerUsername: string;
  ownerPfp: string;
  date: string;
  comments: Comment[];
}

export interface UserPostsProps {
  posts: Post[];
}

export interface UserProfileProps extends UserProfileDTO {
  posts: Post[];
}
