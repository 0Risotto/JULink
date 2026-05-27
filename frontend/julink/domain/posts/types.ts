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
  ownerId: number;
  ownerUsername: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerProfilePictureUrl?: string;
  description: string;
  attachments: AttachmentResponseDTO[];
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
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
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  content: string;
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
  pageable: any;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
