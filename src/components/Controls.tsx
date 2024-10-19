"use client";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { Button } from "./ui/button";
import { FireExtinguisher, FlameKindling } from "lucide-react";

interface ControlsProps {
  onButtonPress: () => void;
}

export default function Controls({ onButtonPress }: ControlsProps) {
  const { connect, disconnect, readyState } = useVoice();

  const handleConnect = async () => {
    onButtonPress(); // Update system settings
    try {
      await connect();
      // handle success
    } catch (error) {
      // handle error
      console.error("Failed to connect:", error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    // You might want to do something here after disconnecting
  };

  if (readyState === VoiceReadyState.OPEN) {
    return (
      <Button className="mx-2 p-3" onClick={handleDisconnect}>
        <FireExtinguisher />
      </Button>
    );
  }

  return (
    <Button className="mx-2 p-3" onClick={handleConnect}>
      <FlameKindling />
    </Button>
  );
}
