// ownProfile/types.ts
export interface UserFollowList {
  username: string;
  fullName: string;
  pfp: string;
}

export interface UserProfileDTO {
  username: string;
  firstName: string;
  lastName: string;
  college: string;
  bio: string;
  profilePicture: string;
  bannerPhoto: string;
  followings: UserFollowList[];
  followers: UserFollowList[];
  postsNumber: number;
}

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  college?: string;
  bio?: string;
  profilePicture?: string;
  bannerPhoto?: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  user?: T;
  message?: string;
}

// For posts if needed
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