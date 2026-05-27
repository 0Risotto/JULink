import React, { useState } from "react";
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
  const [isFound, setIsFound] = useState<"true" | "false">("false");
  const [loading, setLoading] = useState(false);

  const { uploadImage, isUploading, uploadError } = useImageUpload();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !college || !selectedImage) return;

    try {
      setLoading(true);
      // 1. Upload image
      const imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) throw new Error("Image upload failed");

      // 2. Create post
      const data: CreateLostAndFoundRequest = {
        description,
        college: college as CollegeEnum,
        imageURL: imageUrl,
        phoneNumber: phoneNumber || undefined,
        isFound: isFound === "true",
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
    setIsFound("false");
    handleRemoveImage();
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
                  name="isFound" 
                  value="false" 
                  checked={isFound === "false"}
                  onChange={(e) => setIsFound(e.target.value as "false")}
                  className="w-4 h-4 text-primary"
                />
                I lost something
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="isFound" 
                  value="true" 
                  checked={isFound === "true"}
                  onChange={(e) => setIsFound(e.target.value as "true")}
                  className="w-4 h-4 text-primary"
                />
                I found something
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

          <div className="flex flex-col gap-2">
            <Label>Image *</Label>
            {!imagePreview ? (
              <label className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium text-muted-foreground">Click to upload image</span>
              </label>
            ) : (
              <div className="relative w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center max-h-48 border">
                <img src={imagePreview} alt="Preview" className="object-contain max-h-48 w-full" />
                <Button 
                  type="button"
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 w-8 h-8 rounded-full shadow-md"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleReset} disabled={loading || isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!description || !college || !selectedImage || loading || isUploading}>
              {loading || isUploading ? <Spinner className="mr-2" /> : null}
              {isUploading ? "Uploading..." : "Post Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
