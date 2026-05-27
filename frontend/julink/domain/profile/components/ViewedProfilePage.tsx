"use client";

import { useEffect } from "react";
import { notFound } from "next/navigation";
import ViewedUserCard from "./ViewedUserCard"; 
import { useUser } from "../hooks/useUser";
import { Spinner } from "@/components/ui/spinner";
import UserPosts from "@/domain/posts/components/UserPosts";

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
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Posts</h2>
          <UserPosts username={viewedUser.username} />
        </div>
      </div>
    );
  }

  return notFound();
}