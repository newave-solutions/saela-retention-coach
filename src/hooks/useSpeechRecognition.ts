import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionResult = { transcript: string };
type RecognitionAlternative = { 0: RecognitionResult; isFinal: boolean; length: number };
type RecognitionEvent = {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionAlternative };
};
type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Continuous dictation that flushes a finished utterance after a short pause,
 * so the customer answers when the agent stops talking.
 */
export function useSpeechRecognition(options: {
  onUtterance: (text: string) => void;
  silenceMs?: number;
}) {
  const { onUtterance, silenceMs = 1200 } = options;
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ⚡ Bolt Optimization: Replace useState with a mutable ref and subscription model
  // to prevent the hook's consumer (often large route components) from re-rendering
  // on every requestAnimationFrame tick during live dictation.
  const interimRef = useRef("");
  const listenersRef = useRef(new Set<() => void>());

  const subscribeInterim = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getInterim = useCallback(() => interimRef.current, []);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInterimRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const wantListeningRef = useRef(false);
  const onUtteranceRef = useRef(onUtterance);
  onUtteranceRef.current = onUtterance;

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const flush = useCallback(() => {
    const text = bufferRef.current.trim();
    bufferRef.current = "";
    interimRef.current = "";
    listenersRef.current.forEach((listener) => listener());
    if (text) onUtteranceRef.current(text);
  }, []);

  const start = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return false;
    }
    if (recognitionRef.current) return true;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let live = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const text = result[0].transcript;
        if (result.isFinal) bufferRef.current += ` ${text}`;
        else live += text;
      }
      pendingInterimRef.current = live;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          interimRef.current = pendingInterimRef.current;
          listenersRef.current.forEach((listener) => listener());
          rafRef.current = null;
        });
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      if (bufferRef.current.trim()) {
        timerRef.current = setTimeout(flush, silenceMs);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access is blocked. Allow the mic and start the call again.");
        wantListeningRef.current = false;
        setListening(false);
        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = null;
        }
      } else if (event.error === "audio-capture") {
        setError("No microphone found.");
        wantListeningRef.current = false;
        setListening(false);
        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = null;
        }
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (wantListeningRef.current) {
        if (!restartTimerRef.current) {
          restartTimerRef.current = setTimeout(() => {
            restartTimerRef.current = null;
            if (!wantListeningRef.current || recognitionRef.current) return;
            if (!start() && wantListeningRef.current && !restartTimerRef.current) {
              restartTimerRef.current = setTimeout(() => {
                restartTimerRef.current = null;
                if (wantListeningRef.current && !recognitionRef.current) start();
              }, 250);
            }
          }, 150);
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    wantListeningRef.current = true;
    setError(null);
    try {
      recognition.start();
      setListening(true);
      return true;
    } catch {
      recognitionRef.current = null;
      setListening(false);
      return false;
    }
  }, [flush, silenceMs]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    pendingInterimRef.current = "";
    bufferRef.current = "";
    interimRef.current = "";
    listenersRef.current.forEach((listener) => listener());
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    setListening(false);
    try {
      recognition?.abort();
    } catch {
      /* already stopped */
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { listening, subscribeInterim, getInterim, supported, error, start, stop };
}
