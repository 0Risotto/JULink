import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollegeEnum, CreateLostAndFoundRequest, LostAndFoundResponse } from "../types";
import { useImageUpload } from "@/domain/common/hooks/useImageUpload";
import { createLostAndFound } from "../service/lostAndFoundService";
import { Spinner } from "@/components/ui/spinner";
import { ImagePlus, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newItem: LostAndFoundResponse) => void;
}

const formatCollegeName = (college: string) => {
  return college.split("_").map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
};

export default function CreateLostAndFoundModal({ open, onOpenChange, onSuccess }: Props) {
  const [description, setDescription] = useState("");
  const [college, setCollege] = useState<CollegeEnum | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [type, setType] = useState<"LOST" | "FOUND">("LOST");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadImage, isUploading, uploadError } = useImageUpload();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setSelectedImages((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImageAtIndex = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !college || selectedImages.length === 0) return;

    try {
      setLoading(true);
      // 1. Upload all images concurrently
      const uploadPromises = selectedImages.map(async (file) => {
        const url = await uploadImage(file);
        return url || "";
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const filteredUrls = uploadedUrls.filter(url => url !== "");

      if (filteredUrls.length === 0) throw new Error("Image uploads failed");

      // 2. Create post with comma-separated URLs
      const data: CreateLostAndFoundRequest = {
        description,
        college: college as CollegeEnum,
        imageURL: filteredUrls.join(","),
        phoneNumber: phoneNumber || undefined,
        type: type,
      };

      const res = await createLostAndFound(data);
      onSuccess(res);
      handleReset();
    } catch (error) {
      console.error("Failed to create lost and found post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDescription("");
    setCollege("");
    setPhoneNumber("");
    setType("LOST");
    setSelectedImages([]);
    setImagePreviews([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleReset();
      else onOpenChange(val);
    }}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Lost & Found Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="LOST" 
                  checked={type === "LOST"}
                  onChange={(e) => setType(e.target.value as "LOST")}
                  className="w-4 h-4 text-primary"
                />
                I am missing something
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="FOUND" 
                  checked={type === "FOUND"}
                  onChange={(e) => setType(e.target.value as "FOUND")}
                  className="w-4 h-4 text-primary"
                />
                I have found something
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the item, color, brand, specific marks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>College *</Label>
            <Select value={college} onValueChange={(val) => setCollege(val as CollegeEnum)}>
              <SelectTrigger>
                <SelectValue placeholder="Select College" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.values(CollegeEnum).map((c) => (
                  <SelectItem key={c} value={c}>
                    {formatCollegeName(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
            <Input
              id="phoneNumber"
              type="text"
              placeholder="e.g. 0791234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          {/* Previews Row */}
          {imagePreviews.length > 0 && (
            <div className="flex gap-3 overflow-x-auto py-2 custom-scrollbar">
              {imagePreviews.map((prev, idx) => (
                <div key={idx} className="relative w-24 h-24 shrink-0 bg-black/5 rounded-lg overflow-hidden border">
                  <img src={prev} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImageAtIndex(idx)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white rounded-full p-1 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Images *</Label>
            <label className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleImageSelect} 
              />
              <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-muted-foreground">Click to upload images</span>
            </label>
            {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleReset} disabled={loading || isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!description || !college || selectedImages.length === 0 || loading || isUploading}>
              {loading || isUploading ? <Spinner className="mr-2" /> : null}
              {isUploading ? "Uploading..." : "Post Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
