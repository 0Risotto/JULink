"use client";

import { useEffect } from "react";
import OwnUserCard from "./OwnUserCard";
import { useUser } from "../hooks/useUser";
import { Spinner } from "@/components/ui/spinner";

import { useState } from "react";

export default function OwnProfilePage() {
  const { 
    currentUser, 
    loading, 
    loadMyProfile, 
  } = useUser();
  
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      loadMyProfile()
        .finally(() => setHasFetched(true))
        .catch((err) => {
          console.error("Failed to load my profile:", err);
        });
    } else {
      setHasFetched(true);
    }
  }, [currentUser, loadMyProfile]);

  if (loading || !hasFetched || !currentUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="w-full text-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <OwnUserCard user={currentUser} />
    </div>
  );
}