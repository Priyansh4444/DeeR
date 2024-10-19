"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  createClient,
  LiveTranscriptionEvents,
  LiveClient,
} from "@deepgram/sdk";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play } from "lucide-react";

const SpeechToText: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioFile(audioBlob);
      });

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const streamToDeepgram = useCallback(async () => {
    if (!audioFile) {
      setError("No audio file to transcribe");
      return;
    }

    setIsTranscribing(true);
    setTranscript("");

    try {
      const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!);
      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
      });

      connection.addListener(LiveTranscriptionEvents.Open, () => {
        console.log("Connection opened.");

        const reader = audioFile.stream().getReader();

        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            connection.finish();
            return;
          }
          connection.send(value);
          pump();
        };

        pump();
      });

      connection.addListener(LiveTranscriptionEvents.Transcript, (data) => {
        setTranscript(
          (prev) => prev + " " + data.channel.alternatives[0].transcript
        );
      });

      connection.addListener(LiveTranscriptionEvents.Error, (err) => {
        console.error(err);
        setError(err.message);
      });

      connection.addListener(LiveTranscriptionEvents.Close, () => {
        console.log("Connection closed.");
        setIsTranscribing(false);
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsTranscribing(false);
    }
  }, [audioFile]);

  return (
    <div className="absolute bg-white z-20 bottom-10 left-10 h-[50vh] w-[30vw] p-4 overflow-auto">
      <h1 className="text-2xl font-bold mb-4">
        Audio Recorder and Transcriber
      </h1>
      <div className="flex space-x-2 mb-4">
        <Button onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
        <Button
          onClick={streamToDeepgram}
          disabled={!audioFile || isTranscribing}
        >
          <Play className="mr-2" />
          Transcribe
        </Button>
      </div>
      {error && <p className="text-red-500 mb-2">Error: {error}</p>}
      {isTranscribing && <p className="mb-2">Transcribing...</p>}
      <p className="whitespace-pre-wrap">{transcript}</p>
    </div>
  );
};

export default SpeechToText;
