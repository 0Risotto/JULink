"use client";

import React, { useEffect, useState, useRef } from "react";
import { PostResponseDTO } from "../types";
import { getUserPosts, getFavoritePosts } from "../services/postServices";
import GridPostCard from "./GridPostCard";
import CreatePost from "./CreatePost";
import PostDetailsModal from "./PostDetailsModal";
import FeedPost from "./FeedPost";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface UserPostsProps {
  username: string;
  isOwnProfile?: boolean;
  currentUser?: {
    username: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  feedType?: "posts" | "favorites";
}

export default function UserPosts({ username, isOwnProfile, currentUser, feedType = "posts" }: UserPostsProps) {
  const [posts, setPosts] = useState<PostResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activePostIndex, setActivePostIndex] = useState<number | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchPosts(0);
  }, [username, feedType]);

  const fetchPosts = async (pageNum: number) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setFetchingMore(true);
      }
      const res = feedType === "favorites" 
        ? await getFavoritePosts(pageNum, 10)
        : await getUserPosts(username, pageNum, 10);
      
      if (pageNum === 0) {
        setPosts(res.content);
      } else {
        setPosts((prev) => [...prev, ...res.content]);
      }
      
      setHasMore(!res.last);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch user posts", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !fetchingMore && hasMore) {
      fetchPosts(page + 1);
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
  }, [hasMore, loading, fetchingMore, page, username, feedType]);

  const handlePostUpdated = (updatedPost: PostResponseDTO) => {
    setPosts(prev => prev.map(p => p.postId === updatedPost.postId ? updatedPost : p));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.postId !== postId));
  };

  const handleInnerPostDeleted = (postId: string) => {
    handlePostDeleted(postId);
    if (activePostIndex !== null) {
      if (posts.length <= 1) {
        setActivePostIndex(null);
      } else if (activePostIndex >= posts.length - 1) {
        setActivePostIndex(posts.length - 2);
      }
    }
  };

  const handlePrevPost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePostIndex !== null && activePostIndex > 0) {
      setActivePostIndex(activePostIndex - 1);
    }
  };

  const handleNextPost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePostIndex === null) return;

    if (activePostIndex < posts.length - 1) {
      const nextIndex = activePostIndex + 1;
      setActivePostIndex(nextIndex);

      // Trigger load more when 3 posts away from the end
      if (nextIndex >= posts.length - 3 && hasMore && !loading) {
        const now = Date.now();
        // Throttle check to prevent spamming backend requests (1.5 seconds)
        if (now - lastFetchTime > 1500) {
          setLastFetchTime(now);
          fetchPosts(page + 1);
        }
      }
    }
  };

  if (loading && page === 0) {
    return (
      <div className="w-full text-center py-10">
        <Spinner />
      </div>
    );
  }

  if (posts.length === 0 && !isOwnProfile) {
    return (
      <div className="text-center text-gray-500 py-10 bg-white dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800">
        {feedType === "favorites" ? "No favorite posts yet." : "No posts yet."}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6 px-4">
        <div></div>
        {isOwnProfile && currentUser && feedType !== "favorites" && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="rounded-full px-5 py-2 font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 p-0 overflow-hidden border border-gray-200 dark:border-zinc-800 rounded-2xl">
              <DialogHeader className="px-4 py-4 border-b border-gray-100 dark:border-zinc-800">
                <DialogTitle className="text-center">Create Post</DialogTitle>
              </DialogHeader>
              <div className="p-4 max-h-[75vh] overflow-y-auto">
                <CreatePost 
                  currentUser={currentUser} 
                  onPostCreated={(newPost) => {
                    setPosts([newPost, ...posts]);
                    setIsCreateOpen(false);
                  }} 
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="px-4">
        {posts.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-white dark:bg-zinc-950 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            {feedType === "favorites" ? "No favorite posts to display." : "No posts to display."}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-1 md:gap-4 max-w-[900px] mx-auto">
            {posts.map((post, idx) => (
              <GridPostCard 
                key={post.postId} 
                post={post} 
                onClick={() => setActivePostIndex(idx)} 
              />
            ))}
          </div>
        )}
      </div>
      
      {hasMore && posts.length > 0 && (
        <div ref={observerRef} className="text-center py-4 min-h-[50px] flex items-center justify-center">
          {(loading || fetchingMore) && <Spinner />}
        </div>
      )}

      {/* Traversal Details Dialog */}
      {activePostIndex !== null && posts[activePostIndex] && (
        <Dialog open={activePostIndex !== null} onOpenChange={(open) => !open && setActivePostIndex(null)}>
          <DialogContent 
            className="w-full max-w-full md:max-w-[900px] lg:max-w-[1000px] h-[85vh] md:h-auto p-0 bg-transparent border-none shadow-none focus:outline-none top-auto bottom-0 left-0 right-0 translate-x-0 translate-y-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 rounded-t-2xl rounded-b-none md:rounded-xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full duration-300 md:data-[state=open]:zoom-in-95" 
            showCloseButton={true}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Left Global Traversal Arrow */}
              {activePostIndex > 0 && (
                <button
                  onClick={handlePrevPost}
                  type="button"
                  className="absolute left-4 md:-left-16 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white rounded-full p-3 transition-colors z-50 shadow-md border border-white/10"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              <div className="w-full">
                {/* Mobile view: Render FeedPost so it looks exactly like the main feed */}
                <div className="block md:hidden bg-white dark:bg-zinc-950 p-4 rounded-t-2xl h-[85vh] overflow-y-auto">
                  <FeedPost 
                    post={posts[activePostIndex]} 
                    onPostUpdated={handlePostUpdated} 
                    onPostDeleted={handleInnerPostDeleted} 
                  />
                </div>

                {/* Desktop view: Render standard PostDetailsModal */}
                <div className="hidden md:block">
                  <PostDetailsModal 
                    post={posts[activePostIndex]} 
                    onPostUpdated={handlePostUpdated} 
                    onPostDeleted={handleInnerPostDeleted} 
                    commentsOnlyOnMobile={false}
                  />
                </div>
              </div>

              {/* Right Global Traversal Arrow */}
              {(activePostIndex < posts.length - 1 || hasMore) && (
                <button
                  onClick={handleNextPost}
                  type="button"
                  className="absolute right-4 md:-right-16 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white rounded-full p-3 transition-colors z-50 shadow-md border border-white/10"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
