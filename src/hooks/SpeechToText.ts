import { useState, useRef, useCallback, useEffect } from "react";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

export const useSpeechToText = (
  onNewTranscript: (transcript: string) => void
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptBufferRef = useRef<string>("");

  const clearAllState = useCallback(() => {
    setTranscript("");
    setError(null);
    setAudioFile(null);
    transcriptBufferRef.current = "";
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    clearAllState();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener("stop", () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioFile(audioBlob);
      });

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  }, [clearAllState]);

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
    transcriptBufferRef.current = "";
    setTranscript("");

    try {
      const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!);
      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        filler_words: true,
        punctuate: true,
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
        const newTranscript = data.channel.alternatives[0].transcript;
        transcriptBufferRef.current += newTranscript + " ";
        setTranscript(transcriptBufferRef.current.trim());
      });

      connection.addListener(LiveTranscriptionEvents.Error, (err) => {
        console.error(err);
        setError(err.message);
      });

      connection.addListener(LiveTranscriptionEvents.Close, () => {
        console.log("Connection closed.");
        setIsTranscribing(false);
        if (transcriptBufferRef.current.trim()) {
          onNewTranscript(transcriptBufferRef.current.trim());
        }
        clearAllState();
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsTranscribing(false);
    }
  }, [audioFile, onNewTranscript, clearAllState]);

  useEffect(() => {
    if (!isRecording && audioFile) {
      streamToDeepgram();
    }
  }, [isRecording, audioFile, streamToDeepgram]);

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
  };
};
