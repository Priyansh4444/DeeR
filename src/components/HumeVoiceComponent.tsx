"use client";
import React, { useCallback, useEffect, useState } from "react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import Controls from "./Controls";
import { useGlobalState } from "./GlobalContext";
import { SessionSettings } from "hume/api/resources/empathicVoice";
interface HumeVoiceProps {
  accessToken: string;
  onNewMessage: (message: { role: string; content: string }) => void;
}

const VoiceMessagesHandler: React.FC<{
  onNewMessage: (message: { role: string; content: string }) => void;
}> = ({ onNewMessage }) => {
  const { messages: voiceMessages } = useVoice();

  useEffect(() => {
    voiceMessages.forEach((msg) => {
      if (msg.type === "user_message" || msg.type === "assistant_message") {
        onNewMessage({
          role: msg.message.role,
          content: msg.message.content!,
        });
      }
    });
  }, [voiceMessages, onNewMessage]);

  return null;
};

export const HumeVoiceComponent: React.FC<HumeVoiceProps> = ({
  accessToken,
  onNewMessage,
}) => {
  const { chatHistory } = useGlobalState();
  const [systemSettings, setSystemSettings] = useState<SessionSettings>({
    type: "session_settings",
    systemPrompt: "",
  });
  const updateSystemSettings = useCallback(() => {
    const newSystemSettings: SessionSettings = {
      type: "session_settings",
      systemPrompt:
        "You are a teacher trying to teach this person using the richard feynman technique and after he says he is done you will give him feedback. This was the chat history: " +
        chatHistory.map((msg) => msg.content).join(" "),
    };
    console.log(newSystemSettings);
    console.log(chatHistory);
    setSystemSettings(newSystemSettings);
  }, [chatHistory]);
  return (
    <VoiceProvider
      auth={{ type: "accessToken", value: accessToken }}
      sessionSettings={systemSettings}
    >
      <VoiceMessagesHandler onNewMessage={onNewMessage} />
      <Controls onButtonPress={updateSystemSettings} />
    </VoiceProvider>
  );
};
