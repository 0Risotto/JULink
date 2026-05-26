export interface Page<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface UserSearchResultDTO {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
  college: string;
}

export interface PostSearchResultDTO {
  postId: string;
  ownerId: number;
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
}

export interface SearchAllResponse {
  users: Page<UserSearchResultDTO>;
  posts: Page<PostSearchResultDTO>;
  hashtags: Page<HashtagSearchResultDTO>;
}