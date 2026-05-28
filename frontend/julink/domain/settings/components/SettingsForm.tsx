"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/domain/profile/hooks/useUser";
import { useTheme } from "next-themes";
import { useImageUpload } from "@/domain/common/hooks/useImageUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, Check, Loader2, Camera } from "lucide-react";
import { Colleges } from "@/domain/auth/types";

export function SettingsForm() {
  const { currentUser, updateUserProfile, loadMyProfile } = useUser();
  const { theme, setTheme } = useTheme();
  const { uploadImage, isUploading } = useImageUpload();

  const [mounted, setMounted] = useState(false);
  const [updatingTheme, setUpdatingTheme] = useState(false);

  // Profile Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [college, setCollege] = useState("");
  const [bio, setBio] = useState("");

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!currentUser) {
      loadMyProfile().catch(console.error);
    }
  }, [currentUser, loadMyProfile]);

  // Synchronize form states when currentUser is loaded or updated
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || "");
      setLastName(currentUser.lastName || "");
      setCollege(currentUser.college || "");
      setBio(currentUser.bio || "");
      setProfilePreview(currentUser.profilePicture || null);
      setBannerPreview(currentUser.bannerPhoto || null);
    }
  }, [currentUser]);

  // Determine current active theme preference
  const currentThemePref = currentUser?.themePreference?.toLowerCase() || "system";

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      let profileUrl = currentUser?.profilePicture || "";
      let bannerUrl = currentUser?.bannerPhoto || "";

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

      setProfileSuccess("Profile updated successfully!");
      setProfileFile(null);
      setBannerFile(null);
    } catch (err: any) {
      setProfileError(err.message || "Something went wrong while updating profile.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleThemeChange = async (pref: "system" | "light" | "dark") => {
    setTheme(pref);
    setUpdatingTheme(true);
    try {
      await updateUserProfile({
        themePreference: pref,
      });
    } catch (err) {
      console.error("Failed to save theme preference:", err);
    } finally {
      setUpdatingTheme(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information Card (Inline Form) */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your public profile details and upload new pictures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
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

            {profileError && <p className="text-red-500 text-sm font-medium">{profileError}</p>}
            {profileSuccess && <p className="text-green-500 text-sm font-medium">{profileSuccess}</p>}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={profileSubmitting || isUploading}>
                {(profileSubmitting || isUploading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Display Preferences Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Display Preferences</CardTitle>
          <CardDescription>
            Customize the appearance of JULink on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base">App Theme</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Select if JULink should use light theme, dark theme, or mirror your system theme.
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "system", label: "System Default", icon: Monitor },
                { value: "light", label: "Light Mode", icon: Sun },
                { value: "dark", label: "Dark Mode", icon: Moon },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = currentThemePref === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleThemeChange(item.value as any)}
                    disabled={updatingTheme}
                    className={`relative flex flex-col items-center justify-center p-5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                    } ${updatingTheme ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-sm">{item.label}</span>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
