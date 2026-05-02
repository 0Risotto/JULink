"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { Client } from "@stomp/stompjs";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { JitsiMeetingComponent } from "@/domain/temp/call/components/JitsiMeetingComponent";
import { useUser } from "@/domain/profile/hooks/useUser";

function CallPageContent() {
  const { myUsername, loadMyUsername } = useUser();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");
  const callerParam = searchParams.get("caller");
  const router = useRouter();

  const [messages, setMessages] = useState<string[]>([]);
  const [friendUsername, setFriendUsername] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  const [activeRoom, setActiveRoom] = useState<string | null>(roomParam);

  useEffect(() => {
    // If we have a room parameter, we're joining a call
    if (roomParam) {
      setActiveRoom(roomParam);
      return;
    }

    if (!myUsername) {
      loadMyUsername().catch(console.error);
    }

    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Configure STOMP client for initiating calls
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: token ? {
        Authorization: `Bearer ${token}`
      } : {},
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to STOMP server");
        setIsConnected(true);
        addMessage("Connected to server");

        client.subscribe("/topic/video-calls", (message) => {
          addMessage("RECEIVED on /topic/video-calls: " + message.body);
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        addMessage("STOMP ERROR: " + frame.headers["message"]);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
        addMessage("Disconnected from server");
      }
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
    };
  }, [roomParam]);

  const addMessage = (msg: string) => {
    setMessages((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const handleInitiateCall = () => {
    if (!friendUsername) {
      addMessage("Please enter a friend username");
      return;
    }
    if (stompClientRef.current && isConnected) {
      stompClientRef.current.publish({
        destination: "/app/video/initiate",
        body: JSON.stringify({ username: friendUsername, caller: myUsername }), // Match VideoDTOs.intiate
      });
      addMessage(`Initiating call with friend: ${friendUsername}`);
      
      // Wait for a bit to allow STOMP message to go out, but since Jitsi room isn't returned synchronously to the caller via socket... 
      // Actually, VideoService.java returns the Jitsi URL to the HTTP controller or WebSocket?
      // Wait, let's see: VideoController.initiate is a @MessageMapping method, it returns void.
      // So the caller doesn't know the room name! 
      // The caller just initiates the call. But how does the caller join the room?
    } else {
      addMessage("Cannot initiate call, not connected.");
    }
  };

  if (activeRoom) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Video Call</h1>
        <p className="text-zinc-500">
          Room: {activeRoom} {callerParam && `| Caller: ${callerParam}`}
        </p>
        <JitsiMeetingComponent roomName={activeRoom} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Temporary Video Call Test</h1>
      
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="font-semibold">{isConnected ? "Connected" : "Disconnected"}</span>
      </div>

      <div className="space-y-4 border p-4 rounded-md bg-gray-50 dark:bg-gray-900">
        <div>
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          <div className="flex gap-4 items-center">
            
            <div className="flex items-center gap-2 pl-4">
              <input 
                type="text" 
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                placeholder="Friend Username"
                className="border p-2 rounded text-black dark:text-white dark:bg-gray-800"
              />
              <Button onClick={handleInitiateCall}>
                Call Friend
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="border p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        <div className="h-64 overflow-y-auto space-y-2 bg-black text-green-400 p-4 rounded text-sm font-mono">
          {messages.length === 0 ? (
            <div className="text-gray-500">No messages yet...</div>
          ) : (
            messages.map((msg, index) => (
              <div key={index}>{msg}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function TempCallPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallPageContent />
    </Suspense>
  );
}
