import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Speaks the customer's lines with an expressive AI voice, streamed as raw PCM
 * so playback starts while the line is still being generated. Falls back to the
 * browser's built-in voice if the stream fails.
 */
export function useCustomerVoice() {
  const [speaking, setSpeaking] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const getContext = useCallback(async () => {
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new Ctor({ sampleRate: 24000 });
    }
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    for (const source of sourcesRef.current) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    sourcesRef.current = [];
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

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
    async (text: string, options?: { voice?: string | undefined; instructions?: string | undefined }) => {
      if (!text.trim()) return;
      stop();

      const ctx = await getContext();
      if (!ctx) {
        await fallbackSay(text);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setSpeaking(true);

      let playhead = 0;
      let leftover = new Uint8Array(0);
      let lastEnd = 0;

      const schedule = (incoming: Uint8Array) => {
        const bytes = new Uint8Array(leftover.length + incoming.length);
        bytes.set(leftover);
        bytes.set(incoming, leftover.length);
        const usable = bytes.length - (bytes.length % 2);
        leftover = bytes.slice(usable);
        if (usable === 0) return;

        const samples = new Int16Array(bytes.buffer, 0, usable / 2);
        const floats = Float32Array.from(samples, (s) => s / 32768);
        const buffer = ctx.createBuffer(1, floats.length, 24000);
        buffer.copyToChannel(floats, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        playhead = playhead === 0 ? ctx.currentTime + 0.08 : Math.max(playhead, ctx.currentTime);
        source.start(playhead);
        playhead += buffer.duration;
        lastEnd = playhead;
        sourcesRef.current.push(source);
      };

      try {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice: options?.voice,
            instructions: options?.instructions,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) throw new Error(String(response.status));

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let carry = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          carry += value;
          const lines = carry.split("\n");
          carry = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payloadText = line.slice(5).trim();
            if (!payloadText || payloadText === "[DONE]") continue;
            let payload: { type?: string; audio?: string };
            try {
              payload = JSON.parse(payloadText) as { type?: string; audio?: string };
            } catch {
              continue;
            }
            if (payload.type === "speech.audio.delta" && payload.audio) {
              const binary = atob(payload.audio);
              const chunk = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) chunk[i] = binary.charCodeAt(i);
              schedule(chunk);
            }
          }
        }

        if (controller.signal.aborted) return;
        if (lastEnd === 0) throw new Error("no-audio");

        const waitMs = Math.max(0, (lastEnd - ctx.currentTime) * 1000);
        await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
        if (!controller.signal.aborted) setSpeaking(false);
      } catch (error) {
        if (controller.signal.aborted || (error as Error)?.name === "AbortError") return;
        await fallbackSay(text);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        sourcesRef.current = [];
      }
    },
    [fallbackSay, getContext, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { say, stop, speaking };
}
