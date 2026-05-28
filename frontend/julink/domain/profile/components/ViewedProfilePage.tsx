"use client";

import { useEffect } from "react";
import { notFound } from "next/navigation";
import ViewedUserCard from "./ViewedUserCard"; 
import { useUser } from "../hooks/useUser";
import { Spinner } from "@/components/ui/spinner";
import UserPosts from "@/domain/posts/components/UserPosts";
import { Grid } from "lucide-react";

interface ViewedProfilePageProps {
  username: string;
}

import { useState } from "react";

export default function ViewedProfilePage({ username }: ViewedProfilePageProps) {
  const { 
    viewedUser, 
    loading, 
    loadUserProfile,
    clearProfile 
  } = useUser();
  
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    loadUserProfile(username)
      .finally(() => setHasFetched(true))
      .catch((err) => {
        console.error("Failed to load user profile:", err);
      });
    
    return () => {
      clearProfile();
    };
  }, [username, loadUserProfile, clearProfile]);

  if (loading || !hasFetched) {
    return (
      <div className="container mx-auto py-8">
        <div className="w-full text-center py-20">
          <Spinner />
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