import { get, post, put, del } from "@/util/api/axios";
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
  Page,
} from "../types";

interface BackendMedia {
  kind: string;
  url: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  position: number;
}

interface BackendPost {
  id: string;
  author_id: string;
  author_username: string;
  body: string;
  media: BackendMedia[];
  hashtags: string[];
  like_count: number;
  comment_count: number;
  favorite_count: number;
  impression_count: number;
  liked: boolean;
  favorited: boolean;
  created_at: string;
  updated_at: string | null;
}

interface BackendComment {
  id: string;
  post_id: string;
  author_id: string;
  author_username: string;
  body: string;
  parent_id: string | null;
  like_count: number;
  reply_count: number;
  liked: boolean;
  created_at: string;
  updated_at: string | null;
}

interface BackendPage<T> {
  items: T[];
  next_cursor: string | null;
}

interface BackendHashtag {
  name: string;
  post_count: number;
}

interface FeedAuthor {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface FeedItem {
  post: BackendPost;
  author: FeedAuthor;
}

const cursorCache = new Map<string, string>();

const splitName = (displayName: string) => {
  const parts = displayName.trim().split(/\s+/);
  const first = parts.shift() || displayName;
  return { first, last: parts.join(" ") };
};

const toPost = (post: BackendPost, author?: FeedAuthor): PostResponseDTO => {
  const name = splitName(author?.display_name || post.author_username);
  return {
    postId: post.id,
    ownerId: post.author_id,
    ownerUsername: post.author_username,
    ownerFirstName: name.first,
    ownerLastName: name.last,
    ownerProfilePictureUrl: author?.avatar_url || undefined,
    description: post.body,
    attachments: post.media.map((media, index) => ({
      attachmentId: `${post.id}-${index}`,
      attachmentType: media.kind.toUpperCase(),
      attachmentUrl: media.url,
    })),
    hashtags: post.hashtags,
    likesCount: post.like_count,
    commentsCount: post.comment_count,
    favoritesCount: post.favorite_count,
    likedByCurrentUser: post.liked,
    favoritedByCurrentUser: post.favorited,
    seenByCurrentUser: false,
    createdAt: post.created_at,
    updatedAt: post.updated_at || undefined,
  };
};

const toComment = (comment: BackendComment): CommentResponseDTO => ({
  commentId: comment.id,
  postId: comment.post_id,
  userId: comment.author_id,
  username: comment.author_username,
  firstName: comment.author_username,
  lastName: "",
  content: comment.body,
  parentCommentId: comment.parent_id,
  replyCount: comment.reply_count,
  likesCount: comment.like_count,
  likedByCurrentUser: comment.liked,
  createdAt: comment.created_at,
  updatedAt: comment.updated_at || undefined,
});

const toPage = <T>(
  items: T[],
  nextCursor: string | null,
  page: number,
  size: number,
): Page<T> => ({
  content: items,
  pageable: null,
  totalElements: items.length,
  totalPages: nextCursor ? page + 2 : page + 1,
  last: !nextCursor,
  size,
  number: page,
  sort: null,
  first: page === 0,
  numberOfElements: items.length,
  empty: items.length === 0,
});

async function fetchPage<TBackend, TFrontend>(
  url: string,
  page: number,
  size: number,
  cacheKey: string,
  map: (item: TBackend) => TFrontend,
  selectItems: (data: BackendPage<TBackend>) => TBackend[],
): Promise<Page<TFrontend>> {
  const cursor = page > 0 ? cursorCache.get(`${cacheKey}:${page - 1}`) : undefined;
  const data = await get<BackendPage<TBackend>>(url, {
    params: { limit: size, ...(cursor ? { cursor } : {}) },
  });

  if (data.next_cursor) {
    cursorCache.set(`${cacheKey}:${page}`, data.next_cursor);
  }

  const items = selectItems(data);
  return toPage(items.map(map), data.next_cursor, page, size);
}

const postPayload = (data: CreatePostDTO | UpdatePostDTO) => ({
  body: data.description,
  media: (data.attachments || []).map((attachment) => ({
    kind: attachment.attachmentType.toLowerCase(),
    url: attachment.attachmentUrl,
  })),
});

export const createPost = async (data: CreatePostDTO) =>
  toPost(await post<BackendPost>("/posts", postPayload(data)));

export const getPostById = async (postId: string) =>
  toPost(await get<BackendPost>(`/posts/${postId}`));

export const updatePost = async (postId: string, data: UpdatePostDTO) =>
  toPost(await put<BackendPost>(`/posts/${postId}`, postPayload(data)));

export const deletePost = (postId: string) => del<void>(`/posts/${postId}`);

export const getUserPosts = (username: string, page = 0, size = 10) =>
  fetchPage<BackendPost, PostResponseDTO>(
    `/posts/user/${encodeURIComponent(username)}`,
    page,
    size,
    `user:${username}`,
    toPost,
    (data) => data.items,
  );

export const getHomeFeed = async (page = 0, size = 5) => {
  const cursor = page > 0 ? cursorCache.get(`feed:${page - 1}`) : undefined;
  const data = await get<BackendPage<FeedItem>>("/feed", {
    params: { limit: size, ...(cursor ? { cursor } : {}) },
  });
  if (data.next_cursor) cursorCache.set(`feed:${page}`, data.next_cursor);

  return toPage(
    data.items.map((item) => toPost(item.post, item.author)),
    data.next_cursor,
    page,
    size,
  );
};

export const getFavoritePosts = (page = 0, size = 10) =>
  fetchPage<BackendPost, PostResponseDTO>(
    "/posts/favorites",
    page,
    size,
    "favorites",
    toPost,
    (data) => data.items,
  );

export const toggleLike = async (postId: string): Promise<LikeResponseDTO> => {
  const response = await post<{ liked: boolean; like_count: number }>(
    `/posts/${postId}/toggle-like`,
  );
  return {
    postId,
    liked: response.liked,
    likesCount: response.like_count,
  };
};

export const toggleFavorite = async (
  postId: string,
): Promise<FavoriteResponseDTO> => {
  const response = await post<{ favorited: boolean; favorite_count: number }>(
    `/posts/${postId}/toggle-favorite`,
  );
  return {
    postId,
    favorited: response.favorited,
    favoritesCount: response.favorite_count,
  };
};

export const createComment = async (
  postId: string,
  data: CreateCommentDTO,
): Promise<CommentResponseDTO> => {
  const response = await post<BackendComment>(`/posts/${postId}/comments`, {
    body: data.content,
    parent_id: data.parentCommentId,
  });
  return toComment(response);
};

export const getPostComments = (
  postId: string,
  _sortBy = "newest",
  page = 0,
  size = 10,
): Promise<Page<CommentResponseDTO>> =>
  fetchPage<BackendComment, CommentResponseDTO>(
    `/posts/${postId}/comments`,
    page,
    size,
    `comments:${postId}`,
    toComment,
    (data) => data.items,
  );

export const getCommentReplies = (
  commentId: string,
  page = 0,
  size = 10,
): Promise<Page<CommentResponseDTO>> =>
  fetchPage<BackendComment, CommentResponseDTO>(
    `/posts/comments/${commentId}/replies`,
    page,
    size,
    `replies:${commentId}`,
    toComment,
    (data) => data.items,
  );

export const toggleCommentLike = async (
  commentId: string,
): Promise<CommentLikeResponseDTO> => {
  const response = await post<{ liked: boolean; like_count: number }>(
    `/posts/comments/${commentId}/toggle-like`,
  );
  return {
    commentId,
    liked: response.liked,
    likesCount: response.like_count,
  };
};

export const updateComment = async (
  commentId: string,
  data: UpdateCommentDTO,
): Promise<CommentResponseDTO> => {
  const response = await put<BackendComment>(`/posts/comments/${commentId}`, {
    body: data.content,
  });
  return toComment(response);
};

export const deleteComment = (commentId: string) =>
  del<void>(`/posts/comments/${commentId}`);

export const getPostsByHashtag = (hashtagName: string, page = 0, size = 10) =>
  fetchPage<BackendPost, PostResponseDTO>(
    `/posts/hashtags/${encodeURIComponent(hashtagName)}`,
    page,
    size,
    `hashtag:${hashtagName}`,
    toPost,
    (data) => data.items,
  );

export const getTrendingHashtags = async (
  _page = 0,
  _size = 10,
): Promise<Page<HashtagResponseDTO>> => {
  const data = await get<BackendHashtag[]>("/posts/hashtags/trending", {
    params: { limit: _size },
  });
  const content = data.map((tag) => ({
    hashtagId: tag.name,
    name: tag.name,
    usageCount: tag.post_count,
  }));
  return toPage(content, null, 0, _size);
};

export const markPostSeen = (postId: string) =>
  post<void>(`/posts/${postId}/impression`);

export const uploadPostMedia = async (_formData: FormData) => {
  throw new Error(
    "Direct media upload is not part of the Rust content API; upload to Cloudinary first and send the URL.",
  );
};
