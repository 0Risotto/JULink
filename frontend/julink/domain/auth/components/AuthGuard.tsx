"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { Spinner } from "@/components/ui/spinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAppSelector((state) => state.login?.token);
  const [isChecking, setIsChecking] = useState(true);

  // Define public paths that do not require authentication
  const isPublicPath = pathname.startsWith("/login") || pathname.startsWith("/register");

  useEffect(() => {
    if (!token && !isPublicPath) {
      router.push("/login");
    } else {
      setIsChecking(false);
    }
  }, [token, isPublicPath, router]);

  // If we are checking auth state and it's a protected path, show a spinner to prevent flash of content
  if (isChecking && !isPublicPath) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // If token is missing on a protected path, render nothing (useEffect will redirect)
  if (!token && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}