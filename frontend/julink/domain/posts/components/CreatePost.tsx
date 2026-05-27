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
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const removeAttachment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    console.log(`[CreatePost] Starting submission. Content: "${content}", Has File: ${!!file}`);
    setLoading(true);
    try {
      const attachments = [];
      
      if (file) {
        console.log(`[CreatePost] Uploading file to Cloudinary via useImageUpload...`);
        const uploadedUrl = await uploadImage(file);
        if (uploadedUrl) {
          // Determine type roughly based on file object type
          const isVideo = file.type.startsWith("video/");
          const attachmentPayload = {
            attachmentType: isVideo ? "VIDEO" : "IMAGE",
            attachmentUrl: uploadedUrl
          };
          console.log(`[CreatePost] Cloudinary upload complete. Adding to payload:`, attachmentPayload);
          attachments.push(attachmentPayload);
        } else {
          console.warn(`[CreatePost] uploadImage returned null. No attachment will be added.`);
        }
      }

      const payload = {
        description: content,
        attachments: attachments,
      };
      
      console.log(`[CreatePost] Sending payload to backend:`, payload);

      const response = await createPost(payload);
      console.log(`[CreatePost] Backend response success:`, response);
      
      setContent("");
      setFile(null);
      setPreview(null);
      
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

        {/* Media Upload Area (Styled like EditProfileDialog) */}
        <div className="space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-48 bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
          >
            {preview ? (
              <>
                {file?.type.startsWith("video/") ? (
                  <video src={preview} className="w-full h-full object-contain bg-black/5" controls />
                ) : (
                  <img src={preview} alt="Attachment Preview" className="w-full h-full object-contain bg-black/5" />
                )}
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white rounded-full p-1.5 transition-colors"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <Video className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium">Click to upload photo or video</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileChange} 
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={(!content.trim() && !file) || loading || isUploading}
            className="rounded-full px-8 py-2 font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white"
          >
            {isUploading ? "Uploading Media..." : loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </div>
  );
}
