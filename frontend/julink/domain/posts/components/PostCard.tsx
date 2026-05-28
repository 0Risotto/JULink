"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Share } from "lucide-react";
import { PostResponseDTO } from "../types";
import { toggleLike, toggleFavorite } from "../services/postServices";
import SharePostDialog from "./SharePostDialog";
import { formatDistanceToNow } from "date-fns";
import CommentSection from "./CommentSection";

interface PostCardProps {
  post: PostResponseDTO;
  onPostUpdated?: (updatedPost: PostResponseDTO) => void;
}

export default function PostCard({ post, onPostUpdated }: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [favorited, setFavorited] = useState(post.favoritedByCurrentUser);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    // Optimistic update
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      const res = await toggleLike(post.postId);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch (error) {
      // Revert on failure
      setLiked(liked);
      setLikesCount(likesCount);
      console.error("Failed to toggle like", error);
    }
  };

  const handleFavorite = async () => {
    // Optimistic update
    setFavorited(!favorited);
    try {
      const res = await toggleFavorite(post.postId);
      setFavorited(res.favorited);
    } catch (error) {
      // Revert
      setFavorited(favorited);
      console.error("Failed to toggle favorite", error);
    }
  };

  const formattedDate = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : "";

  return (
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm mb-6">
      <div className="flex gap-3 mb-3">
        <Avatar className="w-10 h-10 cursor-pointer">
          <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
          <AvatarFallback>{post.ownerFirstName?.[0]}{post.ownerLastName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px] cursor-pointer hover:underline">
              {post.ownerFirstName} {post.ownerLastName}
            </span>
            <span className="text-gray-500 text-sm">@{post.ownerUsername}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-500 text-sm">{formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="pl-13 mb-3">
        <p className="text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">{post.description}</p>
        
        {post.attachments && post.attachments.length > 0 && (
          <div className="rounded-xl overflow-hidden mb-3 border border-gray-100 dark:border-zinc-800">
            {post.attachments.map((att, idx) => (
              <img 
                key={att.attachmentId || idx}
                src={att.attachmentUrl} 
                alt="Post attachment" 
                className="w-full h-auto object-cover max-h-[500px]"
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-gray-500 pt-2 px-2 border-t border-gray-100 dark:border-zinc-800">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-2 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${showComments ? 'text-blue-500' : ''}`}
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle size={18} />
          <span>{post.commentsCount}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-2 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 ${liked ? 'text-pink-500' : ''}`}
          onClick={handleLike}
        >
          <Heart size={18} className={liked ? "fill-current" : ""} />
          <span>{likesCount}</span>
        </Button>
        
        <SharePostDialog
          postId={post.postId}
          trigger={
            <Button variant="ghost" size="sm" className="gap-2 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20">
              <Share size={18} />
            </Button>
          }
        />
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={`gap-2 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 ${favorited ? 'text-yellow-500' : ''}`}
          onClick={handleFavorite}
        >
          <Bookmark size={18} className={favorited ? "fill-current" : ""} />
        </Button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
          <CommentSection postId={post.postId} postOwnerUsername={post.ownerUsername} />
        </div>
      )}
    </div>
  );
}
