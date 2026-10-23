import { get } from "@/util/api/axios";
import {
  Page,
  UserSearchResultDTO,
  PostSearchResultDTO,
  HashtagSearchResultDTO,
  SearchAllResponse,
} from "../types";

interface BackendUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface BackendPost {
  id: string;
  author_id: string;
  author_username: string;
  body: string;
  hashtags: string[];
  created_at: string;
  snippet: string;
}

interface BackendHashtag {
  hashtag: string;
  post_count: number;
}

interface BackendSearchAll {
  users: BackendUser[];
  posts: BackendPost[];
  hashtags: BackendHashtag[];
}

const splitName = (displayName: string) => {
  const parts = displayName.trim().split(/\s+/);
  const first = parts.shift() || displayName;
  return { first, last: parts.join(" ") };
};

const toPage = <T>(content: T[], size = 20): Page<T> => ({
  content,
  pageable: null,
  last: true,
  totalPages: 1,
  totalElements: content.length,
  size,
  number: 0,
  sort: null,
  first: true,
  numberOfElements: content.length,
  empty: content.length === 0,
});

const toUser = (user: BackendUser): UserSearchResultDTO => {
  const name = splitName(user.display_name);
  return {
    id: user.id,
    username: user.username,
    firstName: name.first,
    lastName: name.last,
    profilePictureUrl: user.avatar_url,
    college: "",
  };
};

const toPost = (post: BackendPost): PostSearchResultDTO => ({
  postId: post.id,
  ownerId: post.author_id,
  ownerUsername: post.author_username,
  ownerFirstName: post.author_username,
  ownerLastName: "",
  ownerProfilePictureUrl: null,
  description: post.snippet || post.body,
  visibility: "public",
  createdAt: post.created_at,
  updatedAt: post.created_at,
});

const toHashtag = (tag: BackendHashtag): HashtagSearchResultDTO => ({
  hashtagId: tag.hashtag,
  name: tag.hashtag,
  usageCount: tag.post_count,
});

export const searchApi = {
  searchAll: async (q?: string, _page = 0, size = 20): Promise<SearchAllResponse> => {
    const data = await get<BackendSearchAll>("/search", {
      params: { q: q?.trim() || "", limit: size },
    });
    return {
      users: toPage(data.users.map(toUser), size),
      posts: toPage(data.posts.map(toPost), size),
      hashtags: toPage(data.hashtags.map(toHashtag), size),
    };
  },

  searchUsers: async (
    q?: string,
    _page = 0,
    size = 20,
  ): Promise<Page<UserSearchResultDTO>> => {
    const data = await get<BackendUser[]>("/search/users", {
      params: { q: q?.trim() || "", limit: size },
    });
    return toPage(data.map(toUser), size);
  },

  searchPosts: async (
    q?: string,
    _page = 0,
    size = 20,
  ): Promise<Page<PostSearchResultDTO>> => {
    const data = await get<BackendPost[]>("/search/posts", {
      params: { q: q?.trim() || "", limit: size },
    });
    return toPage(data.map(toPost), size);
  },

  searchHashtags: async (
    q?: string,
    _page = 0,
    size = 20,
  ): Promise<Page<HashtagSearchResultDTO>> => {
    const data = await get<BackendHashtag[]>("/search/hashtags", {
      params: { q: q?.trim() || "", limit: size },
    });
    return toPage(data.map(toHashtag), size);
  },
};
