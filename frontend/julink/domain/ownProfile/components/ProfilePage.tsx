"use client";

import { useEffect } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import OwnUserCard from "./OwnUserCard";
import ViewedUserCard from "./ViewedUserCard"; 
import { useUser } from "../hooks/useUser";
import { useAppSelector } from "@/store/hooks";
import { Spinner } from "@/components/ui/spinner";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string | undefined;

  const { 
    currentUser, 
    viewedUser, 
    loading, 
    loadMyProfile, 
    loadUserProfile,
    clearProfile 
  } = useUser();
  
  const token = useAppSelector((state) => state.login?.token);

  // Load profiles
  useEffect(() => {
    if (!token) {
      router.push("/login"); 
      return;
    }

    loadMyProfile();

    return () => {
      clearProfile();
    };
  }, [token, loadMyProfile, clearProfile, router]);

  // Load viewed user when username is provided and different from current user
  useEffect(() => {
    if (!currentUser || !username) return;

    if (username !== currentUser.username) {
      loadUserProfile(username);
    }
  }, [username, currentUser, loadUserProfile]);

  // Show spinner while loading initial data
  if (!token) {
    return (
      <div className="container mx-auto py-8">
        <div className="w-full text-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  // Wait for currentUser to be loaded
  if (!currentUser || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="w-full text-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!username || username === currentUser.username) {
    return (
      <div className="container mx-auto py-8">
        <OwnUserCard user={currentUser} />
      </div>
    );
  }

  if (loading) {
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
      <div className="container mx-auto py-8">
        <ViewedUserCard user = {viewedUser} />
      </div>
    );
  }

  notFound();
}