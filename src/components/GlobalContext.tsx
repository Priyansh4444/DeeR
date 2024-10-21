"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

interface Message {
  role: string;
  content: string;
}

interface VisionData {
  emotions?: string[];
  objects?: string[];
}

interface GlobalStateContextType {
  transcript: string;
  setTranscript: (transcript: string) => void;
  chatHistory: Message[];
  addMessage: (message: Message) => void;
  ragQuery: (query: string) => Promise<string[]>;
  visionData: VisionData | null;
  setVisionData: (data: VisionData | null) => void;
  setChatHistory: (history: Message[]) => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(
  undefined
);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transcript, setTranscript] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [visionData, setVisionData] = useState<VisionData | null>(null);

  const addMessage = useCallback((message: Message) => {
    setChatHistory((prev) => [...prev, message]);
  }, []);

  const ragQuery = useCallback(async (query: string): Promise<string[]> => {
    // get rag query for voice model before starting feynman method
    const response = await fetch("/api/query-chroma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    return data.results;
  }, []);

  return (
    <GlobalStateContext.Provider
      value={{
        transcript,
        setTranscript,
        chatHistory,
        addMessage,
        ragQuery,
        visionData,
        setVisionData,
        setChatHistory,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
};
