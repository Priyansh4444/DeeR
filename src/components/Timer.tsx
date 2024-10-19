"use client";
import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, MessageCircle, RotateCcw } from "lucide-react";
import { toast, useToast } from "@/hooks/use-toast";

const TutorialStudyFeynmanTimer = () => {
  const [isStudyMode, setIsStudyMode] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showTooltip, setShowTooltip] = useState(false);
  const [cycles, setCycles] = useState(0);

  const switchMode = useCallback(() => {
    setIsStudyMode((prevMode) => !prevMode);
    setTimeLeft(6);
    if (isStudyMode) {
      setCycles((prev) => prev + 1);
    }
  }, [isStudyMode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          toast({
            title: isStudyMode ? "Study Time" : "Explanation time",
            description: isStudyMode
              ? "Start Studying the material"
              : "Start Explaining what you have learned",
          });
          switchMode();
          return 30;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [switchMode]);

  const resetTimer = () => {
    setIsStudyMode(true);
    setTimeLeft(6);
    setCycles(0);
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
      <div className="text-sm font-mono dark:text-white mr-2">{timeLeft}s</div>
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
          {isStudyMode ? "Study Session (6s)" : "Feynman Technique (6s)"}
        </div>
      )}
    </div>
  );
};

export default TutorialStudyFeynmanTimer;
