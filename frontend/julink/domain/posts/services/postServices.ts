import { get, post, put, patch, del } from "@/util/api/axios";
import {
  CreatePostDTO,
  UpdatePostDTO,
  PostResponseDTO,
  LikeResponseDTO,
  FavoriteResponseDTO,
  CreateCommentDTO,
  UpdateCommentDTO,
  CommentResponseDTO,
  CommentLikeResponseDTO,
  HashtagResponseDTO,
  PostMediaUploadResponseDTO,
  Page
} from "../types";

// Note: No generic ApiResponse wrapper here unless backend wraps it, 
// usually Spring Page handles pagination structure itself, and single items are returned directly.

export const createPost = (data: CreatePostDTO) =>
  post<PostResponseDTO>('/posts', data);

export const getPostById = (postId: string) =>
  get<PostResponseDTO>(`/posts/${postId}`);

export const updatePost = (postId: string, data: UpdatePostDTO) =>
  put<PostResponseDTO>(`/posts/${postId}`, data);

export const deletePost = (postId: string) =>
  del<void>(`/posts/${postId}`);

export const getUserPosts = (username: string, page = 0, size = 10) =>
  get<Page<PostResponseDTO>>(`/posts/user/${username}?page=${page}&size=${size}`);

export const getHomeFeed = (page = 0, size = 10) =>
  get<Page<PostResponseDTO>>(`/posts/feed?page=${page}&size=${size}`);

export const getFavoritePosts = (page = 0, size = 10) =>
  get<Page<PostResponseDTO>>(`/posts/favorites?page=${page}&size=${size}`);

export const toggleLike = (postId: string) =>
  post<LikeResponseDTO>(`/posts/${postId}/toggle-like`);

export const toggleFavorite = (postId: string) =>
  post<FavoriteResponseDTO>(`/posts/${postId}/toggle-favorite`);

export const createComment = (postId: string, data: CreateCommentDTO) =>
  post<CommentResponseDTO>(`/posts/${postId}/comments`, data);

export const getPostComments = (postId: string, sortBy = "newest", page = 0, size = 10) =>
  get<Page<CommentResponseDTO>>(`/posts/${postId}/comments?sortBy=${sortBy}&page=${page}&size=${size}`);

export const getCommentReplies = (commentId: string, page = 0, size = 10) =>
  get<Page<CommentResponseDTO>>(`/posts/comments/${commentId}/replies?page=${page}&size=${size}`);

export const toggleCommentLike = (commentId: string) =>
  post<CommentLikeResponseDTO>(`/posts/comments/${commentId}/toggle-like`);

export const updateComment = (commentId: string, data: UpdateCommentDTO) =>
  put<CommentResponseDTO>(`/posts/comments/${commentId}`, data);

export const deleteComment = (commentId: string) =>
  del<void>(`/posts/comments/${commentId}`);

export const getPostsByHashtag = (hashtagName: string, page = 0, size = 10) =>
  get<Page<PostResponseDTO>>(`/posts/hashtags/${hashtagName}?page=${page}&size=${size}`);

export const getTrendingHashtags = (page = 0, size = 10) =>
  get<Page<HashtagResponseDTO>>(`/posts/hashtags/trending?page=${page}&size=${size}`);

export const markPostSeen = (postId: string) =>
  post<void>(`/posts/${postId}/impression`);

export const uploadPostMedia = (formData: FormData) => {
  // Use a custom api request if multipart/form-data is required
  // Wait, our axios wrapper might not set the right Content-Type for FormData
  // but let's pass it anyway, axios will handle it if we don't force 'application/json' in the generic request.
  // Actually, our custom `post` sets data. We can just pass it.
  return post<PostMediaUploadResponseDTO[]>('/posts/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
