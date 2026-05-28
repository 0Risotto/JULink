"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PostResponseDTO } from "../types";
import { updatePost } from "../services/postServices";
import { Spinner } from "@/components/ui/spinner";
import { Image as ImageIcon, Video, X } from "lucide-react";
import { useImageUpload } from "@/domain/common/hooks/useImageUpload";

interface UpdatePostModalProps {
  post: PostResponseDTO;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: PostResponseDTO) => void;
}

export default function UpdatePostModal({ post, isOpen, onClose, onPostUpdated }: UpdatePostModalProps) {
  const [description, setDescription] = useState(post.description || "");
  const [loading, setLoading] = useState(false);
  const { uploadImage, isUploading } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    post.attachments && post.attachments.length > 0
      ? post.attachments[0].attachmentUrl
      : null
  );
  const [existingAttachment, setExistingAttachment] = useState<any | null>(
    post.attachments && post.attachments.length > 0
      ? post.attachments[0]
      : null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setExistingAttachment(null); // Clear existing attachment since we're replacing it
  };

  const removeAttachment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setExistingAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !file && !existingAttachment) return;

    setLoading(true);
    try {
      const attachments = [];

      if (existingAttachment) {
        // Kept the old attachment
        attachments.push({
          attachmentType: existingAttachment.attachmentType,
          attachmentUrl: existingAttachment.attachmentUrl
        });
      } else if (file) {
        // Uploaded a new file
        const uploadedUrl = await uploadImage(file);
        if (uploadedUrl) {
          const isVideo = file.type.startsWith("video/");
          attachments.push({
            attachmentType: isVideo ? "VIDEO" : "IMAGE",
            attachmentUrl: uploadedUrl
          });
        }
      }

      const payload = {
        description,
        attachments
      };

      const updated = await updatePost(post.postId, payload);
      onPostUpdated(updated);
      onClose();
    } catch (error) {
      console.error("Failed to update post", error);
    } finally {
      setLoading(false);
    }
  };

  const isVideoAttachment = () => {
    if (file) {
      return file.type.startsWith("video/");
    }
    if (existingAttachment) {
      return (
        existingAttachment.attachmentType === "VIDEO" ||
        existingAttachment.attachmentUrl.match(/\.(mp4|webm|ogg)$/i)
      );
    }
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 p-0 overflow-hidden border border-gray-200 dark:border-zinc-800 rounded-2xl">
        <DialogHeader className="px-4 py-4 border-b border-gray-100 dark:border-zinc-800">
          <DialogTitle className="text-center">Edit Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleUpdate} className="p-4 space-y-6">
          {/* Caption Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="What's on your mind?"
              className="w-full resize-none bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-primary text-base p-4 min-h-[100px] rounded-xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Media Upload Area (Styled like CreatePost) */}
          <div className="space-y-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-48 bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
            >
              {preview ? (
                <>
                  {isVideoAttachment() ? (
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

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading || isUploading}
              className="rounded-full px-6 py-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={(!description.trim() && !file && !existingAttachment) || loading || isUploading}
              className="rounded-full px-8 py-2 font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white"
            >
              {isUploading ? "Uploading Media..." : loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
