"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { FollowerUser } from "../types";
import Link from "next/link";
import FollowButton from "./FollowButton";
import { useUser } from "@/domain/profile/hooks/useUser";
import * as FollowerServices from "../services/followerServices";

interface FollowListDialogProps {
  title: string;
  trigger: React.ReactNode;
  username: string;
  type: "followers" | "followings";
  onFollowChange?: (targetUsername: string, isFollowing: boolean) => void;
}

export default function FollowListDialog({ title, trigger, username, type, onFollowChange }: FollowListDialogProps) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { myUsername } = useUser();

  useEffect(() => {
    if (open) {
      setLoading(true);
      const fetchFn = type === "followers" 
        ? FollowerServices.getFollowers 
        : FollowerServices.getFollowings;
        
      fetchFn(username, 0, 100) // fetch up to 100 for simple search
        .then(res => {
          if (res.status === "success") {
            setList(res.followers || res.followings || []);
          }
        })
        .catch(err => console.error("Failed to fetch list:", err))
        .finally(() => setLoading(false));
    } else {
      setList([]);
      setSearch("");
    }
  }, [open, username, type]);

  const filtered = list.filter(user =>
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2"
        />

        {/* User List */}
        <div className="flex flex-col gap-4 max-h-80 overflow-y-auto mt-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <>
              {filtered.map((u) => (
                <div key={u.username} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/${u.username}`}>
                      <Avatar className="hover:opacity-80 transition-opacity cursor-pointer">
                        <AvatarImage src={u.profilePictureUrl || undefined} />
                        <AvatarFallback>{u.fullName[0]}</AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex flex-col">
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-sm text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                  
                  {myUsername !== u.username && (
                    <FollowButton 
                      username={u.username} 
                      onToggle={(isFollowing) => {
                        if (onFollowChange) onFollowChange(u.username, isFollowing);
                      }}
                    />
                  )}
                </div>
              ))}

              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
