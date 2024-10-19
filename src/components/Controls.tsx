// ./components/Controls.tsx
"use client";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { Button } from "./ui/button";
import { Mic, MicOff } from "lucide-react";
export default function Controls() {
  const { connect, disconnect, readyState } = useVoice();

  if (readyState === VoiceReadyState.OPEN) {
    return (
      <Button
        className="mx-3 p-3"
        onClick={() => {
          disconnect();
        }}
      >
        <MicOff />
      </Button>
    );
  }

  return (
    <Button
      className="mx-3 p-3"
      onClick={() => {
        connect()
          .then(() => {
            /* handle success */
          })
          .catch(() => {
            /* handle error */
          });
      }}
    >
      <Mic />
    </Button>
  );
}
