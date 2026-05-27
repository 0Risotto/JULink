"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Share, MoreHorizontal } from "lucide-react";
import { PostResponseDTO } from "../types";
import { toggleLike, toggleFavorite } from "../services/postServices";
import { formatDistanceToNow } from "date-fns";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";

interface PostDetailsModalProps {
  post: PostResponseDTO;
  onPostUpdated?: (updatedPost: PostResponseDTO) => void;
}

export default function PostDetailsModal({ post, onPostUpdated }: PostDetailsModalProps) {
  const [liked, setLiked] = useState(post.likedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [favorited, setFavorited] = useState(post.favoritedByCurrentUser);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const hasAttachments = post.attachments && post.attachments.length > 0;

  return (
    <div className="flex flex-col md:flex-row w-full h-[85vh] md:h-[600px] lg:h-[700px] bg-white dark:bg-zinc-950 overflow-hidden rounded-[var(--radius)]">
      {/* Left side: Media */}
      <div className={`w-full md:w-[60%] lg:w-[65%] bg-black flex items-center justify-center ${hasAttachments ? '' : 'bg-gray-100 dark:bg-zinc-900'}`}>
        {hasAttachments ? (
          <img 
            src={post.attachments[0].attachmentUrl} 
            alt="Post attachment" 
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="p-8 text-center w-full max-w-lg">
             <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 break-words">
                {post.description}
             </p>
          </div>
        )}
      </div>

      {/* Right side: Info Panel */}
      <div className="w-full md:w-[40%] lg:w-[35%] flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
              <AvatarFallback>{post.ownerFirstName?.[0]}{post.ownerLastName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[14px] cursor-pointer hover:underline">
                {post.ownerUsername}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
             <MoreHorizontal size={20} />
          </Button>
        </div>

        {/* Scrollable Content: Caption + Comments List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Caption */}
          <div className="flex gap-3 mb-6">
            <Avatar className="w-8 h-8 shrink-0 cursor-pointer">
              <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
              <AvatarFallback>{post.ownerFirstName?.[0]}{post.ownerLastName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="text-[14px] leading-relaxed break-words pt-1">
               <span className="font-semibold mr-2 cursor-pointer hover:underline">{post.ownerUsername}</span>
               <span className="whitespace-pre-wrap">{post.description}</span>
            </div>
          </div>

          {/* Comments List */}
          <CommentList postId={post.postId} compact={true} refreshTrigger={refreshTrigger} />
        </div>

        {/* Interaction Bar & Metadata */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleLike}
                className="hover:opacity-60 transition-opacity"
              >
                <Heart size={26} className={liked ? "fill-pink-500 text-pink-500" : ""} />
              </button>
              
              <button className="hover:opacity-60 transition-opacity">
                <MessageCircle size={26} />
              </button>
              
              <button className="hover:opacity-60 transition-opacity">
                <Share size={26} />
              </button>
            </div>
            
            <button 
              onClick={handleFavorite}
              className="hover:opacity-60 transition-opacity"
            >
              <Bookmark size={26} className={favorited ? "fill-current" : ""} />
            </button>
          </div>

          <div className="font-semibold text-[14px] mb-1">
            {likesCount} likes
          </div>
          <div className="text-[12px] text-gray-500 uppercase tracking-wide mb-3">
            {formattedDate}
          </div>

          {/* Comment Input */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/50">
             <CommentInput 
                postId={post.postId} 
                onCommentCreated={() => setRefreshTrigger(prev => prev + 1)} 
             />
          </div>
        </div>
      </div>
    </div>
  );
}
