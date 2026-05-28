"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/domain/profile/hooks/useUser";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor, Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { currentUser, updateUserProfile } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine current active preference
  const currentPref = currentUser?.themePreference?.toLowerCase() || "system";

  const handleThemeChange = async (pref: "system" | "light" | "dark") => {
    // 1. Instantly update UI theme
    setTheme(pref);

    // 2. Persist to backend database
    setUpdating(true);
    try {
      await updateUserProfile({
        themePreference: pref,
      });
    } catch (err) {
      console.error("Failed to save theme preference:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (!mounted) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings.
        </p>
      </div>

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
                const isSelected = currentPref === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleThemeChange(item.value as any)}
                    disabled={updating}
                    className={`relative flex flex-col items-center justify-center p-5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                    } ${updating ? "opacity-70 cursor-not-allowed" : ""}`}
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
