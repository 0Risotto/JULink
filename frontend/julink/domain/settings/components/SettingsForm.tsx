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
import { Sun, Moon, Monitor, Check, Loader2, Camera, ShieldAlert } from "lucide-react";
import { Colleges } from "@/domain/auth/types";
import { useBlock } from "@/domain/block/hooks/useBlock";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { deleteAccountService } from "@/domain/auth/services/authServices";

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

  const { blockedUsers, loading: blocksLoading, fetchBlockedUsers, unblock } = useBlock();

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm(
      "Are you sure you want to permanently delete your JULink account? This will erase all your posts, messages, and profile information. This action cannot be undone."
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      "This is your final warning. Click OK and then type 'DELETE' in the next prompt if you are absolutely sure you want to destroy this account."
    );
    if (!confirm2) return;

    const finalConfirm = window.prompt("To confirm deletion, please type 'DELETE':");
    if (finalConfirm !== "DELETE") {
      alert("Account deletion canceled. Input did not match 'DELETE'.");
      return;
    }

    try {
      const response = await deleteAccountService();
      if (response.status === "success") {
        alert("Your account has been successfully deleted. Thank you for using JULink.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert(response.message || "Failed to delete account. Please try again.");
      }
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } }; message?: string };
      alert(errorResponse.response?.data?.message || errorResponse.message || "An error occurred while deleting your account.");
    }
  };

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
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setProfileError(errorObj.message || "Something went wrong while updating profile.");
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

      {/* Blocked Users Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <CardTitle>Blocked Users</CardTitle>
          </div>
          <CardDescription>
            Manage the accounts that you have blocked. Blocked users cannot see your posts, send you messages, or find your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocksLoading && blockedUsers.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
              You haven't blocked any accounts yet.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-background max-h-80 overflow-y-auto">
              {blockedUsers.map((user) => (
                <div key={user.username} className="flex items-center justify-between p-4 first:rounded-t-lg last:rounded-b-lg hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-muted">
                      <AvatarImage src={user.profilePictureUrl || undefined} alt={user.fullName} />
                      <AvatarFallback>
                        {user.fullName?.[0] || user.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{user.fullName}</span>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblock(user.username)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="shadow-sm border-red-200 dark:border-red-900/30">
        <CardHeader className="border-b border-red-100 dark:border-red-950/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions for your account. Once you delete your account, there is no going back. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Delete Account</h4>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account, posts, messages, and all associated data from JULink.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="w-full md:w-fit bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
