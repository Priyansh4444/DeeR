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
  const [showPopover, setShowPopover] = useState(false);

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
    onButtonPress();
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
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

  const getPopoverContent = () => {
    if (showMathPrompt) {
      return "Let's talk about NextJS!!";
    }
    return readyState === VoiceReadyState.OPEN
      ? "Disconnect with DeeR"
      : "Connect to DeeR  ";
  };

  return (
    <div className="relative">
      <Button
        className={`mx-2 p-2 transition-all duration-300 ${
          isGlowing
            ? "animate-pulse bg-[#FFD700] hover:bg-[#FFE55C] text-[#1A2238]"
            : readyState === VoiceReadyState.OPEN
            ? "bg-[#FF6B6B] hover:bg-[#FF8F8F] text-white"
            : showMathPrompt
            ? "bg-[#FFD700] hover:bg-[#FFE55C] text-[#1A2238]"
            : "bg-[#38E4E1] hover:bg-[#5FFBF1] text-[#1A2238]"
        }`}
        onClick={handleInteraction}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
      >
        {getButtonContent()}
      </Button>
      {showPopover && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#F8F9FA] text-[#1A2238] text-sm rounded shadow-md whitespace-nowrap">
          {getPopoverContent()}
        </div>
      )}
    </div>
  );
}
