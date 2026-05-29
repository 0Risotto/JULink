"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import ViewedUserCard from "./ViewedUserCard"; 
import { useUser } from "../hooks/useUser";
import { Spinner } from "@/components/ui/spinner";
import UserPosts from "@/domain/posts/components/UserPosts";
import { Grid } from "lucide-react";
import { useBlock } from "@/domain/block/hooks/useBlock";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ViewedProfilePageProps {
  username: string;
}

export default function ViewedProfilePage({ username }: ViewedProfilePageProps) {
  const { 
    viewedUser, 
    loading, 
    loadUserProfile,
    clearProfile 
  } = useUser();

  const {
    blockStatus,
    fetchBlockStatus,
    unblock,
    loading: blockLoading
  } = useBlock();
  
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    setHasFetched(false);
    Promise.all([
      loadUserProfile(username).catch((err) => {
        console.error("Failed to load user profile:", err);
      }),
      fetchBlockStatus(username).catch((err) => {
        console.error("Failed to load block status:", err);
      })
    ]).finally(() => setHasFetched(true));
    
    return () => {
      clearProfile();
    };
  }, [username, loadUserProfile, fetchBlockStatus, clearProfile]);

  if (!hasFetched) {
    return (
      <div className="container mx-auto py-8">
        <div className="w-full text-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  if (blockStatus?.blockedByMe || blockStatus?.blockedMe) {
    return (
      <div className="w-full flex flex-col overflow-hidden bg-background border border-border rounded-t-3xl">
        {/* Banner Skeleton */}
        <Skeleton className="w-full h-40 rounded-none bg-muted/40" />

        {/* Main Content Area */}
        <div className="flex items-start gap-6 py-6 px-4 border-b">
          {/* Avatar Skeleton */}
          <Skeleton className="w-24 h-24 -mt-12 rounded-full border-4 border-background bg-muted/60" />

          <div className="flex flex-col gap-3 flex-grow">
            <h1 className="text-xl font-bold text-foreground">User not found</h1>
            <p className="text-sm text-muted-foreground max-w-md">
              This account is not available or has been blocked.
            </p>
            
            {/* Some placeholder skeleton lines */}
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-40 bg-muted/30" />
              <Skeleton className="h-3 w-60 bg-muted/30" />
            </div>

            {blockStatus.blockedByMe && (
              <div className="pt-2">
                <Button
                  onClick={async () => {
                    const success = await unblock(username);
                    if (success) {
                      setHasFetched(false);
                      Promise.all([
                        loadUserProfile(username).catch(console.error),
                        fetchBlockStatus(username).catch(console.error)
                      ]).finally(() => setHasFetched(true));
                    }
                  }}
                  disabled={blockLoading}
                  size="sm"
                  className="font-semibold"
                >
                  Unblock @{username}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Empty Posts Area */}
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background">
          <div className="flex items-center gap-2 pb-4 px-2 text-sm font-semibold tracking-wider uppercase border-b-2 border-black dark:border-white text-black dark:text-white mb-6">
            <Grid className="w-4 h-4" />
            Posts
          </div>
          <div className="border border-dashed border-border rounded-lg p-8 text-center max-w-sm">
            <p className="text-sm text-muted-foreground">No posts to display.</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewedUser) {
    return (
      <div className="w-full">
        <ViewedUserCard user={viewedUser} />
        
        {/* Tabs Header */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-12">
            <div className="flex items-center gap-2 pb-4 px-2 text-sm font-semibold tracking-wider uppercase border-b-2 border-black dark:border-white text-black dark:text-white">
              <Grid className="w-4 h-4" />
              Posts
            </div>
          </div>
        </div>

        <div className="mt-6">
          <UserPosts username={viewedUser.username} />
        </div>
      </div>
    );
  }

  return notFound();
}
