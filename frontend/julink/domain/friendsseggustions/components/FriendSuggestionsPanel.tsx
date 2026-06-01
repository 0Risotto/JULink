"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { followUser } from "@/domain/follower/services/followerServices";
import { getFriendSuggestions } from "../services/friendSuggestionsService";
import { FriendSuggestion } from "../types";

interface FriendSuggestionsPanelProps {
  variant?: "horizontal" | "rail" | "responsive" | "search";
}

function getInitials(fullName: string, username: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]).join("");
  return (initials || username.slice(0, 2)).toUpperCase();
}

export default function FriendSuggestionsPanel({
  variant = "horizontal",
}: FriendSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    getFriendSuggestions()
      .then((response) => {
        if (!mounted) return;
        if (response.status === "success") {
          setSuggestions(response.suggestions || []);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch friend suggestions", error);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleFollow = async (username: string) => {
    if (following[username]) return;

    setFollowing((prev) => ({ ...prev, [username]: true }));

    try {
      const response = await followUser(username);
      if (response.status === "success") {
        setSuggestions((prev) => prev.filter((user) => user.username !== username));
      } else {
        console.error("Failed to follow suggested user", response.message);
      }
    } catch (error) {
      console.error("Failed to follow suggested user", error);
    } finally {
      setFollowing((prev) => ({ ...prev, [username]: false }));
    }
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  const isRail = variant === "rail";
  const isResponsive = variant === "responsive";
  const isSearch = variant === "search";
  const listClassName = isRail
    ? "flex flex-col gap-3"
    : isSearch
      ? "flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
    : isResponsive
      ? "flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
      : "flex gap-3 overflow-x-auto pb-2";
  const cardClassName = isRail
    ? "w-full rounded-lg border bg-card p-4"
    : isSearch
      ? "flex w-[112px] flex-shrink-0 flex-col items-center rounded-lg border bg-card p-3 text-center lg:w-full lg:flex-row lg:gap-3 lg:border-0 lg:bg-transparent lg:px-1 lg:py-2 lg:text-left"
    : isResponsive
      ? "w-[180px] flex-shrink-0 rounded-lg border bg-card p-4 lg:w-full"
      : "w-[180px] flex-shrink-0 rounded-lg border bg-card p-4";

  return (
    <section className={isSearch ? "w-full mb-4 lg:mb-0" : "w-full mb-6"}>
      <div className={isSearch ? "mb-2 flex items-center justify-between px-1" : "flex items-center justify-between mb-3 px-1"}>
        <h2 className={isSearch ? "text-sm font-semibold text-muted-foreground" : "text-base font-semibold"}>
          Suggested friends
        </h2>
        <span className={isSearch ? "text-xs font-medium text-primary" : "text-xs text-muted-foreground"}>
          People you may know
        </span>
      </div>

      <div className={listClassName}>
        {suggestions.map((user) => (
          <div
            key={user.username}
            className={cardClassName}
          >
            {isSearch ? (
              <>
                <Link href={`/${user.username}`} className="flex min-w-0 flex-1 flex-col items-center lg:flex-row lg:gap-3">
                  <Avatar className="mb-2 h-12 w-12 lg:mb-0 lg:h-11 lg:w-11">
                    <AvatarImage src={user.profilePictureUrl || undefined} />
                    <AvatarFallback>{getInitials(user.fullName, user.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 max-w-full lg:flex-1">
                    <p className="truncate text-sm font-semibold leading-5">{user.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground lg:block">@{user.username}</p>
                  </div>
                </Link>

                <button
                  type="button"
                  className="mt-2 shrink-0 text-sm font-semibold text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60 lg:mt-0"
                  disabled={following[user.username]}
                  onClick={() => handleFollow(user.username)}
                >
                  {following[user.username] ? "Following..." : "Follow"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${user.username}`}
                  className="flex flex-col items-center text-center"
                >
                  <Avatar className="h-14 w-14 mb-3">
                    <AvatarImage src={user.profilePictureUrl || undefined} />
                    <AvatarFallback>{getInitials(user.fullName, user.username)}</AvatarFallback>
                  </Avatar>
                  <p className="w-full truncate text-sm font-semibold">{user.fullName}</p>
                  <p className="w-full truncate text-xs text-muted-foreground">
                    @{user.username}
                  </p>
                </Link>

                <Button
                  size="sm"
                  className="mt-4 w-full"
                  disabled={following[user.username]}
                  onClick={() => handleFollow(user.username)}
                >
                  {following[user.username] ? "Following..." : "Follow"}
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
