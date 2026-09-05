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
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wantListeningRef = useRef(false);
  const onUtteranceRef = useRef(onUtterance);
  onUtteranceRef.current = onUtterance;

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const flush = useCallback(() => {
    const text = bufferRef.current.trim();
    bufferRef.current = "";
    setInterim("");
    if (text) onUtteranceRef.current(text);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    if (recognitionRef.current) return;

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
      setInterim(live);
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
      } else if (event.error === "audio-capture") {
        setError("No microphone found.");
        wantListeningRef.current = false;
        setListening(false);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (wantListeningRef.current) {
        try {
          start();
        } catch {
          /* browser is still winding down; the next tick retries */
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
    } catch {
      recognitionRef.current = null;
    }
  }, [flush, silenceMs]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    bufferRef.current = "";
    setInterim("");
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

  return { listening, interim, supported, error, start, stop };
}
