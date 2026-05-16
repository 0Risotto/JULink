"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { FollowerUser } from "@/domain/follower/types";
import * as FollowerServices from "@/domain/follower/services/followerServices";
import { useUser } from "@/domain/profile/hooks/useUser";
import { useAppDispatch } from "@/store/hooks";
import { fetchConversations, setActiveConversation } from "../store/chatSlice";
import * as chatApi from "../api/chatApi";

interface CreateGroupDialogProps {
  trigger: React.ReactNode;
}

export default function CreateGroupDialog({ trigger }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const { myUsername } = useUser();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (open && myUsername) {
      setLoading(true);
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
      setGroupName("");
      setSelectedUsernames([]);
    }
  }, [open, myUsername]);

  const filtered = list.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (username: string) => {
    if (selectedUsernames.includes(username)) {
      setSelectedUsernames(selectedUsernames.filter((u) => u !== username));
    } else {
      setSelectedUsernames([...selectedUsernames, username]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsernames.length === 0) return;
    
    try {
      setLoading(true);
      const conv = await chatApi.createGroup(groupName, selectedUsernames);
      await dispatch(fetchConversations());
      dispatch(setActiveConversation(conv.id));
      setOpen(false);
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Group</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div>
            <label className="text-sm font-medium">Group Name</label>
            <Input
              placeholder="e.g. Project Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Select Members</label>
            <Input
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
            {loading && list.length === 0 ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : (
              <>
                {filtered.map((u) => {
                  const isSelected = selectedUsernames.includes(u.username);
                  return (
                    <div
                      key={u.username}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/10 border border-primary/50" : "hover:bg-accent border border-transparent"
                      }`}
                      onClick={() => toggleUser(u.username)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={u.profilePictureUrl || undefined} />
                          <AvatarFallback>{u.fullName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="font-medium text-sm">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filtered.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground text-center py-4">No friends found</p>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateGroup} 
              disabled={loading || !groupName.trim() || selectedUsernames.length === 0}
            >
              {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Create Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
