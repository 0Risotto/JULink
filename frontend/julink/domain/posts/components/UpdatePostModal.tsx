"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PostResponseDTO } from "../types";
import { updatePost } from "../services/postServices";
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

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(
    post.attachments ? post.attachments.map(att => att.attachmentUrl) : []
  );
  const [existingAttachments, setExistingAttachments] = useState<any[]>(
    post.attachments ? post.attachments : []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setFiles((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeAttachmentAtIndex = (index: number) => {
    if (index < existingAttachments.length) {
      setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
    } else {
      const fileIndex = index - existingAttachments.length;
      setFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && files.length === 0 && existingAttachments.length === 0) return;

    setLoading(true);
    try {
      const attachments = [];

      if (existingAttachments.length > 0) {
        attachments.push(...existingAttachments.map(att => ({
          attachmentType: att.attachmentType,
          attachmentUrl: att.attachmentUrl
        })));
      }

      if (files.length > 0) {
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

  const isVideoAttachment = (index: number) => {
    if (index < existingAttachments.length) {
      const att = existingAttachments[index];
      return (
        att.attachmentType === "VIDEO" ||
        att.attachmentUrl.match(/\.(mp4|webm|ogg)$/i)
      );
    }
    const fileIndex = index - existingAttachments.length;
    const currentFile = files[fileIndex];
    return currentFile?.type.startsWith("video/");
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

          {/* Previews Row */}
          {previews.length > 0 && (
            <div className="flex gap-3 overflow-x-auto py-2 custom-scrollbar">
              {previews.map((prev, idx) => {
                const isVideo = isVideoAttachment(idx);
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
              disabled={(!description.trim() && files.length === 0 && existingAttachments.length === 0) || loading || isUploading}
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
