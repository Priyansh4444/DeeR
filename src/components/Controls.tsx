// ./components/Controls.tsx
"use client";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { Button } from "./ui/button";
import { FireExtinguisher, FlameKindling, Mic, MicOff } from "lucide-react";
export default function Controls() {
  const { connect, disconnect, readyState } = useVoice();

  if (readyState === VoiceReadyState.OPEN) {
    return (
      <Button
        className="mx-2 p-3"
        onClick={() => {
          disconnect();
        }}
      >
        <FireExtinguisher />
      </Button>
    );
  }

  return (
    <Button
      className="mx-2 p-3"
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
      <FlameKindling />
    </Button>
  );
}
