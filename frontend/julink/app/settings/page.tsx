"use client";

import { SettingsForm } from "@/domain/settings/components/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings.
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
