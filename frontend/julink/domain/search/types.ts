export interface Page<T> {
  content: T[];
  pageable: unknown;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: unknown;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface UserSearchResultDTO {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
  college: string;
}

export interface PostSearchResultDTO {
  postId: string;
  ownerId: string;
  ownerUsername: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerProfilePictureUrl: string | null;
  description: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface HashtagSearchResultDTO {
  hashtagId: string;
  name: string;
  usageCount?: number;
}

export interface SearchAllResponse {
  users: Page<UserSearchResultDTO>;
  posts: Page<PostSearchResultDTO>;
  hashtags: Page<HashtagSearchResultDTO>;
}
