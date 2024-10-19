/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/VideoCall.tsx
"use client";

import dynamic from "next/dynamic";
import PythonWebSocketClient from "./PythonWebSocketClient";
import { useEffect, useState } from "react";
import HyperbolicRAGComponent from "./RagUpload";
import CompactStudyFeynmanTimer from "./Timer";

// Create a wrapper component that will be dynamically imported
const DynamicVideoCall = dynamic(
  async () => {
    const AgoraRTC = (await import("agora-rtc-react")).default;
    const {
      AgoraRTCProvider,
      LocalVideoTrack,
      RemoteUser,
      useJoin,
      useLocalCameraTrack,
      useLocalMicrophoneTrack,
      usePublish,
      useRTCClient,
      useRemoteAudioTracks,
      useRemoteUsers,
    } = await import("agora-rtc-react");

    const VideoCallComponent = ({
      appId,
      channelName,
    }: {
      appId: string;
      channelName: string;
    }) => {
      const client = useRTCClient(
        AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })
      );

      return (
        <AgoraRTCProvider client={client}>
          <Videos channelName={channelName} AppID={appId} />
          <div className="fixed z-10 bottom-0 left-0 right-0 flex justify-center pb-4">
            <a
              className="px-5 py-3 text-base font-medium text-center text-white bg-red-400 rounded-lg hover:bg-red-500 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900 w-40"
              href="/"
            >
              End Call
            </a>
          </div>
        </AgoraRTCProvider>
      );
    };

    function Videos({
      channelName,
      AppID,
    }: {
      channelName: string;
      AppID: string;
    }) {
      const { isLoading: isLoadingMic, localMicrophoneTrack } =
        useLocalMicrophoneTrack();
      const [frameData, setFrameData] = useState<ArrayBuffer | null>(null);
      const { isLoading: isLoadingCam, localCameraTrack } =
        useLocalCameraTrack();
      const remoteUsers = useRemoteUsers();
      const { audioTracks } = useRemoteAudioTracks(remoteUsers);

      usePublish([localMicrophoneTrack, localCameraTrack]);
      useJoin({
        appid: AppID,
        channel: channelName,
        token: null,
      });

      useEffect(() => {
        audioTracks.map((track) => track.play());
      }, [audioTracks]);

      useEffect(() => {
        if (localCameraTrack) {
          const intervalId = setInterval(() => {
            const frame = localCameraTrack.getCurrentFrameData();
            setFrameData(frame.data.buffer as ArrayBuffer);
          }, 1000); // Capture frame every second

          return () => clearInterval(intervalId);
        }
      }, [localCameraTrack]);

      const unit = "minmax(0, 1fr) ";
      return (
        <div className="flex flex-col justify-between w-full h-screen p-1">
          {isLoadingCam || isLoadingMic ? (
            <div>Loading devices...</div>
          ) : (
            <div
              className={`grid gap-1 flex-1`}
              style={{
                gridTemplateColumns:
                  remoteUsers.length > 9
                    ? unit.repeat(4)
                    : remoteUsers.length > 4
                    ? unit.repeat(3)
                    : remoteUsers.length > 1
                    ? unit.repeat(2)
                    : unit,
              }}
            >
              {/* <PythonWebSocketClient data={frameData} /> */}
              <HyperbolicRAGComponent />
              <CompactStudyFeynmanTimer />
              <LocalVideoTrack
                track={localCameraTrack}
                play={true}
                className="w-full h-full"
              />
              {remoteUsers.map((user, index) => (
                <RemoteUser user={user} key={index} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return VideoCallComponent;
  },
  {
    ssr: false, // Disable server-side rendering for this component
    loading: () => <div>Loading video call component...</div>,
  }
);

// Export the dynamic component
export default function Call({
  appId,
  channelName,
}: {
  appId: string;
  channelName: string;
}) {
  return <DynamicVideoCall appId={appId} channelName={channelName} />;
}
