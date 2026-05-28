import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { searchApi } from "../api/searchApi";
import {
  SearchAllResponse,
  Page,
  UserSearchResultDTO,
  PostSearchResultDTO,
  HashtagSearchResultDTO,
} from "../types";

export type SearchTab = "all" | "users" | "posts" | "hashtags";

export const useSearch = () => {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlTab = (searchParams.get("tab") as SearchTab) || "all";

  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(urlTab);

  // Update query and tab if URL search params change
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const tab = (searchParams.get("tab") as SearchTab) || "all";
    setQuery(q);
    setDebouncedQuery(q);
    setActiveTab(tab);
  }, [searchParams]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [allData, setAllData] = useState<SearchAllResponse | null>(null);
  const [usersData, setUsersData] = useState<Page<UserSearchResultDTO> | null>(null);
  const [postsData, setPostsData] = useState<Page<PostSearchResultDTO> | null>(null);
  const [hashtagsData, setHashtagsData] = useState<Page<HashtagSearchResultDTO> | null>(null);

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === "all") {
          const res = await searchApi.searchAll(debouncedQuery || undefined);
          setAllData(res);
        } else if (activeTab === "users") {
          const res = await searchApi.searchUsers(debouncedQuery || undefined);
          setUsersData(res);
        } else if (activeTab === "posts") {
          const res = await searchApi.searchPosts(debouncedQuery || undefined);
          setPostsData(res);
        } else if (activeTab === "hashtags") {
          const res = await searchApi.searchHashtags(debouncedQuery || undefined);
          setHashtagsData(res);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Something went wrong during search");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedQuery, activeTab]);

  return {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    loading,
    error,
    allData,
    usersData,
    postsData,
    hashtagsData,
  };
};
