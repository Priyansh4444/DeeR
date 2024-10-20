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
import {
  ArrowRightIcon,
  ArrowRightSquareIcon,
  CheckCircle,
  Mic,
  MicOff,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMessages } from "@/hooks/useMessages";
import { handleFileUpload } from "@/hooks/api";
import { HumeVoiceComponent } from "./HumeVoiceComponent";
import { fetchAccessToken } from "hume";
import { useSpeechToText } from "@/hooks/SpeechToText";
// import LoadingAnimation from "./LoadingAnimation";

const WorkflowStep = ({ number, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-start space-x-3 mb-6"
    >
      <div className="flex-shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold"
        >
          {number}
        </motion.div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

const WorkflowGuide = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold mb-6 text-center"
      >
        Next.js Learning Path
      </motion.h2>

      <WorkflowStep
        number={1}
        title="Master the Basics"
        description="Learn React, JavaScript, and web fundamentals."
        delay={0.2}
      />

      <WorkflowStep
        number={2}
        title="Explore Next.js"
        description="Study routing, SSR, and API routes."
        delay={0.4}
      />

      <WorkflowStep
        number={3}
        title="Build Projects"
        description="Create real-world Next.js applications."
        delay={0.6}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-8 text-center text-green-500"
      >
        <CheckCircle className="inline-block mr-2" />
        <span>You're on your way to Next.js mastery!</span>
      </motion.div>
    </div>
  );
};

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
  const [showPopover, setShowPopover] = useState({
    send: false,
    mic: false,
    voice: false,
    upload: false,
  });

  const togglePopover = (button: keyof typeof showPopover) => {
    setShowPopover((prev) => ({
      ...prev,
      [button]: !prev[button],
    }));
  };

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
  const [showWorkflow, setShowWorkflow] = useState(false);
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
      setShowWorkflow(true);
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
    <>
      <Card className="fixed z-10 top-4 right-4 w-[28rem] h-[80vh] flex flex-col">
        <CardHeader className="font-bold text-lg">
          <div className="flex items-center justify-center space-x-1">
            <span className="bg-gradient-to-r from-red-500 to-red-500 bg-clip-text text-transparent">
              Hyperbolic
            </span>
            <span className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
              ✕
            </span>
            <span className="bg-gradient-to-r from-yellow-500 to-green-500 bg-clip-text text-transparent">
              Gemini
            </span>
            <span className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              ✕
            </span>
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Groq{"  "}
            </span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              RAG Chat
            </span>
          </div>
        </CardHeader>
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
              // <LoadingAnimation />
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
            <div className="relative">
              <Button
                className="mx-2 p-2 animate-shimmer inline-flex items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                onClick={handleSendClick}
                disabled={isLoading}
                onMouseEnter={() => togglePopover("send")}
                onMouseLeave={() => togglePopover("send")}
              >
                <ArrowRightIcon />
              </Button>
              {showPopover.send && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg">
                  Send message
                </div>
              )}
            </div>
            <div className="relative">
              <Button
                className="p-2 animate-shimmer inline-flex items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                onClick={toggleRecording}
                disabled={isTranscribing}
                onMouseEnter={() => togglePopover("mic")}
                onMouseLeave={() => togglePopover("mic")}
              >
                {isRecording ? <MicOff /> : <Mic />}
              </Button>
              {showPopover.mic && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg">
                  {isRecording ? "Stop recording" : "Start recording"}
                </div>
              )}
            </div>
            {accessToken && (
              <div className="relative">
                <HumeVoiceComponent
                  accessToken={accessToken}
                  onNewMessage={handleNewVoiceMessage}
                />
              </div>
            )}
            <div className="relative">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 animate-shimmer inline-flex items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                onMouseEnter={() => togglePopover("upload")}
                onMouseLeave={() => togglePopover("upload")}
              >
                <Upload />
              </Button>
              {showPopover.upload && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg">
                  Upload file
                </div>
              )}
            </div>
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
      {showWorkflow && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.5 }}
          className="fixed top-4 left-4 z-20"
        >
          <WorkflowGuide />
        </motion.div>

      )}
    </>
  );
};

export default HyperbolicRAGComponent;
