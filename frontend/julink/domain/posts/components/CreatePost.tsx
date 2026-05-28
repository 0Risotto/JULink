"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "../services/postServices";
import { Image as ImageIcon, Video, X } from "lucide-react";
import { PostResponseDTO } from "../types";
import { useImageUpload } from "@/domain/common/hooks/useImageUpload";

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
  const { uploadImage, isUploading } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setFiles((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeAttachmentAtIndex = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    console.log(`[CreatePost] Starting submission. Content: "${content}", Files count: ${files.length}`);
    setLoading(true);
    try {
      const attachments = [];
      
      if (files.length > 0) {
        console.log(`[CreatePost] Uploading files to Cloudinary...`);
        const uploadPromises = files.map(async (file) => {
          const uploadedUrl = await uploadImage(file);
          if (uploadedUrl) {
            const isVideo = file.type.startsWith("video/");
            return {
              attachmentType: isVideo ? "VIDEO" : "IMAGE",
              attachmentUrl: uploadedUrl
            };
          }
          return null;
        });

        const uploadedAttachments = await Promise.all(uploadPromises);
        attachments.push(...uploadedAttachments.filter((att): att is any => att !== null));
      }

      const payload = {
        description: content,
        attachments: attachments,
      };
      
      console.log(`[CreatePost] Sending payload to backend:`, payload);

      const response = await createPost(payload);
      console.log(`[CreatePost] Backend response success:`, response);
      
      setContent("");
      setFiles([]);
      setPreviews([]);
      
      if (onPostCreated && response) {
        onPostCreated(response);
      }
    } catch (error) {
      console.error("[CreatePost] Failed to create post! Error Details:", error);
    } finally {
      console.log(`[CreatePost] Submission finished. Re-enabling buttons.`);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        
        {/* Caption Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="What's on your mind?"
            className="w-full resize-none bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-primary text-base p-4 min-h-[100px] rounded-xl"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Previews Row */}
        {previews.length > 0 && (
          <div className="flex gap-3 overflow-x-auto py-2 custom-scrollbar">
            {previews.map((prev, idx) => {
              const currentFile = files[idx];
              const isVideo = currentFile?.type.startsWith("video/");
              return (
                <div key={idx} className="relative w-32 h-32 shrink-0 bg-black/5 rounded-xl overflow-hidden border border-border">
                  {isVideo ? (
                    <video src={prev} className="w-full h-full object-cover" />
                  ) : (
                    <img src={prev} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachmentAtIndex(idx)}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black text-white rounded-full p-1 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Media Upload Area */}
        <div className="space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-32 bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
          >
            <div className="flex flex-col items-center text-muted-foreground gap-1.5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-6 h-6" />
                <Video className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">Click to upload photo or video</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            multiple
            onChange={handleFileChange} 
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={(!content.trim() && files.length === 0) || loading || isUploading}
            className="rounded-full px-8 py-2 font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white"
          >
            {isUploading ? "Uploading Media..." : loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </div>
  );
}
