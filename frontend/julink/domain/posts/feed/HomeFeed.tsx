"use client";

import React, { useEffect, useState } from "react";
import { getHomeFeed } from "../services/postServices";
import { PostResponseDTO } from "../types";
import FeedPost from "../components/FeedPost";
import { Spinner } from "@/components/ui/spinner";

export default function HomeFeed() {
  const [posts, setPosts] = useState<PostResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchFeed(0);
  }, []);

  const fetchFeed = async (pageNum: number) => {
    try {
      if (pageNum === 0) setLoading(true);
      const res = await getHomeFeed(pageNum, 10);
      
      if (pageNum === 0) {
        setPosts(res.content);
      } else {
        setPosts((prev) => [...prev, ...res.content]);
      }
      
      setHasMore(!res.last);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch home feed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchFeed(page + 1);
    }
  };

  const handlePostUpdated = (updatedPost: PostResponseDTO) => {
    setPosts(prev => prev.map(p => p.postId === updatedPost.postId ? updatedPost : p));
  };

  return (
    <div className="w-full flex flex-col items-center pt-8 pb-20">
      <div className="w-full max-w-[470px] md:max-w-[540px]">

        {loading && page === 0 ? (
          <div className="w-full text-center py-10">
            <Spinner />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            No posts in your feed yet. Follow some users to see their posts here!
          </div>
        ) : (
          <div className="flex flex-col">
            {posts.map(post => (
              <FeedPost key={post.postId} post={post} onPostUpdated={handlePostUpdated} />
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
