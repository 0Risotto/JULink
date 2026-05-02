"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

interface JitsiMeetingComponentProps {
  roomName: string;
}

export function JitsiMeetingComponent({ roomName }: JitsiMeetingComponentProps) {
  const { myUsername } = useAppSelector((state) => state.user);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const handleReadyToClose = () => {
    // Navigate back to home or close the call
    router.push("/home");
  };

  return (
    <div className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden border">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
          <div className="flex flex-col items-center gap-4 text-white">
            <Spinner className="size-8" />
            <p>Connecting to call...</p>
          </div>
        </div>
      )}
      <JitsiMeeting
        roomName={roomName}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "100%";
          iframeRef.style.width = "100%";
        }}
        userInfo={{
          displayName: myUsername || "User",
          email: "",
        }}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false, // Skip prejoin page to join immediately
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        }}
        onApiReady={(externalApi) => {
          setLoading(false);
          // Handle when the user leaves the call
          externalApi.addListener("videoConferenceLeft", () => {
            handleReadyToClose();
          });
        }}
      />
    </div>
  );
}
