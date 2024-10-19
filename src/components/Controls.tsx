"use client";
import React, { useEffect, useState } from "react";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { Button } from "./ui/button";
import { FireExtinguisher, FlameKindling, BrainCircuit } from "lucide-react";

interface ControlsProps {
  onButtonPress: () => void;
}

export default function Controls({ onButtonPress }: ControlsProps) {
  const { connect, disconnect, readyState } = useVoice();
  const [isGlowing, setIsGlowing] = useState(false);
  const [showMathPrompt, setShowMathPrompt] = useState(false);

  useEffect(() => {
    const handleGlowEvent = (event: CustomEvent) => {
      setIsGlowing(event.detail.glow);
      if (event.detail.glow) {
        setShowMathPrompt(true);
      }
    };

    window.addEventListener(
      "accessTokenButtonGlow",
      handleGlowEvent as EventListener
    );

    return () => {
      window.removeEventListener(
        "accessTokenButtonGlow",
        handleGlowEvent as EventListener
      );
    };
  }, []);

  const handleInteraction = async () => {
    if (showMathPrompt) {
      // Here you would typically show a math problem or prompt for math-related input
      console.log("Show math prompt");
      setShowMathPrompt(false);
    } else if (readyState === VoiceReadyState.OPEN) {
      handleDisconnect();
    } else {
      await handleConnect();
    }
    setIsGlowing(false);
  };

  const handleConnect = async () => {
    onButtonPress(); // Update system settings
    try {
      await connect();
      // handle success
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    // You might want to do something here after disconnecting
  };

  const getButtonContent = () => {
    if (showMathPrompt) {
      return <BrainCircuit className="w-5 h-5" />;
    }
    return readyState === VoiceReadyState.OPEN ? (
      <FireExtinguisher className="w-5 h-5" />
    ) : (
      <FlameKindling className="w-5 h-5" />
    );
  };

  return (
    <Button
      className={`mx-2 p-2 transition-all duration-300 ${
        isGlowing
          ? "animate-pulse bg-yellow-400 hover:bg-yellow-500"
          : readyState === VoiceReadyState.OPEN
          ? "bg-red-500 hover:bg-red-600"
          : "bg-blue-500 hover:bg-blue-600"
      }`}
      onClick={handleInteraction}
    >
      {getButtonContent()}
    </Button>
  );
}
