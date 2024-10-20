"use client";
import { useState, useCallback } from "react";
import { Message } from "./types";
import { sendMessageToAPI, addToChromaDB, playAudioMessage } from "./api";
import { useGlobalState } from "../components/GlobalContext";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { setChatHistory } = useGlobalState();

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => {
      if (prev.some((msg) => msg.content === userMessage.content)) {
        return prev;
      }
      setChatHistory((prev: any) => [...prev, userMessage]);
      return [...prev, userMessage];
    });
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessageToAPI(messages, input);
      console.log("Response:", response);
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
      };
      console.log("Assistant message:", assistantMessage);

      await addToChromaDB(assistantMessage.content);
      setMessages((prev) => [...prev, assistantMessage]);
      setChatHistory((prev: any) => [...prev, assistantMessage]);
      console.log("Assistant message:", assistantMessage.content);
      playAudioMessage(assistantMessage.content);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages]);

  const clearInput = () => {
    setInput("");
  };

  return {
    messages,
    input,
    isLoading,
    isUploading,
    setInput,
    setIsUploading,
    sendMessage,
    setMessages,
    clearInput,
  };
};
