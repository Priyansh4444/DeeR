import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwcml5YW5zaHBva2Vtb25AZ21haWwuY29tIiwiaWF0IjoxNzI5Mjk3MDY0fQ.2F5jdRmnQ2RK3BEsU6u5dJYv9ukVAJpYN24pz4KCeYI";
const API_URL = "https://api.hyperbolic.xyz/v1/chat/completions";

const HyperbolicRAGComponent = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: "meta-llama/Meta-Llama-3.1-405B-Instruct",
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        const assistantMessage = {
          role: "assistant",
          content: data.choices[0].message.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        console.error("Unexpected response format:", data);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-96 flex flex-col">
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
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-grow mr-2"
        />
        <Button onClick={sendMessage} disabled={isLoading}>
          Send
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HyperbolicRAGComponent;
