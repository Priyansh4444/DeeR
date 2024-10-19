import React, {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  ChangeEvent,
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

const API_KEY = process.env.HYPERBOLIC_API_KEY;
const API_URL = "https://api.hyperbolic.xyz/v1/chat/completions";
const BACKEND_URL = "http://localhost:8001"; // Updated to use port 8001
interface Message {
  role: "user" | "assistant";
  content: string;
}

const HyperbolicRAGComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const addToChromaDB = async (content: string) => {
    try {
      await fetch(`${BACKEND_URL}/add-to-chroma`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      console.error("Error adding to ChromaDB:", error);
    }
  };

  const getRelevantContext = async (query: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/query-chroma`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error("Error querying ChromaDB:", error);
      return [];
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get relevant context from ChromaDB
      const relevantContext = await getRelevantContext(input);

      // Add user input to ChromaDB
      await addToChromaDB(input);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `Relevant context: ${relevantContext.join(". ")}`,
            },
            ...messages,
            userMessage,
          ],
          model: "meta-llama/Meta-Llama-3.1-405B-Instruct",
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9,
          stream: true,
        }),
      });

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

      // Add assistant's response to ChromaDB
      await addToChromaDB(assistantMessage.content);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage();
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BACKEND_URL}/upload-file`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });
      console.log("File upload response:", response);
      if (response) {
        const result = await response.json();
        console.log("File upload result:", result);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `File "${file.name}" uploaded and processed successfully.`,
          },
        ]);
      }
      console.log(response);
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

  return (
    <Card className="fixed z-10 top-4 right-4 w-96 h-[80vh] flex flex-col">
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
            onChange={handleFileUpload}
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
