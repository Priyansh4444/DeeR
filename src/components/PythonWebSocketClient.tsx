"use client";

import ReconnectingWebSocket from "reconnecting-websocket";
import { useEffect, useState, useRef } from "react";

interface Emotion {
  name: string;
  score: number;
}

interface HumeResponse {
  emotions?: Emotion[];
  face_detected?: boolean;
  face_probability?: number;
  error?: string;
}

interface PythonWebSocketClientProps {
  data: ArrayBuffer | null;
}

const PythonWebSocketClient = ({ data }: PythonWebSocketClientProps) => {
  const [message, setMessage] = useState<HumeResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const websocketRef = useRef<ReconnectingWebSocket | null>(null);
  const lastProcessedTime = useRef<number>(0);

  useEffect(() => {
    const ws = new ReconnectingWebSocket("ws://localhost:8000/ws");
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      console.log("WebSocket connection established");
      websocketRef.current = ws;
    };

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        setMessage((prevMessage) => {
          if (!prevMessage || !prevMessage.emotions) return response;
          return {
            ...response,
            emotions: response.emotions.map((emotion: Emotion) => ({
              ...emotion,
              score:
                0.7 * emotion.score +
                0.3 *
                  (prevMessage.emotions!.find((e) => e.name === emotion.name)
                    ?.score || 0),
            })),
          };
        });
        setIsProcessing(false);
      } catch (error) {
        console.error("Error parsing response:", error);
        setMessage({ error: "Failed to parse server response" });
        setIsProcessing(false);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setMessage({ error: "WebSocket connection error" });
      setIsProcessing(false);
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    const currentTime = Date.now();
    if (
      websocketRef.current &&
      data &&
      currentTime - lastProcessedTime.current > 1000
    ) {
      setIsProcessing(true);
      websocketRef.current.send(data);
      lastProcessedTime.current = currentTime;
    }
  }, [data]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 p-4 rounded-lg shadow-lg z-50 max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">Emotion Analysis</h2>
      {isProcessing && (
        <div className="absolute top-0 right-0 mt-2 mr-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        </div>
      )}
      <div>
        {message?.error ? (
          <div className="text-red-500 p-2 rounded">Error: {message.error}</div>
        ) : message?.emotions ? (
          <div className="space-y-2">
            {message.emotions.map((emotion, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-medium">{emotion.name}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${emotion.score * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm">
                  {(emotion.score * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No analysis data available</p>
        )}
        {message?.face_detected !== undefined && (
          <p className="mt-2 text-sm">
            Face detected: {message.face_detected ? "Yes" : "No"}
            {message.face_probability &&
              ` (${(message.face_probability * 100).toFixed(1)}%)`}
          </p>
        )}
      </div>
    </div>
  );
};

export default PythonWebSocketClient;
