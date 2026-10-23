"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { useUser } from "@/domain/profile/hooks/useUser";
import { getUserProfile } from "@/domain/profile/services/profileServices";
import { UserProfileDTO } from "@/domain/profile/types";
import { JitsiMeetingComponent } from "./JitsiMeetingComponent";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import * as chatApi from "@/domain/chat/api/chatApi";
import { getWsBaseUrl, getWsTicket } from "@/util/api/axios";

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
    if (!myUsername) {
      loadMyUsername().catch(console.error);
      return;
    }

    let closed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      try {
        const { ticket } = await getWsTicket();
        if (closed) return;

        socket = new WebSocket(
          `${getWsBaseUrl()}/ws?ticket=${encodeURIComponent(ticket)}`,
        );

        socket.onmessage = (event) => {
          try {
            const frame = JSON.parse(event.data as string);
            const call = frame?.call;
            if (!call) return;

            const participants: Array<{
              username: string;
              role: string;
              status: string;
            }> = call.participants || [];
            const me = participants.find((p) => p.username === myUsername);
            const caller = participants.find((p) => p.role === "caller");

            if (frame.type === "session.created" || frame.type === "session.updated") {
              if (call.status === "ringing") {
                if (me?.role === "caller") {
                  setActiveCall({
                    roomName: call.room_name,
                    isVideoCall: call.call_type === "video",
                  });
                  setIsMinimized(false);
                  sessionStorage.setItem("activeCallId", call.id);
                } else if (me?.status === "invited") {
                  if (caller?.username) {
                    getUserProfile(caller.username)
                      .then((res) => {
                        if (res.user) setCallerProfile(res.user);
                      })
                      .catch(console.error);
                  }
                  setIncomingCall({
                    callerUsername: caller?.username || "Unknown",
                    videoUrl: call.jitsi_url,
                  });
                  setIsIncomingMinimized(false);
                  sessionStorage.setItem("activeCallId", call.id);
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(console.error);
                  }
                }
              } else if (["declined", "cancelled", "ended"].includes(call.status)) {
                stopRingtone();
                setIncomingCall(null);
                setCallerProfile(null);
                setActiveCall(null);
                sessionStorage.removeItem("activeCallId");
              }
            }
          } catch (error) {
            console.error("Error parsing call event", error);
          }
        };

        socket.onclose = () => {
          if (!closed) reconnectTimer = setTimeout(connect, 3000);
        };
        socket.onerror = () => socket?.close();
      } catch (error) {
        console.error("Could not open call socket", error);
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
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
    
    const activeCallId = sessionStorage.getItem("activeCallId");
    if (activeCallId) {
      chatApi.acceptCall(activeCallId).catch(console.error);
    }

    setActiveCall({ roomName, isVideoCall: true });
    setIsMinimized(false);
    setIncomingCall(null);
    setCallerProfile(null);
  };

  const handleDecline = () => {
    stopRingtone();
    
    const activeCallId = sessionStorage.getItem("activeCallId");
    if (activeCallId) {
      chatApi.declineCall(activeCallId).catch(console.error);
    }

    if (incomingCall) {
      const roomName = incomingCall.videoUrl.split("/").pop() as string;
      setDecliningCallRoomName(roomName);
    }
    setIncomingCall(null);
    setCallerProfile(null);
    sessionStorage.removeItem("activeCallId");
  };

  const handleHangUp = () => {
    const activeCallId = sessionStorage.getItem("activeCallId");
    if (activeCallId) {
      chatApi.endCall(activeCallId).catch(console.error);
    }
    setActiveCall(null);
    sessionStorage.removeItem("activeCallId");
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
                onClick={handleHangUp}
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
