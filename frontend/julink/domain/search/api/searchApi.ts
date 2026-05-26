import { api } from "@/util/api/axios";
import {
  Page,
  UserSearchResultDTO,
  PostSearchResultDTO,
  HashtagSearchResultDTO,
  SearchAllResponse,
} from "../types";

export const searchApi = {
  searchAll: async (q?: string, page = 0, size = 10): Promise<SearchAllResponse> => {
    const response = await api.get<SearchAllResponse>("/search", {
      params: { q, page, size },
    });
    return response.data;
  },

  searchUsers: async (q?: string, page = 0, size = 10): Promise<Page<UserSearchResultDTO>> => {
    const response = await api.get<Page<UserSearchResultDTO>>("/search/users", {
      params: { q, page, size },
    });
    return response.data;
  },

  searchPosts: async (q?: string, page = 0, size = 10): Promise<Page<PostSearchResultDTO>> => {
    const response = await api.get<Page<PostSearchResultDTO>>("/search/posts", {
      params: { q, page, size },
    });
    return response.data;
  },

  searchHashtags: async (q?: string, page = 0, size = 10): Promise<Page<HashtagSearchResultDTO>> => {
    const response = await api.get<Page<HashtagSearchResultDTO>>("/search/hashtags", {
      params: { q, page, size },
    });
    return response.data;
  },
};
