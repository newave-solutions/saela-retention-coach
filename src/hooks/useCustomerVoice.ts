import { useCallback, useEffect, useRef, useState } from "react";

import type { VoiceSettings } from "@/lib/voice-direction";

/**
 * Speaks the customer's lines with an expressive ElevenLabs voice, streamed as
 * MP3 so playback starts quickly. Falls back to the browser's built-in voice if
 * the stream fails.
 */
export function useCustomerVoice() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    cleanup();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, [cleanup]);

  const fallbackSay = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.03;
        utterance.onend = () => {
          setSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          setSpeaking(false);
          resolve();
        };
        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }),
    [],
  );

  const say = useCallback(
    async (
      text: string,
      options?: {
        voice?: string | undefined;
        provider?: "elevenlabs" | "gateway" | undefined;
        instructions?: string | undefined;
        settings?: VoiceSettings | undefined;
      },
    ) => {
      if (!text.trim()) return;
      stop();

      const controller = new AbortController();
      abortRef.current = controller;
      setSpeaking(true);

      try {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice: options?.voice,
            provider: options?.provider,
            instructions: options?.instructions,
            settings: options?.settings,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(String(response.status));

        const blob = await response.blob();
        if (controller.signal.aborted) return;
        if (blob.size === 0) throw new Error("no-audio");

        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          controller.signal.addEventListener("abort", () => resolve(), { once: true });
          void audio.play().catch(() => resolve());
        });

        if (!controller.signal.aborted) {
          cleanup();
          setSpeaking(false);
        }
      } catch (error) {
        if (controller.signal.aborted || (error as Error)?.name === "AbortError") return;
        await fallbackSay(text);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [cleanup, fallbackSay, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { say, stop, speaking };
}
