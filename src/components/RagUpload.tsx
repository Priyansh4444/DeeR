"use client";
import React, {
  useRef,
  KeyboardEvent,
  ChangeEvent,
  useCallback,
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
import { ArrowRightSquareIcon, Mic, MicOff, Upload } from "lucide-react";
import { useMessages } from "./useMessages";
import { handleFileUpload } from "./api";
import { HumeVoiceComponent } from "./HumeVoiceComponent";
import { fetchAccessToken } from "hume";
import { useSpeechToText } from "./SpeechToText";

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
    clearInput,
  } = useMessages();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [shouldSendTranscript, setShouldSendTranscript] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewTranscript = useCallback(
    (newTranscript: string) => {
      setMessages((prev) => {
        if (
          prev.some((msg) => msg.content === newTranscript) ||
          (prev.length > 0 && prev[prev.length - 1].role === "user")
        ) {
          return prev;
        }
        return [...prev, { role: "user", content: newTranscript }];
      });
      setInput(newTranscript);
      setShouldSendTranscript(true);
    },
    [setMessages, setInput]
  );

  const {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
  } = useSpeechToText(handleNewTranscript);

  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const token = await fetchAccessToken({
          apiKey: String(process.env.NEXT_PUBLIC_HUME_API_KEY),
          secretKey: String(process.env.NEXT_PUBLIC_HUME_SECRET_KEY),
        });
        setAccessToken(token);
      } catch (error) {
        console.error("Failed to fetch access token:", error);
      }
    };

    getAccessToken();
  }, []);

  useEffect(() => {
    if (shouldSendTranscript && !isLoading) {
      sendMessage();
      setShouldSendTranscript(false);
      clearInput();
    }
  }, [shouldSendTranscript, isLoading, sendMessage, clearInput]);

  const handleNewVoiceMessage = useCallback(
    (newMessage: { role: "user" | "assistant"; content: string }) => {
      console.log("New voice message:", newMessage);
      setMessages((prevMessages) => {
        if (!prevMessages.some((msg) => msg.content === newMessage.content)) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    },
    [setMessages]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage();
      clearInput();
    }
  };

  const handleSendClick = () => {
    sendMessage();
    clearInput();
  };

  const onFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await handleFileUpload(file);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `File "${file.name}" uploaded and processed successfully.`,
        },
      ]);
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error uploading file: ${error}. Please try again.`,
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Card className="fixed z-10 top-4 right-4 w-[26rem] h-[80vh] flex flex-col">
      <CardHeader className="font-bold text-lg">Hyperbolic RAG Chat</CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.content}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
              <div
                className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"
                style={{ animationDelay: "0.4s" }}
              ></div>
              <span className="text-sm text-gray-500">Processing...</span>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <div className="flex w-full items-center">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-grow mr-2"
          />
          <Button
            className="mx-2 p-2"
            onClick={handleSendClick}
            disabled={isLoading}
          >
            <ArrowRightSquareIcon />
          </Button>
          <Button
            className="p-2"
            onClick={toggleRecording}
            disabled={isTranscribing}
          >
            {isRecording ? <MicOff /> : <Mic />}
          </Button>
          {accessToken && (
            <HumeVoiceComponent
              accessToken={accessToken}
              onNewMessage={handleNewVoiceMessage}
            />
          )}
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2"
          >
            <Upload />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            className="hidden"
          />
        </div>
      </CardFooter>
      {error && <p className="text-red-500 mt-2">Error: {error}</p>}
    </Card>
  );
};

export default HyperbolicRAGComponent;
