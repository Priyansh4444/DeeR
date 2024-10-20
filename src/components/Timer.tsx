"use client";
import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, MessageCircle, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TutorialStudyFeynmanTimer = () => {
  const [isStudyMode, setIsStudyMode] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120); // Start with 2 minutes for study mode
  const [showTooltip, setShowTooltip] = useState(false);
  const [cycles, setCycles] = useState(0);

  const emitGlowEvent = useCallback(() => {
    const event = new CustomEvent("accessTokenButtonGlow", {
      detail: { glow: true },
    });
    window.dispatchEvent(event);
    // Stop the glow after 5 seconds
    setTimeout(() => {
      const stopEvent = new CustomEvent("accessTokenButtonGlow", {
        detail: { glow: false },
      });
      window.dispatchEvent(stopEvent);
    }, 5000);
  }, []);

  const switchMode = useCallback(() => {
    setIsStudyMode((prevMode) => !prevMode);
    setTimeLeft((prevMode) => (prevMode ? 30 : 120)); // 30 seconds for explanation, 2 minutes for study
    if (isStudyMode) {
      setCycles((prev) => prev + 1);
    }
    emitGlowEvent();
  }, [isStudyMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          toast({
            title: !isStudyMode ? "Study Time" : "Explanation Time",
            description: !isStudyMode
              ? "Start studying the material (2 minutes)"
              : "Start explaining what you have learned (30 seconds)",
          });
          switchMode();
          return isStudyMode ? 30 : 120; // Set the correct time for the next mode
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [switchMode, isStudyMode]);

  const resetTimer = () => {
    setIsStudyMode(true);
    setTimeLeft(120);
    setCycles(0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="fixed bottom-4 left-4 flex items-center bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 z-50 cursor-pointer transition-all duration-300 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`rounded-full p-2 mr-2 ${
          isStudyMode
            ? "bg-blue-100 dark:bg-blue-900"
            : "bg-green-100 dark:bg-green-900"
        }`}
      >
        {isStudyMode ? (
          <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-300" />
        ) : (
          <MessageCircle className="w-5 h-5 text-green-500 dark:text-green-300" />
        )}
      </div>
      <div className="text-sm font-mono dark:text-white mr-2">
        {formatTime(timeLeft)}
      </div>
      <div className="text-xs font-mono dark:text-gray-300">
        Cycle: {cycles}
      </div>
      <button
        onClick={resetTimer}
        className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        title="Reset Timer"
      >
        <RotateCcw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg">
          {isStudyMode
            ? "Study Session (2 minutes)"
            : "Feynman Technique (30 seconds)"}
        </div>
      )}
    </div>
  );
};

export default TutorialStudyFeynmanTimer;
