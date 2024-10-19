import React, { createContext, useContext, useState, useCallback } from "react";

interface Message {
  role: string;
  content: string;
}

interface GlobalStateContextType {
  transcript: string;
  setTranscript: (transcript: string) => void;
  chatHistory: Message[];
  addMessage: (message: Message) => void;
  ragQuery: (query: string) => Promise<string[]>;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(
  undefined
);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transcript, setTranscript] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  const addMessage = useCallback((message: Message) => {
    setChatHistory((prev) => [...prev, message]);
  }, []);

  const ragQuery = useCallback(async (query: string): Promise<string[]> => {
    // Implement your RAG query logic here
    // This is a placeholder implementation
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
