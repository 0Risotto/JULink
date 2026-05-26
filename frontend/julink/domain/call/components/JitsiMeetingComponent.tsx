"use client";

import { JitsiMeeting } from "@jitsi/react-sdk";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

interface JitsiMeetingComponentProps {
  roomName: string;
  isVideoCall?: boolean;
  autoEndCall?: boolean;
  onClose: () => void;
}

export function JitsiMeetingComponent({ roomName, isVideoCall = true, autoEndCall = false, onClose }: JitsiMeetingComponentProps) {
  const { myUsername } = useAppSelector((state) => state.user);
  const [loading, setLoading] = useState(true);

  const handleReadyToClose = () => {
    onClose();
  };

  return (
    <div className={`relative w-full h-full bg-black rounded-b-lg overflow-hidden ${autoEndCall ? 'hidden' : ''}`}>
      {loading && !autoEndCall && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
          <div className="flex flex-col items-center gap-4 text-white">
            <Spinner className="size-8" />
            <p>Connecting to call...</p>
          </div>
        </div>
      )}
      <JitsiMeeting
        domain="meet.opensuse.org"
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
          prejoinPageEnabled: false,
          disableLobby: true,
          startWithAudioMuted: false,
          startWithVideoMuted: !isVideoCall,
          defaultRole: "moderator",
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          TOOLBAR_BUTTONS: ["microphone", "camera", "hangup", "tileview"],
        }}
        onApiReady={(externalApi) => {
          setLoading(false);
          if (autoEndCall) {
            // End the call for everyone immediately
            externalApi.executeCommand('endConference');
            handleReadyToClose();
          } else {
            // Handle when the user leaves the call
            externalApi.addListener("videoConferenceLeft", () => {
              handleReadyToClose();
            });
          }
        }}
      />
    </div>
  );
}
