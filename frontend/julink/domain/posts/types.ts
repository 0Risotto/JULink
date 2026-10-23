export interface AttachmentDTO {
  attachmentType: string;
  attachmentUrl: string;
}

export interface CreatePostDTO {
  description: string;
  attachments: AttachmentDTO[];
}

export interface UpdatePostDTO {
  description: string;
  attachments?: AttachmentDTO[];
}

export interface AttachmentResponseDTO {
  attachmentId: string;
  attachmentType: string;
  attachmentUrl: string;
  createdAt?: string;
}

export interface PostResponseDTO {
  postId: string;
  ownerId: string;
  ownerUsername: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerProfilePictureUrl?: string;
  description: string;
  attachments: AttachmentResponseDTO[];
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  favoritesCount: number;
  likedByCurrentUser: boolean;
  favoritedByCurrentUser: boolean;
  seenByCurrentUser: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LikeResponseDTO {
  postId: string;
  liked: boolean;
  likesCount: number;
}

export interface FavoriteResponseDTO {
  postId: string;
  favorited: boolean;
  favoritesCount: number;
}

export interface CreateCommentDTO {
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentDTO {
  content: string;
}

export interface CommentResponseDTO {
  commentId: string;
  postId: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  content: string;
  parentCommentId?: string | null;
  replyCount: number;
  likesCount: number;
  likedByCurrentUser: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentLikeResponseDTO {
  commentId: string;
  liked: boolean;
  likesCount: number;
}

export interface HashtagResponseDTO {
  hashtagId: string;
  name: string;
  usageCount: number;
}

export interface PostMediaUploadResponseDTO {
  attachmentType: string;
  url: string;
  filename: string;
  contentType: string;
}

export interface Page<T> {
  content: T[];
  pageable: unknown;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: unknown;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
