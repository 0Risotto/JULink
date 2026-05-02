"use client";

import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { useUser } from "@/domain/profile/hooks/useUser";

export function GlobalCallListener() {
  const { myUsername, loadMyUsername } = useUser();
  const [incomingCall, setIncomingCall] = useState<{ callerUsername: string, videoUrl: string } | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const router = useRouter();

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
            if (payload.type === "INVITE_TO_VIDEO") {
              console.log("Received a video call payload for:", payload.targetUsername, "from:", payload.callerUsername);
              // Check if the call is for the current user
              if (payload.targetUsername === myUsername) {
                console.log(`[Incoming Call] You are being called by ${payload.callerUsername}!`);
                setIncomingCall({
                  callerUsername: payload.callerUsername,
                  videoUrl: payload.videoUrl,
                });
              } 
              // Check if the current user is the caller (to join the room they just initiated)
              else if (payload.callerUsername === myUsername) {
                console.log(`[Outgoing Call] You initiated a call to ${payload.targetUsername}. Redirecting to room...`);
                const roomName = payload.videoUrl.split("/").pop();
                router.push(`/temp/call?room=${roomName}&caller=me`);
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

  if (!incomingCall) return null;

  const handleAccept = () => {
    // Redirect to the call interface
    const roomName = incomingCall.videoUrl.split("/").pop();
    router.push(`/temp/call?room=${roomName}&caller=${incomingCall.callerUsername}`);
    setIncomingCall(null);
  };

  const handleDecline = () => {
    setIncomingCall(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl max-w-sm w-full space-y-4">
        <h2 className="text-xl font-bold text-center">Incoming Call</h2>
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-black dark:text-white">{incomingCall.callerUsername}</span> is calling you.
        </p>
        
        <div className="flex gap-4 pt-4">
          <Button variant="destructive" className="flex-1" onClick={handleDecline}>
            Decline
          </Button>
          <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
