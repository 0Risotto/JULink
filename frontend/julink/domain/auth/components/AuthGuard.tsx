"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { Spinner } from "@/components/ui/spinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAppSelector((state) => state.login?.token);
  const sessionReady = useAppSelector((state) => state.login?.sessionReady);
  const [isChecking, setIsChecking] = useState(true);

  const isPublicPath =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  useEffect(() => {
    if (!sessionReady) return;

    if (!token && !isPublicPath) {
      router.push("/login");
    } else {
      setIsChecking(false);
    }
  }, [token, sessionReady, isPublicPath, router]);

  if (!isPublicPath && (!sessionReady || isChecking)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!token && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
