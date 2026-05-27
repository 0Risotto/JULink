"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "../services/postServices";
import { Image as ImageIcon } from "lucide-react";
import { PostResponseDTO } from "../types";

interface CreatePostProps {
  currentUser: {
    username: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  onPostCreated?: (post: PostResponseDTO) => void;
}

export default function CreatePost({ currentUser, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const response = await createPost({
        description: content,
        attachments: [], // We can add attachment support later
      });
      setContent("");
      if (onPostCreated && response) {
        onPostCreated(response);
      }
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="p-4 mb-2">
        <div className="flex gap-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={currentUser.profilePicture || undefined} />
          <AvatarFallback>{currentUser.firstName?.[0]}{currentUser.lastName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="What's on your mind?"
              className="w-full resize-none border-none shadow-none focus-visible:ring-0 text-lg mb-2 p-0 min-h-[60px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="icon" className="text-gray-500 rounded-full h-8 w-8">
                  <ImageIcon size={18} />
                </Button>
              </div>
              <Button 
                type="submit" 
                disabled={!content.trim() || loading}
                className="rounded-full px-6"
              >
                {loading ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
