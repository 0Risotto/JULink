"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Bookmark, Share, MoreHorizontal } from "lucide-react";
import { PostResponseDTO } from "../types";
import { toggleLike, toggleFavorite } from "../services/postServices";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PostDetailsModal from "./PostDetailsModal";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import MediaRenderer from "./MediaRenderer";
import DoubleTapToLike from "./DoubleTapToLike";

interface FeedPostProps {
  post: PostResponseDTO;
  onPostUpdated?: (updatedPost: PostResponseDTO) => void;
}

export default function FeedPost({ post, onPostUpdated }: FeedPostProps) {
  const [liked, setLiked] = useState(post.likedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [favorited, setFavorited] = useState(post.favoritedByCurrentUser);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      const res = await toggleLike(post.postId);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          likedByCurrentUser: res.liked,
          likesCount: res.likesCount
        });
      }
    } catch (error) {
      setLiked(liked);
      setLikesCount(likesCount);
    }
  };

  const handleFavorite = async () => {
    setFavorited(!favorited);
    try {
      const res = await toggleFavorite(post.postId);
      setFavorited(res.favorited);
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          favoritedByCurrentUser: res.favorited,
        });
      }
    } catch (error) {
      setFavorited(favorited);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
  };

  const formattedDate = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }).toUpperCase()
    : "";

  const hasAttachments = post.attachments && post.attachments.length > 0;
  
  // Truncate long captions
  const MAX_CAPTION_LENGTH = 100;
  const showMoreButton = post.description && post.description.length > MAX_CAPTION_LENGTH && !isExpanded;
  const displayCaption = showMoreButton 
    ? `${post.description.substring(0, MAX_CAPTION_LENGTH)}...` 
    : post.description;

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <Card className="w-full max-w-[470px] md:max-w-[540px] mx-auto mb-8 border-none shadow-none bg-transparent">
        
        {/* POST HEADER */}
        <CardHeader className="flex flex-row items-center justify-between px-2 py-3 space-y-0">
          <Link href={`/${post.ownerUsername}`} className="flex items-center gap-3 group">
            <Avatar className="w-8 h-8 cursor-pointer group-hover:opacity-80 transition-opacity">
              <AvatarImage src={post.ownerProfilePictureUrl || undefined} />
              <AvatarFallback>{post.ownerFirstName?.[0]}{post.ownerLastName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[14px] cursor-pointer group-hover:opacity-80">
                {post.ownerUsername}
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-muted-foreground text-xs">
                 {post.createdAt ? formatDistanceToNow(new Date(post.createdAt)) : ""}
              </span>
            </div>
          </Link>
          <button className="p-2 hover:opacity-60 transition-opacity">
             <MoreHorizontal size={20} />
          </button>
        </CardHeader>

        {/* POST MEDIA */}
        <CardContent className="p-0">
          <div className="w-full relative rounded-sm md:rounded-[10px] overflow-hidden bg-muted border border-border">
            <DoubleTapToLike onDoubleTap={handleDoubleTap} className="w-full h-full">
              {hasAttachments ? (
                <MediaRenderer 
                  attachmentUrl={post.attachments[0].attachmentUrl} 
                  attachmentType={post.attachments[0].attachmentType}
                  className="w-full h-auto max-h-[650px] object-cover"
                  isModalOpen={isModalOpen}
                />
              ) : (
                 <div className="w-full aspect-[4/5] flex items-center justify-center p-8 text-center bg-muted">
                   <p className="text-xl md:text-2xl font-medium break-words">
                      {post.description}
                   </p>
                 </div>
              )}
            </DoubleTapToLike>
          </div>
        </CardContent>

        {/* POST FOOTER (ACTIONS, CAPTION, COMMENTS) */}
        <CardFooter className="flex flex-col items-start px-2 py-3">
          {/* ACTION BAR */}
          <div className="flex items-center justify-between w-full pb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleLike}
                  className="hover:opacity-60 transition-opacity"
                >
                  <Heart size={26} className={liked ? "fill-pink-500 text-pink-500" : ""} />
                </button>
                {likesCount > 0 && (
                  <span className="font-semibold text-[14px]">
                    {likesCount}
                  </span>
                )}
              </div>
              
              <DialogTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-60 transition-opacity">
                  <MessageCircle size={26} className="-scale-x-100" />
                  {post.commentsCount > 0 && (
                    <span className="font-semibold text-[14px]">
                      {post.commentsCount}
                    </span>
                  )}
                </div>
              </DialogTrigger>
              
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

          {/* CAPTION */}
          {hasAttachments && post.description && (
            <div className="text-[14px] leading-relaxed break-words w-full">
              <Link href={`/${post.ownerUsername}`}>
                <span className="font-semibold mr-2 cursor-pointer hover:underline">{post.ownerUsername}</span>
              </Link>
              <span className="whitespace-pre-wrap">{displayCaption}</span>
              {showMoreButton && (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="text-muted-foreground ml-1 hover:opacity-70"
                >
                  more
                </button>
              )}
            </div>
          )}

          {/* VIEW COMMENTS PREVIEW */}
          {post.commentsCount > 0 && (
            <div className="mt-1 w-full">
              <DialogTrigger asChild>
                <button className="text-muted-foreground text-[14px] hover:opacity-70 text-left">
                  View all {post.commentsCount} comments
                </button>
              </DialogTrigger>
            </div>
          )}

          {/* ADD COMMENT INPUT (Fake, triggers modal) */}
          <div className="mt-2 w-full">
             <DialogTrigger asChild>
                <div className="text-[14px] text-muted-foreground cursor-pointer flex items-center justify-between">
                  <span>Add a comment...</span>
                  <span className="text-[12px] opacity-0 group-hover:opacity-100">Post</span>
                </div>
             </DialogTrigger>
          </div>
        </CardFooter>
      </Card>

      {/* POST DETAILS MODAL */}
      <DialogContent className="max-w-[95vw] md:max-w-[900px] lg:max-w-[1000px] p-0 bg-transparent border-none shadow-none focus:outline-none">
         <PostDetailsModal post={post} onPostUpdated={onPostUpdated} />
      </DialogContent>
    </Dialog>
  );
}
