import type { Post } from "../posts/post";

export interface FollowUser {
  username: string;
  fullName: string;
  pfp: string;
}

export interface UserCardProps {
  user:{username: string;
  firstName: string;
  lastName: string;
  college: string;
  bio : string;
  profilePicture: string;
  bannerPhoto: string;
  followings : FollowUser[];
  followers : FollowUser[];
  get postsNumber(): number;
  }}

export interface UserPostsProps {
  posts: Post[];
}

export interface UserProfileProps extends UserCardProps {
  posts: Post[];
}
