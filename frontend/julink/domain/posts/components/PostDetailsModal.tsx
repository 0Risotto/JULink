"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Share, MoreHorizontal } from "lucide-react";
import { PostResponseDTO } from "../types";
import { toggleLike, toggleFavorite, deletePost } from "../services/postServices";
import { formatDistanceToNow } from "date-fns";
import { useAppSelector } from "@/store/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UpdatePostModal from "./UpdatePostModal";
import CommentList from "./CommentList";
import SharePostDialog from "./SharePostDialog";
import CommentInput from "./CommentInput";
import Link from "next/link";
import MediaRenderer from "./MediaRenderer";
import DoubleTapToLike from "./DoubleTapToLike";
import PostCarousel from "./PostCarousel";
import { renderHashtags } from "../utils/hashtagUtils";

interface PostDetailsModalProps {
  post: PostResponseDTO;
  onPostUpdated?: (updatedPost: PostResponseDTO) => void;
  onPostDeleted?: (postId: string) => void;
}

export default function PostDetailsModal({ post, onPostUpdated, onPostDeleted }: PostDetailsModalProps) {
  const myUsername = useAppSelector((state) => state.user.myUsername);
  const [liked, setLiked] = useState(post.likedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [favorited, setFavorited] = useState(post.favoritedByCurrentUser);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

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

  const handleDoubleTap = () => {
    if (!liked) handleLike();
  };

  const hasAttachments = post.attachments && post.attachments.length > 0;

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(post.postId);
        if (onPostDeleted) onPostDeleted(post.postId);
      } catch (error) {
        console.error("Failed to delete post", error);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-[85vh] md:h-[600px] lg:h-[700px] bg-white dark:bg-zinc-950 overflow-hidden rounded-[var(--radius)]">
      {/* Left side: Media */}
      <div className={`w-full md:w-[60%] lg:w-[65%] bg-black flex items-center justify-center ${hasAttachments ? '' : 'bg-gray-100 dark:bg-zinc-900'}`}>
        <DoubleTapToLike onDoubleTap={handleDoubleTap} className="w-full h-full flex items-center justify-center">
          {hasAttachments ? (
            <PostCarousel attachments={post.attachments} />
          ) : (
            <div className="p-8 text-center w-full max-w-lg">
               <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 break-words">
                  {post.description}
               </p>
            </div>
          )}
        </DoubleTapToLike>
      </div>

      {/* Right side: Info Panel */}
      <div className="w-full md:w-[40%] lg:w-[35%] flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 pr-12 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <Link href={`/${post.ownerUsername}`} className="flex items-center gap-3 group">
            <Avatar className="w-8 h-8 cursor-pointer group-hover:opacity-80 transition-opacity">
              <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
              <AvatarFallback>{post.ownerFirstName?.[0]}{post.ownerLastName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[14px] cursor-pointer group-hover:underline">
                {post.ownerUsername}
              </span>
            </div>
          </Link>
          {myUsername === post.ownerUsername ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                   <MoreHorizontal size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsUpdateModalOpen(true)}>
                  Update
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8">
               <MoreHorizontal size={20} />
            </Button>
          )}
        </div>

        {/* Scrollable Content: Caption + Comments List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Caption */}
          <div className="flex gap-3 mb-6">
            <Link href={`/${post.ownerUsername}`} className="shrink-0">
              <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
                <AvatarFallback>{post.ownerFirstName?.[0]}{post.ownerLastName?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="text-[14px] leading-relaxed break-words pt-1">
               <Link href={`/${post.ownerUsername}`}>
                 <span className="font-semibold mr-2 cursor-pointer hover:underline">{post.ownerUsername}</span>
               </Link>
               <span className="whitespace-pre-wrap">{renderHashtags(post.description)}</span>
            </div>
          </div>

          {/* Comments List */}
          <CommentList postId={post.postId} postOwnerUsername={post.ownerUsername} compact={true} refreshTrigger={refreshTrigger} />
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
              
              <SharePostDialog
                postId={post.postId}
                trigger={
                  <button className="hover:opacity-60 transition-opacity">
                    <Share size={26} />
                  </button>
                }
              />
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

      <UpdatePostModal 
        post={post} 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
        onPostUpdated={onPostUpdated || (() => {})} 
      />
    </div>
  );
}
