"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useImageUpload } from "@/domain/common/hooks/useImageUpload";
import { completeOnboardingService } from "../services/profileServices";
import { Camera, Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";

export function OnboardingForm() {
    const router = useRouter();
    const { uploadImage, isUploading } = useImageUpload();

    const [bio, setBio] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setTheme } = useTheme();
    const [themePref, setThemePref] = useState<"system" | "light" | "dark">("system");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleThemeChange = (pref: "system" | "light" | "dark") => {
        setThemePref(pref);
        setTheme(pref);
    };

    // State for holding the actual File objects
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    // State for showing local previews before uploading
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // Refs to trigger hidden file inputs
    const profileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "banner") => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a local URL to show a preview immediately
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
            // 1. Upload images to Cloudinary (if selected)
            let profileUrl = "";
            let bannerUrl = "";

            if (profileFile) {
                const uploadedUrl = await uploadImage(profileFile);
                if (uploadedUrl) profileUrl = uploadedUrl;
            }

            if (bannerFile) {
                const uploadedUrl = await uploadImage(bannerFile);
                if (uploadedUrl) bannerUrl = uploadedUrl;
            }

            // 2. Send the URLs, Bio, and Theme Preference to your Spring Boot Backend
            await completeOnboardingService({
                bio: bio,
                profilePicture: profileUrl,
                bannerPhoto: bannerUrl,
                themePreference: themePref,
            });

            // 3. Redirect to their profile or the main feed
            router.push("/"); // Or wherever your main feed is
            router.refresh(); // Refresh to ensure updated state

        } catch (err: any) {
            setError(err.message || "Something went wrong during setup.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-xl">
            <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl font-bold tracking-tight">
                    Welcome to JU JULink!
                </CardTitle>
                <CardDescription className="text-base mt-2">
                    Let's set up your profile so the university community can get to know you.
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">

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

                    {/* Theme Preference Selection */}
                    {mounted && (
                        <div className="space-y-3">
                            <Label>Choose Theme Preference</Label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { value: "system", label: "System Default", icon: Monitor },
                                    { value: "light", label: "Light Mode", icon: Sun },
                                    { value: "dark", label: "Dark Mode", icon: Moon },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isSelected = themePref === item.value;
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => handleThemeChange(item.value as any)}
                                            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                                                isSelected
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                                            }`}
                                        >
                                            <Icon className="w-6 h-6 mb-2" />
                                            <span className="text-sm font-semibold">{item.label}</span>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                </CardContent>

                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
                        {(isSubmitting || isUploading) ? "Saving Profile..." : "Complete Setup"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}