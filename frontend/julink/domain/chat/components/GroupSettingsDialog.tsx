"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { LogOut, UserPlus, UserMinus, Shield, Camera } from "lucide-react";
import { ConversationResponse, UserSummary } from "../types";
import * as chatApi from "../api/chatApi";
import { useAppDispatch } from "@/store/hooks";
import { updateConversation, removeConversation } from "../store/chatSlice";
import { useUser } from "@/domain/profile/hooks/useUser";
import * as FollowerServices from "@/domain/follower/services/followerServices";
import { FollowerUser } from "@/domain/follower/types";
import { useImageUpload } from "@/domain/common/hooks/useImageUpload";

interface GroupSettingsDialogProps {
  conversation: ConversationResponse;
  trigger: React.ReactNode;
}

export default function GroupSettingsDialog({ conversation, trigger }: GroupSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState(conversation.groupName || "");
  const [groupPictureUrl, setGroupPictureUrl] = useState(conversation.groupPictureUrl || "");
  const [loading, setLoading] = useState(false);
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [searchFollowers, setSearchFollowers] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);

  const { uploadImage, isUploading } = useImageUpload();
  const [groupFile, setGroupFile] = useState<File | null>(null);
  const [groupPreview, setGroupPreview] = useState<string | null>(conversation.groupPictureUrl || null);
  const groupInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const { myUsername } = useUser();

  const isMeAdmin = conversation.members.find((m) => m.username === myUsername)?.admin || false;

  useEffect(() => {
    if (open) {
      setGroupName(conversation.groupName || "");
      setGroupPictureUrl(conversation.groupPictureUrl || "");
      setGroupPreview(conversation.groupPictureUrl || null);
      setGroupFile(null);
      setShowAddMembers(false);
      setSelectedUsernames([]);
      if (myUsername) {
        FollowerServices.getFriends(0, 100)
          .then((res) => {
            if (res.status === "success") {
              const existingUsernames = conversation.members.map((m) => m.username);
              const nonMembers = (res.friends || []).filter(
                (f) => !existingUsernames.includes(f.username)
              );
              setFollowers(nonMembers);
            }
          })
          .catch((err) => console.error("Failed to fetch friends:", err));
      }
    }
  }, [open, conversation, myUsername]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGroupFile(file);
    setGroupPreview(URL.createObjectURL(file));
  };

  const handleUpdateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      setLoading(true);
      let finalPicUrl = groupPictureUrl.trim();

      if (groupFile) {
        const uploadedUrl = await uploadImage(groupFile);
        if (uploadedUrl) {
          finalPicUrl = uploadedUrl;
        }
      }

      const updated = await chatApi.updateGroup(conversation.id, {
        groupName: groupName.trim(),
        groupPictureUrl: finalPicUrl || undefined,
      });
      dispatch(updateConversation(updated));
      setOpen(false); // Close dialog on success like EditProfileDialog
    } catch (err) {
      console.error("Failed to update group", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      setLoading(true);
      await chatApi.leaveGroup(conversation.id);
      dispatch(removeConversation(conversation.id));
      setOpen(false);
    } catch (err) {
      console.error("Failed to leave group", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberUsername: string) => {
    if (!confirm(`Are you sure you want to remove @${memberUsername} from the group?`)) return;
    try {
      setLoading(true);
      const updated = await chatApi.removeMember(conversation.id, memberUsername);
      dispatch(updateConversation(updated));
    } catch (err) {
      console.error("Failed to remove member", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (member: UserSummary) => {
    const nextAdminState = !member.admin;
    try {
      setLoading(true);
      const updated = await chatApi.updateMemberAdmin(conversation.id, member.username, {
        admin: nextAdminState,
      });
      dispatch(updateConversation(updated));
    } catch (err) {
      console.error("Failed to update admin status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsernames.length === 0) return;
    try {
      setLoading(true);
      const updated = await chatApi.addMembersToGroup(conversation.id, selectedUsernames);
      dispatch(updateConversation(updated));
      setShowAddMembers(false);
      setSelectedUsernames([]);
    } catch (err) {
      console.error("Failed to add members", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectUser = (username: string) => {
    if (selectedUsernames.includes(username)) {
      setSelectedUsernames(selectedUsernames.filter((u) => u !== username));
    } else {
      setSelectedUsernames([...selectedUsernames, username]);
    }
  };

  const filteredFollowers = followers.filter(
    (f) =>
      f.fullName.toLowerCase().includes(searchFollowers.toLowerCase()) ||
      f.username.toLowerCase().includes(searchFollowers.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Circular Group Picture Upload/Preview Area (Cloudinary) */}
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <div 
              onClick={() => groupInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-muted border overflow-hidden shadow-sm flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity group/img-preview"
            >
              {groupPreview ? (
                <>
                  <img src={groupPreview} alt="Group Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/img-preview:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground select-none">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">Upload</span>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">Click to upload group picture</span>
            <input 
              type="file" 
              ref={groupInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          {/* Group Details (Name input) */}
          <div className="space-y-1.5">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              placeholder="Enter group name"
              disabled={loading || isUploading}
            />
          </div>

          {/* Members list & Invite section */}
          <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground">Members ({conversation.members.length})</h3>
              <Button size="sm" variant="ghost" className="text-xs p-1 h-auto text-primary" onClick={() => setShowAddMembers(!showAddMembers)}>
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Add Members
              </Button>
            </div>

            {showAddMembers && (
              <div className="space-y-3 p-4 border rounded-xl bg-accent/20">
                <h4 className="text-xs font-semibold">Add Friends to Group</h4>
                <Input
                  placeholder="Search friends..."
                  value={searchFollowers}
                  onChange={(e) => setSearchFollowers(e.target.value)}
                  className="h-8 text-xs"
                />

                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto mt-2">
                  {filteredFollowers.map((f) => {
                    const isSelected = selectedUsernames.includes(f.username);
                    return (
                      <div
                        key={f.username}
                        onClick={() => toggleSelectUser(f.username)}
                        className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
                          isSelected ? "bg-primary/10 border border-primary/35" : "hover:bg-accent border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={f.profilePictureUrl || undefined} />
                            <AvatarFallback className="text-[10px]">{f.fullName[0]}</AvatarFallback>
                          </Avatar>
                          <span>{f.fullName}</span>
                        </div>
                        {isSelected && <Badge className="text-[9px] px-1 h-4">Selected</Badge>}
                      </div>
                    );
                  })}
                  {filteredFollowers.length === 0 && (
                    <span className="text-xs text-muted-foreground text-center py-2">No other friends to add</span>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowAddMembers(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="text-xs h-7" onClick={handleAddMembers} disabled={loading || selectedUsernames.length === 0}>
                    Add ({selectedUsernames.length})
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {conversation.members.map((member) => {
                const isMemberMe = member.username === myUsername;
                return (
                  <div key={member.username} className="flex items-center justify-between p-2.5 rounded-xl border bg-card">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profilePictureUrl || undefined} />
                        <AvatarFallback>{member.firstName ? member.firstName[0] : member.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left min-w-0 leading-tight">
                        <span className="text-xs font-semibold truncate max-w-[120px]">
                          {member.firstName ? `${member.firstName} ${member.lastName}` : member.username}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">@{member.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {member.admin && (
                        <Badge variant="secondary" className="text-[9px] h-5 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-1.5 font-medium">
                          Admin
                        </Badge>
                      )}

                      {isMeAdmin && !isMemberMe && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={member.admin ? "Demote Admin" : "Make Admin"}
                            onClick={() => handleToggleAdmin(member)}
                            className="h-7 w-7 text-yellow-600 hover:bg-yellow-500/10 rounded-lg"
                            disabled={loading}
                          >
                            <Shield className={`w-3.5 h-3.5 ${member.admin ? "fill-yellow-600/50" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remove Member"
                            onClick={() => handleRemoveMember(member.username)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                            disabled={loading}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DialogFooter consistent with EditProfileDialog */}
          <DialogFooter className="flex justify-between items-center gap-2 pt-4 border-t dark:border-zinc-800 mt-6 shrink-0">
            <Button variant="destructive" size="sm" onClick={handleLeaveGroup} disabled={loading || isUploading} className="mr-auto text-xs h-9">
              <LogOut className="w-4 h-4 mr-1.5" />
              Leave Group
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading || isUploading} className="text-xs h-9">
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdateGroup} disabled={loading || isUploading || !groupName.trim()} className="text-xs h-9">
                {(loading || isUploading) ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
