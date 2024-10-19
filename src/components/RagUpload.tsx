import React, {
  useRef,
  KeyboardEvent,
  ChangeEvent,
  useEffect,
  useState,
} from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload } from "lucide-react";
import { useMessages } from "./useMessages";
import { handleFileUpload, playAudioMessage } from "./api";
import { Message } from "./types";

interface ExtendedMessage extends Message {
  audioData?: string;
  isLoading?: boolean;
}

const HyperbolicRAGComponent: React.FC = () => {
  const {
    messages,
    input,
    isLoading,
    isUploading,
    setInput,
    setIsUploading,
    sendMessage,
    setMessages,
  } = useMessages();

  const [extendedMessages, setExtendedMessages] = useState<ExtendedMessage[]>(
    []
  );

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prepareAudioAndMessage = async () => {
      if (!isLoading && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "assistant" && !("audioData" in lastMessage)) {
          // Add a loading message
          setExtendedMessages((prevMessages) => [
            ...prevMessages,
            { ...lastMessage, isLoading: true } as ExtendedMessage,
          ]);

          try {
            // Simulate audio preparation and chain of thought process
            await new Promise((resolve) => setTimeout(resolve, 3000));

            setExtendedMessages((prevMessages) => [
              ...prevMessages.slice(0, -1),
              {
                ...lastMessage,
                audioData: lastMessage.content,
                isLoading: false,
              } as ExtendedMessage,
            ]);

            // Play the audio
            playAudioMessage(lastMessage.content);
          } catch (error) {
            console.error("Error preparing audio:", error);
            setExtendedMessages((prevMessages) => [
              ...prevMessages.slice(0, -1),
              { ...lastMessage, isLoading: false } as ExtendedMessage,
            ]);
          }
        }
      }
    };

    prepareAudioAndMessage();
  }, [isLoading, messages]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage();
    }
  };

  const onFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await handleFileUpload(file);
      setExtendedMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `File "${file.name}" uploaded and processed successfully.`,
        } as ExtendedMessage,
      ]);
    } catch (error) {
      console.error("Error uploading file:", error);
      setExtendedMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error uploading file: ${error}. Please try again.`,
        } as ExtendedMessage,
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMessageClick = (msg: ExtendedMessage) => {
    if (msg.role === "assistant" && msg.audioData) {
      playAudioMessage(msg.audioData);
    }
  };

  return (
    <Card className="fixed z-10 top-4 right-4 w-96 h-[80vh] flex flex-col">
      <CardHeader className="font-bold text-lg">Hyperbolic RAG Chat</CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          {extendedMessages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
              onClick={() => handleMessageClick(msg)}
            >
              {msg.isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div
                    className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                  <span className="text-sm text-gray-500">
                    Chain of thought processing with multiple LLMs and querying
                    RAG...
                  </span>
                </div>
              ) : (
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black cursor-pointer"
                  }`}
                >
                  {msg.content}
                </span>
              )}
            </div>
          ))}
          {isLoading && <div className="text-center">Loading...</div>}
          {isUploading && <div className="text-center">Uploading file...</div>}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <div className="flex w-full">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-grow mr-2"
          />
          <Button onClick={sendMessage} disabled={isLoading}>
            Send
          </Button>
        </div>
        <div className="flex w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" /> Upload File
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default HyperbolicRAGComponent;
