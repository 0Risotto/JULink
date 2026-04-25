"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";
import { useAppSelector } from "@/store/hooks";
import { Spinner } from "@/components/ui/spinner";
import OwnProfilePage from "./OwnProfilePage";
import ViewedProfilePage from "./ViewedProfilePage";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const targetUsername = params?.username as string | undefined;

  const { 
    myUsername,
    loadMyUsername,
  } = useUser();
  
  const token = useAppSelector((state) => state.login?.token);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/login"); 
      return;
    }

    const init = async () => {
      if (!myUsername) {
        try {
          await loadMyUsername();
        } catch (error) {
          console.error("Failed to load my username", error);
        }
      }
      setIsInitializing(false);
    };

    init();
  }, [token, myUsername, loadMyUsername, router]);

  // Show spinner while checking token or fetching myUsername
  if (!token || isInitializing) {
    return (
      <div className="container mx-auto py-8">
        <div className="w-full text-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  // If there's no username param, or if it matches the current user's username
  if (!targetUsername || targetUsername.toLowerCase().trim() === myUsername?.toLowerCase().trim()) {
    return <OwnProfilePage />;
  }

  return <ViewedProfilePage username={targetUsername} />;
}