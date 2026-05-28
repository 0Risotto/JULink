import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PostResponseDTO } from "../types";
import { updatePost } from "../services/postServices";
import { Spinner } from "@/components/ui/spinner";

interface UpdatePostModalProps {
  post: PostResponseDTO;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: (updatedPost: PostResponseDTO) => void;
}

export default function UpdatePostModal({ post, isOpen, onClose, onPostUpdated }: UpdatePostModalProps) {
  const [description, setDescription] = useState(post.description || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Just update description, assuming backend handles keeping existing attachments if not sent
      const updated = await updatePost(post.postId, {
        description,
        attachments: post.attachments.map(att => ({
          attachmentType: att.attachmentType,
          attachmentUrl: att.attachmentUrl
        }))
      });
      onPostUpdated(updated);
      onClose();
    } catch (error) {
      console.error("Failed to update post", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[150px] resize-none"
            placeholder="Write something..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
