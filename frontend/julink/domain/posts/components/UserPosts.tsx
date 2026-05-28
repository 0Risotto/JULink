"use client";

import React, { useEffect, useState } from "react";
import { PostResponseDTO } from "../types";
import { getUserPosts, getFavoritePosts } from "../services/postServices";
import GridPostCard from "./GridPostCard";
import CreatePost from "./CreatePost";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchPosts(0);
  }, [username, feedType]);

  const fetchPosts = async (pageNum: number) => {
    try {
      if (pageNum === 0) setLoading(true);
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
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1);
    }
  };

  const handlePostUpdated = (updatedPost: PostResponseDTO) => {
    setPosts(prev => prev.map(p => p.postId === updatedPost.postId ? updatedPost : p));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.postId !== postId));
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
              <div className="p-4">
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
            {posts.map(post => (
              <GridPostCard key={post.postId} post={post} onPostUpdated={handlePostUpdated} onPostDeleted={handlePostDeleted} />
            ))}
          </div>
        )}
      </div>
      
      {hasMore && posts.length > 0 && (
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
  );
}
