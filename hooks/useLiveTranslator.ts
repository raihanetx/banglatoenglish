import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { blobToBase64 } from '../utils/audioUtils';
import { RecorderState, TranscriptionItem } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION_TRANSLATE = `
You are a fast Bengali-to-English translator. 
1. I will provide an audio file containing Bengali speech.
2. Translate it directly into English.
3. Output ONLY the English translation. No explanations.
`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useLiveTranslator = () => {
  const [recorderState, setRecorderState] = useState<RecorderState>(RecorderState.IDLE);
  const [volume, setVolume] = useState(0);
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // --- Recording Logic ---

  const startRecording = useCallback(async () => {
    if (!process.env.API_KEY) {
      console.error("API Key missing");
      setRecorderState(RecorderState.ERROR);
      return;
    }

    try {
      // 1. Get Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Setup Visualizer
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Start visualizer loop
      updateVolume(); 

      // 3. Setup Recorder
      // Prefer webm or mp4
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        await handleRecordingStop(mimeType);
      };

      recorder.start();
      setRecorderState(RecorderState.RECORDING);

    } catch (error) {
      console.error("Failed to start recording:", error);
      setRecorderState(RecorderState.ERROR);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // State change to PROCESSING happens in onstop handler
      setRecorderState(RecorderState.PROCESSING); 
    }
  }, []);

  const handleRecordingStop = async (mimeType: string) => {
    try {
      // Create Blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Convert to Base64
      const base64Audio = await blobToBase64(audioBlob);
      
      // Send to Gemini
      await translateAudio(base64Audio, mimeType);

    } catch (err) {
      console.error("Error processing audio:", err);
      setRecorderState(RecorderState.ERROR);
    } finally {
      cleanupAudio();
      // Only set to IDLE if not ERROR
      setRecorderState(prev => prev === RecorderState.ERROR ? prev : RecorderState.IDLE);
    }
  };

  const translateAudio = async (base64Audio: string, mimeType: string) => {
    if (!process.env.API_KEY) return;

    // Add placeholder
    const botMsgId = Date.now().toString();
    setTranscriptions(prev => [...prev, {
      id: botMsgId,
      text: "Translating...",
      isUser: false,
      timestamp: new Date()
    }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let response;
      let attempt = 0;
      const maxRetries = 3;
      let delayMs = 1000;

      while (attempt < maxRetries) {
        try {
          response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                  }
                },
                { text: "Translate this Bengali speech to English." }
              ]
            },
            config: {
              systemInstruction: SYSTEM_INSTRUCTION_TRANSLATE,
            }
          });
          break; // Success
        } catch (e: any) {
          // Check for 429 Quota Exceeded or other transient errors
          const isQuota = e.message?.includes('429') || e.status === 429 || e.toString().includes('RESOURCE_EXHAUSTED');
          if (isQuota && attempt < maxRetries - 1) {
            console.warn(`Attempt ${attempt + 1} failed (429). Retrying in ${delayMs}ms...`);
            attempt++;
            await wait(delayMs);
            delayMs *= 2; // Exponential backoff
            continue;
          }
          throw e;
        }
      }

      const translation = response?.text || "Could not translate audio.";

      setTranscriptions(prev => prev.map(item => 
        item.id === botMsgId ? { ...item, text: translation } : item
      ));

    } catch (error: any) {
      console.error("Translation error:", error);
      let errorMessage = "Error during translation.";
      
      if (error.message?.includes('429') || error.status === 429 || error.toString().includes('RESOURCE_EXHAUSTED')) {
        errorMessage = "Service busy (Quota Exceeded). Please try again in a moment.";
      }

      setTranscriptions(prev => prev.map(item => 
        item.id === botMsgId ? { ...item, text: errorMessage } : item
      ));
    }
  };

  // --- Text Translation Logic (Shared) ---
  const translateText = async (text: string) => {
    if (!process.env.API_KEY || !text.trim()) return;

    const userMsgId = Date.now().toString();
    setTranscriptions(prev => [...prev, {
      id: userMsgId,
      text: text,
      isUser: true,
      timestamp: new Date()
    }]);

    // Pre-create the bot message so we can update it or show error on it
    const botMsgId = (Date.now() + 1).toString();
    setTranscriptions(prev => [...prev, {
      id: botMsgId,
      text: "Translating...",
      isUser: false,
      timestamp: new Date()
    }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let response;
      let attempt = 0;
      const maxRetries = 3;
      let delayMs = 1000;

      while (attempt < maxRetries) {
        try {
          response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: text,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION_TRANSLATE,
            }
          });
          break; // Success
        } catch (e: any) {
           const isQuota = e.message?.includes('429') || e.status === 429 || e.toString().includes('RESOURCE_EXHAUSTED');
           if (isQuota && attempt < maxRetries - 1) {
             console.warn(`Attempt ${attempt + 1} failed (429). Retrying in ${delayMs}ms...`);
             attempt++;
             await wait(delayMs);
             delayMs *= 2;
             continue;
           }
           throw e;
        }
      }

      const translatedText = response?.text || "Could not translate.";

      setTranscriptions(prev => prev.map(item => 
        item.id === botMsgId ? { ...item, text: translatedText } : item
      ));

    } catch (error: any) {
      console.error("Text translation error:", error);
      let errorMessage = "Error during translation.";
      
      if (error.message?.includes('429') || error.status === 429 || error.toString().includes('RESOURCE_EXHAUSTED')) {
        errorMessage = "Service busy (Quota Exceeded). Please try again in a moment.";
      }

      setTranscriptions(prev => prev.map(item => 
        item.id === botMsgId ? { ...item, text: errorMessage } : item
      ));
    }
  };

  // --- Helpers ---

  const updateVolume = () => {
    if (!analyserRef.current || !streamRef.current?.active) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    setVolume(sum / dataArray.length);
    requestAnimationFrame(updateVolume);
  };

  const cleanupAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVolume(0);
  };

  const clearHistory = () => setTranscriptions([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  return {
    startRecording,
    stopRecording,
    translateText,
    clearHistory,
    recorderState,
    volume,
    transcriptions
  };
};
