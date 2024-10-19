"use client";
import React, { useEffect } from "react";
import { VoiceProvider, useVoice, VoiceReadyState } from "@humeai/voice-react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import Messages from "./Message";
import Controls from "./Controls";

interface HumeVoiceProps {
    accessToken: string;
    onNewMessage: (message: { role: string; content: string }) => void;
}

const VoiceMessagesHandler: React.FC<{ onNewMessage: (message: { role: string; content: string }) => void }> = ({ onNewMessage }) => {
    const { messages: voiceMessages } = useVoice();

    useEffect(() => {
        voiceMessages.forEach((msg) => {
            if (msg.type === "user_message" || msg.type === "assistant_message") {
                onNewMessage({
                    role: msg.message.role,
                    content: msg.message.content,
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
    return (
        <VoiceProvider auth={{ type: "accessToken", value: accessToken }}>
            <VoiceMessagesHandler onNewMessage={onNewMessage} />
            <Controls />
        </VoiceProvider>
    );
};
