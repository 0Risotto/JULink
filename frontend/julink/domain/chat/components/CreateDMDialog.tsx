"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { FollowerUser } from "@/domain/follower/types";
import * as FollowerServices from "@/domain/follower/services/followerServices";
import { useUser } from "@/domain/profile/hooks/useUser";
import { useAppDispatch } from "@/store/hooks";
import { fetchConversations, setActiveConversation } from "../store/chatSlice";
import * as chatApi from "../api/chatApi";

interface CreateDMDialogProps {
  trigger: React.ReactNode;
}

export default function CreateDMDialog({ trigger }: CreateDMDialogProps) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { myUsername } = useUser();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (open && myUsername) {
      setLoading(true);
      // Fetch followings to pick someone to chat with
      FollowerServices.getFollowings(myUsername, 0, 100)
        .then((res) => {
          if (res.status === "success") {
            setList(res.followings || []);
          }
        })
        .catch((err) => console.error("Failed to fetch followings:", err))
        .finally(() => setLoading(false));
    } else {
      setList([]);
      setSearch("");
    }
  }, [open, myUsername]);

  const filtered = list.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateDM = async (targetUsername: string) => {
    try {
      setLoading(true);
      const conv = await chatApi.createDM(targetUsername);
      await dispatch(fetchConversations());
      dispatch(setActiveConversation(conv.id));
      setOpen(false);
    } catch (err) {
      console.error("Failed to create DM:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search friends..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2"
        />

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto mt-4 pr-2">
          {loading && list.length === 0 ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : (
            <>
              {filtered.map((u) => (
                <div
                  key={u.username}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleCreateDM(u.username)}
                >
                  <Avatar>
                    <AvatarImage src={u.profilePictureUrl || undefined} />
                    <AvatarFallback>{u.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-medium text-sm">{u.fullName}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground text-center py-4">No friends found</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
