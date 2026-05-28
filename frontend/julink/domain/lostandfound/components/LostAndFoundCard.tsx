import React, { useState } from "react";
import { LostAndFoundResponse, CollegeEnum } from "../types";
import { markAsResolved } from "../service/lostAndFoundService";
import { useUser } from "@/domain/profile/hooks/useUser";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, CheckCircle, Clock, MessageSquare, UserCircle, Handshake } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createDM } from "@/domain/chat/api/chatApi";
import { useAppDispatch } from "@/store/hooks";
import { setActiveConversation, fetchConversations } from "@/domain/chat/store/chatSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostCarousel from "@/domain/posts/components/PostCarousel";
import ClaimLostAndFoundModal from "./ClaimLostAndFoundModal";

interface Props {
  item: LostAndFoundResponse;
  onUpdate: (updatedItem: LostAndFoundResponse) => void;
}

const formatCollegeName = (college: CollegeEnum) => {
  return college.split("_").map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(" ");
};

export default function LostAndFoundCard({ item, onUpdate }: Props) {
  const { myUsername } = useUser();
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const isOwner = myUsername === item.ownerUsername;

  const handleMarkAsResolved = async () => {
    try {
      setLoading(true);
      const res = await markAsResolved(item.id);
      onUpdate(res);
    } catch (error) {
      console.error("Failed to mark as resolved:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageUser = async () => {
    try {
      setMessaging(true);
      const conversation = await createDM(item.ownerUsername);
      await dispatch(fetchConversations());
      dispatch(setActiveConversation(conversation.id));
      router.push("/chat");
    } catch (error) {
      console.error("Failed to create DM:", error);
    } finally {
      setMessaging(false);
    }
  };

  return (
    <>
    <Card className="w-full mb-4 overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-3 mb-3 border-b pb-3">
          <Link href={`/${item.ownerUsername}`}>
            <Avatar className="w-10 h-10 border">
              <AvatarImage src={item.ownerProfilePicture || undefined} />
              <AvatarFallback>
                {item.ownerUsername.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <Link href={`/${item.ownerUsername}`} className="font-semibold text-sm hover:underline">
              {item.ownerUsername}
            </Link>
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-start mt-2">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 mb-2">
              <Badge variant={item.type === "LOST" ? "destructive" : "default"} className="w-fit">
                {item.type === "LOST" ? "Lost Item" : "Found Item"}
              </Badge>
              {item.isResolved && (
                <Badge variant="outline" className="w-fit text-muted-foreground bg-muted">
                  Resolved
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <MapPin className="w-4 h-4" />
              <span>{formatCollegeName(item.college)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {isOwner && !item.isResolved && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleMarkAsResolved} 
                disabled={loading}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {loading ? "Updating..." : "Mark as Resolved"}
              </Button>
            )}
            
            {!isOwner && (
              <div className="flex gap-2">
                {!item.isResolved && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsClaimModalOpen(true)}
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    Claim Item
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={handleMessageUser} 
                  disabled={messaging}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {messaging ? "Wait..." : "Message"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <p className="whitespace-pre-wrap text-sm mb-4">{item.description}</p>
        
        {item.imageURL && (
          <div className="relative w-full rounded-md overflow-hidden bg-muted flex items-center justify-center border">
            <PostCarousel 
              attachments={item.imageURL.split(",").map((url, idx) => ({
                attachmentId: idx.toString(),
                attachmentType: "IMAGE",
                attachmentUrl: url
              }))} 
            />
          </div>
        )}
      </CardContent>
      
      {item.phoneNumber && (
        <CardFooter className="p-4 pt-0">
          <div className="flex items-center gap-2 text-sm font-medium bg-muted px-3 py-2 rounded-md w-full">
            <Phone className="w-4 h-4 text-primary" />
            <span>Contact: {item.phoneNumber}</span>
          </div>
        </CardFooter>
      )}
    </Card>

    <ClaimLostAndFoundModal
      open={isClaimModalOpen}
      onOpenChange={setIsClaimModalOpen}
      itemId={item.id}
      onSuccess={() => {
        setIsClaimModalOpen(false);
      }}
    />
    </>
  );
}
