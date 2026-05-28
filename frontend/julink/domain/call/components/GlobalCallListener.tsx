"use client";

import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { useUser } from "@/domain/profile/hooks/useUser";
import { getUserProfile } from "@/domain/profile/services/profileServices";
import { UserProfileDTO } from "@/domain/profile/types";
import { JitsiMeetingComponent } from "./JitsiMeetingComponent";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@/components/ui/card";

export function GlobalCallListener() {
  const { myUsername, loadMyUsername } = useUser();
  const [incomingCall, setIncomingCall] = useState<{ callerUsername: string, videoUrl: string } | null>(null);
  const [callerProfile, setCallerProfile] = useState<UserProfileDTO | null>(null);
  const [isIncomingMinimized, setIsIncomingMinimized] = useState(false);
  const [activeCall, setActiveCall] = useState<{ roomName: string, isVideoCall: boolean } | null>(null);
  const [decliningCallRoomName, setDecliningCallRoomName] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const stompClientRef = useRef<Client | null>(null);
  const router = useRouter();

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMinimized) return; // Only allow dragging when minimized
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    audioRef.current = new Audio("/ringtone/ringtone.mp3");
    audioRef.current.loop = true;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    // Only connect if user is logged in
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    // Fetch username if missing so that we can match incoming calls
    if (!myUsername) {
      loadMyUsername().catch(console.error);
    }

    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to STOMP server globally");

        // Subscribe to video-calls topic
        client.subscribe("/topic/video-calls", (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload.type === "INVITE_TO_VIDEO" || payload.type === "INVITE_TO_GROUP_VIDEO") {
              const isGroup = payload.type === "INVITE_TO_GROUP_VIDEO";
              console.log(`Received a ${isGroup ? "group " : ""}call payload for:`, payload.targetUsername, "from:", payload.callerUsername);
              // Check if the call is for the current user
              if (payload.targetUsername === myUsername) {
                console.log(`[Incoming Call] You are being called by ${payload.callerUsername}!`);
                
                // Fetch caller profile info
                getUserProfile(payload.callerUsername)
                  .then((res) => {
                    if (res.user) {
                      setCallerProfile(res.user);
                    }
                  })
                  .catch((err) => {
                    console.error("Failed to load caller profile", err);
                  });

                setIncomingCall({
                  callerUsername: isGroup ? `${payload.callerUsername} (Group: ${payload.groupName})` : payload.callerUsername,
                  videoUrl: payload.videoUrl,
                });
                setIsIncomingMinimized(false);
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play().catch(console.error);
                }
              } 
              // Check if the current user is the caller (to join the room they just initiated)
              else if (payload.callerUsername === myUsername) {
                console.log(`[Outgoing Call] You initiated a call to ${payload.targetUsername}. Joining room...`);
                const roomName = payload.videoUrl.split("/").pop() as string;
                const callType = sessionStorage.getItem("callType") || "video";
                setActiveCall({ roomName, isVideoCall: callType === "video" });
                setIsMinimized(false);
              }
            }
          } catch (e) {
            console.error("Error parsing video call message", e);
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"]);
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
    };
  }, [myUsername]);

  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleAccept = () => {
    const roomName = incomingCall!.videoUrl.split("/").pop() as string;
    stopRingtone();
    setActiveCall({ roomName, isVideoCall: true });
    setIsMinimized(false);
    setIncomingCall(null);
    setCallerProfile(null);
  };

  const handleDecline = () => {
    stopRingtone();
    if (incomingCall) {
      const roomName = incomingCall.videoUrl.split("/").pop() as string;
      setDecliningCallRoomName(roomName);
    }
    setIncomingCall(null);
    setCallerProfile(null);
  };

  return (
    <>
      {incomingCall && (
        <div className={`fixed z-50 ${isIncomingMinimized ? "bottom-4 right-4" : "inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"}`}>
          <Card className={`shadow-xl ${isIncomingMinimized ? "w-72" : "w-full max-w-sm"}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Phone className="w-5 h-5 animate-pulse text-green-500" />
                Incoming Call
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setIsIncomingMinimized(!isIncomingMinimized)}
              >
                {isIncomingMinimized ? (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 1.5V13.5M1.5 7.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 7.5H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-6 pb-2 gap-4">
              <Avatar className="h-20 w-20 shadow-md border">
                <AvatarImage src={callerProfile?.profilePicture || undefined} alt={incomingCall.callerUsername} />
                <AvatarFallback className="text-2xl">
                  {callerProfile?.firstName ? callerProfile.firstName.charAt(0).toUpperCase() : incomingCall.callerUsername.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">
                  {callerProfile?.firstName ? `${callerProfile.firstName} ${callerProfile.lastName || ''}` : incomingCall.callerUsername}
                </h3>
                {callerProfile?.firstName && (
                  <p className="text-sm text-muted-foreground">@{incomingCall.callerUsername}</p>
                )}
                {!callerProfile?.firstName && (
                  <p className="text-sm text-muted-foreground">is calling you...</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
              <Button variant="destructive" className="flex-1" onClick={handleDecline}>
                Decline
              </Button>
              <Button variant="default" className="flex-1" onClick={handleAccept}>
                Accept
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {activeCall && (
        <div
          style={{
            transform: isMinimized ? `translate(${position.x}px, ${position.y}px)` : 'none',
            transition: isDragging ? 'none' : 'width 0.3s, height 0.3s, inset 0.3s, border-radius 0.3s, bottom 0.3s, right 0.3s, transform 0.3s',
          }}
          className={`fixed z-40 bg-black overflow-hidden shadow-2xl border flex flex-col ${
            isMinimized 
              ? "bottom-4 right-4 w-[360px] h-64 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]" 
              : "inset-4 rounded-xl"
          }`}
        >
          <div 
            className={`flex shrink-0 justify-between items-center p-2 bg-zinc-800 text-white select-none ${isMinimized ? 'cursor-move active:cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
          >
            <span className="font-semibold px-2 text-sm truncate">
              {isMinimized ? "Call in progress" : `Meeting: ${activeCall.roomName}`}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-white hover:bg-zinc-700" 
                onClick={() => {
                  // Reset position when maximizing/minimizing
                  if (isMinimized) {
                    setPosition({ x: 0, y: 0 });
                  }
                  setIsMinimized(!isMinimized);
                }}
              >
                {isMinimized ? (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 1.5V13.5M1.5 7.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 7.5H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-red-500 hover:bg-zinc-700 hover:text-red-400" 
                onClick={() => setActiveCall(null)}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.5 3.5L11.5 11.5M11.5 3.5L3.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="flex-1 w-full bg-black relative">
            <JitsiMeetingComponent 
              roomName={activeCall.roomName} 
              isVideoCall={activeCall.isVideoCall} 
              onClose={() => setActiveCall(null)} 
            />
          </div>
        </div>
      )}

      {decliningCallRoomName && (
        <JitsiMeetingComponent 
          roomName={decliningCallRoomName} 
          isVideoCall={false} 
          autoEndCall={true}
          onClose={() => setDecliningCallRoomName(null)} 
        />
      )}
    </>
  );
}
