import { useState } from "react";
import { Message } from "./types";
import { sendMessageToAPI, addToChromaDB } from "./api";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessageToAPI(messages, input);
      const reader = response.body?.getReader();
      const assistantMessage: Message = { role: "assistant", content: "" };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonString = line.slice(6);
              if (jsonString.trim() === "[DONE]") break;

              try {
                const jsonData = JSON.parse(jsonString);
                const content = jsonData.choices[0]?.delta?.content || "";
                assistantMessage.content += content;
                setMessages((prev) => {
                  if (prev[prev.length - 1]?.role === "assistant") {
                    return [...prev.slice(0, -1), { ...assistantMessage }];
                  }
                  return [...prev, { ...assistantMessage }];
                });
              } catch (error) {
                console.error("Error parsing JSON:", error);
              }
            }
          }
        }
      }

      await addToChromaDB(assistantMessage.content);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
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
  };
};