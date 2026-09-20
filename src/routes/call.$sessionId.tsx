import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, MicOff, PhoneOff, Send, Volume2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCustomerVoice } from "@/hooks/useCustomerVoice";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { endCall, getCall, sendAgentTurn } from "@/lib/training.functions";
import type { PublicScenario, TranscriptTurn } from "@/lib/scenarios";
import { CallTimer } from "@/components/CallTimer";
import {
  instructionsFor,
  settingsFor,
  shapeLine,
  voiceForScenario,
  type Mood,
} from "@/lib/voice-direction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CallInput } from "@/components/CallInput";

export const Route = createFileRoute("/call/$sessionId")({
  head: () => ({
    meta: [
      { title: "Live call — Saela Way" },
      {
        name: "description",
        content:
          "You're on a live retention call. Uncover why the customer really wants to cancel before they hang up.",
      },
      { property: "og:title", content: "Live call — Saela Way" },
      {
        property: "og:description",
        content: "A live retention roleplay call with an adaptive customer.",
      },
    ],
  }),
  component: LiveCall,
});

function LiveCall() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const load = useServerFn(getCall);
  const send = useServerFn(sendAgentTurn);
  const hangUp = useServerFn(endCall);
  const voice = useCustomerVoice();

  const [scenario, setScenario] = useState<PublicScenario | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [ending, setEnding] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const busyRef = useRef(false);
  const scenarioRef = useRef<PublicScenario | null>(null);
  scenarioRef.current = scenario;
  const micOnRef = useRef(false);
  micOnRef.current = micOn;
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const endedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const finish = useCallback(
    async (endReason: string | null) => {
      if (endedRef.current) return;
      endedRef.current = true;
      setEnding(true);
      voice.stop();
      try {
        await hangUp({ data: { sessionId, endReason } });
        void navigate({ to: "/session/$sessionId", params: { sessionId } });
      } catch (error) {
        endedRef.current = false;
        setEnding(false);
        toast.error(error instanceof Error ? error.message : "Couldn't wrap up the call.");
      }
    },
    [hangUp, navigate, sessionId, voice],
  );

  const speakAs = useCallback(
    async (text: string, mood: Mood) => {
      const current = scenarioRef.current;
      if (!current) {
        await voice.say(text);
        return;
      }
      const assigned = current.voice ?? voiceForScenario(current);
      await voice.say(shapeLine(text, current, mood), {
        voice: assigned.id,
        provider: assigned.provider,
        instructions: instructionsFor(assigned, current, mood),
        settings: settingsFor(current, mood),
      });
    },
    [voice],
  );

  const speak = useCallback(
    async (text: string) => {
      if (!busyRef.current && !endedRef.current) {
        busyRef.current = true;
        setThinking(true);
      }
      try {
        const result = await send({ data: { sessionId, text } });
        setTurns(result.transcript);
        setThinking(false);
        if (micOnRef.current) recognitionRef.current?.stop();
        await speakAs(result.reply, result.mood as Mood);
        if (micOnRef.current && !endedRef.current) recognitionRef.current?.start();
        if (result.callShouldEnd) await finish(result.endReason);
      } catch (error) {
        setThinking(false);
        toast.error(error instanceof Error ? error.message : "The line dropped. Try again.");
      } finally {
        busyRef.current = false;
      }
    },
    [finish, send, sessionId, speakAs],
  );

  const onUtterance = useCallback(
    (text: string) => {
      if (busyRef.current || endedRef.current || voice.speaking) return;
      void speak(text);
    },
    [speak, voice.speaking],
  );

  const recognition = useSpeechRecognition({ onUtterance });
  recognitionRef.current = recognition;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await load({ data: { sessionId } });
        if (cancelled) return;
        if (data.status !== "active") {
          void navigate({ to: "/session/$sessionId", params: { sessionId } });
          return;
        }
        setScenario(data.scenario);
        scenarioRef.current = data.scenario;
        setTurns(data.transcript);
        const opening = data.transcript[0];
        if (opening) void speakAs(opening.text, "cold");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't load this call.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  useEffect(() => {
    if (recognition.error) toast.error(recognition.error);
  }, [recognition.error]);

  function toggleMic() {
    if (micOn) {
      recognition.stop();
      setMicOn(false);
      return;
    }
    recognition.start();
    setMicOn(true);
  }

  const state = voice.speaking
    ? "Customer speaking"
    : thinking
      ? "Customer thinking"
      : recognition.listening
        ? "Listening to you"
        : "Mic off";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="brand-surface">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="flex items-center gap-2 text-base font-semibold leading-tight">
              {scenario?.customerName ?? "Connecting..."}
              {scenario?.voice ? (
                <Badge
                  variant="outline"
                  className="border-white/30 bg-white/10 text-[10px] font-normal text-inherit"
                >
                  {scenario.voice.accentLabel}
                </Badge>
              ) : null}
            </h1>
            <p className="text-xs opacity-80">
              {scenario?.accountSummary ?? "Pulling up the account"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CallTimer />
            <Button variant="destructive" size="sm" onClick={() => finish(null)} disabled={ending}>
              <PhoneOff className="mr-2 h-4 w-4" />
              {ending ? "Wrapping up..." : "End call"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-5">
        <div className="card-soft mb-4 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span
              className={`absolute inset-0 rounded-full bg-accent/50 ${voice.speaking || recognition.listening ? "call-pulse" : "opacity-20"}`}
            />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 text-accent ring-1 ring-accent/40">
              {voice.speaking ? <Volume2 className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{state}</p>
            <p className="truncate text-xs text-muted-foreground">
              {recognition.interim || "The customer is on the line. Talk to them."}
            </p>
          </div>
          <Button variant={micOn ? "secondary" : "default"} size="sm" onClick={toggleMic}>
            {micOn ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
            {micOn ? "Mute" : "Talk"}
          </Button>
        </div>

        {!recognition.supported && (
          <p className="mb-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            This browser can't hear you. Type your side of the call below instead.
          </p>
        )}

        <div
          ref={scrollRef}
          className="card-soft flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-4"
          style={{ maxHeight: "52vh" }}
        >
          {turns.map((turn, index) => (
            <div
              key={`${turn.at}-${index}`}
              className={turn.speaker === "agent" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  turn.speaker === "agent"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                <p className="mb-0.5 text-[10px] uppercase tracking-widest opacity-70">
                  {turn.speaker === "agent" ? "You" : (scenario?.customerName ?? "Customer")}
                </p>
                {turn.text}
              </div>
            </div>
          ))}
          {thinking && <p className="text-xs text-muted-foreground">Customer is responding...</p>}
        </div>

        <CallInput
          onSend={(text) => void speak(text)}
          disabled={ending}
          thinking={thinking}
          busyRef={busyRef}
        />
      </div>
    </main>
  );
}
