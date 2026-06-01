"use client";

import React, { useEffect, useState, useRef } from "react";
import { getHomeFeed } from "../services/postServices";
import { PostResponseDTO } from "../types";
import FeedPost from "../components/FeedPost";
import { Spinner } from "@/components/ui/spinner";
import AdCarousel from "@/domain/ads/components/AdCarousel";
import FriendSuggestionsPanel from "@/domain/friendsseggustions/components/FriendSuggestionsPanel";

export default function HomeFeed() {
  const [posts, setPosts] = useState<PostResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchFeed(0);
  }, []);

  const fetchFeed = async (pageNum: number) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setFetchingMore(true);
      }
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
      setFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !fetchingMore && hasMore) {
      fetchFeed(page + 1);
    }
  };

  useEffect(() => {
    if (!hasMore || loading || fetchingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, fetchingMore, page]);

  const handlePostUpdated = (updatedPost: PostResponseDTO) => {
    setPosts(prev => prev.map(p => p.postId === updatedPost.postId ? updatedPost : p));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.postId !== postId));
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
            {posts.map((post, index) => (
              <React.Fragment key={post.postId}>
                <FeedPost post={post} onPostUpdated={handlePostUpdated} onPostDeleted={handlePostDeleted} />
                {index === 9 && <FriendSuggestionsPanel />}
                {(index + 1) % 5 === 0 && (
                  <div className="block md:hidden my-4 px-4">
                    <AdCarousel />
                  </div>
                )}
              </React.Fragment>
            ))}

            {hasMore && (
              <div ref={observerRef} className="text-center py-4 min-h-[50px] flex items-center justify-center">
                {(loading || fetchingMore) && <Spinner />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
