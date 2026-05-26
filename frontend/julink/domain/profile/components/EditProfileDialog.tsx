"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useImageUpload } from "@/domain/common/hooks/useImageUpload";
import { useUser } from "../hooks/useUser";
import { Camera } from "lucide-react";
import { UserProfileDTO } from "../types";
import { Colleges } from "@/domain/auth/types";

interface EditProfileDialogProps {
  user: UserProfileDTO;
  children: React.ReactNode;
}

export default function EditProfileDialog({ user, children }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const { uploadImage, isUploading } = useImageUpload();
  const { updateUserProfile } = useUser();

  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [college, setCollege] = useState(user.college || "");
  const [bio, setBio] = useState(user.bio || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [profilePreview, setProfilePreview] = useState<string | null>(user.profilePicture || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user.bannerPhoto || null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setCollege(user.college || "");
      setBio(user.bio || "");
      setProfilePreview(user.profilePicture || null);
      setBannerPreview(user.bannerPhoto || null);
      setProfileFile(null);
      setBannerFile(null);
      setError(null);
    }
  }, [open, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    if (type === "profile") {
      setProfileFile(file);
      setProfilePreview(previewUrl);
    } else {
      setBannerFile(file);
      setBannerPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let profileUrl = user.profilePicture || "";
      let bannerUrl = user.bannerPhoto || "";

      if (profileFile) {
        const uploadedUrl = await uploadImage(profileFile);
        if (uploadedUrl) profileUrl = uploadedUrl;
      }

      if (bannerFile) {
        const uploadedUrl = await uploadImage(bannerFile);
        if (uploadedUrl) bannerUrl = uploadedUrl;
      }

      await updateUserProfile({
        firstName,
        lastName,
        college,
        bio,
        profilePicture: profileUrl,
        bannerPhoto: bannerUrl,
      });

      setOpen(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong while updating profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Banner Upload Area */}
          <div className="space-y-2">
            <Label>Banner Image</Label>
            <div
              onClick={() => bannerInputRef.current?.click()}
              className="relative w-full h-32 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
            >
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-sm">Click to upload banner</span>
                </div>
              )}
            </div>
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, "banner")} />
          </div>

          {/* Profile Picture Upload Area */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => profileInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full bg-muted border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
              >
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Square images work best.</p>
                <p>Max size 5MB.</p>
              </div>
            </div>
            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, "profile")} />
          </div>

          {/* User Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="college">College</Label>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger>
                <SelectValue placeholder="Select your college" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(Colleges).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bio Input */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="I am a CS student interested in AI and Web Development..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="resize-none h-24"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting || isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}