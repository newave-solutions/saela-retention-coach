import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, MicOff, PhoneOff } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCustomerVoice } from "@/hooks/useCustomerVoice";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { endCall, getCall, sendAgentTurn } from "@/lib/training.functions";
import type { PublicScenario } from "@/lib/scenarios";
import { CallTimer } from "@/components/CallTimer";
import { AccountWorkspace } from "@/components/AccountWorkspace";
import {
  instructionsFor,
  settingsFor,
  shapeLine,
  voiceForScenario,
  type Mood,
} from "@/lib/voice-direction";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        google: assigned.google,
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
    if (recognition.error) toast.error(recognition.error);
  }, [recognition.error]);

  useEffect(() => {
    if (micOn && (!recognition.supported || recognition.error)) setMicOn(false);
  }, [micOn, recognition.supported, recognition.error]);

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
    <main className="flex h-screen min-h-[620px] flex-col overflow-hidden bg-background">
      <header className="brand-surface shrink-0 border-b border-sidebar-border">
        <div className="mx-auto flex min-h-12 max-w-[1800px] flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-sm font-semibold">Saela Customer Account</span>
            <span className="hidden h-5 w-px bg-sidebar-border sm:block" />
            <span className="truncate text-xs opacity-80">{scenario?.accountSummary ?? "Opening customer record…"}</span>
            <Badge variant="outline" className="hidden border-sidebar-border text-[10px] text-inherit sm:inline-flex">Training</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs opacity-80 sm:inline" aria-live="polite">{state}</span>
            <CallTimer />
            <Button variant={micOn ? "secondary" : "default"} size="sm" onClick={toggleMic} disabled={ending || !recognition.supported}>
              {micOn ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{micOn ? "Mute" : "Talk"}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => finish(null)} disabled={ending}>
              <PhoneOff className="h-4 w-4" />{ending ? "Ending…" : "End call"}
            </Button>
          </div>
        </div>
      </header>
      {!recognition.supported ? <p className="shrink-0 border-b border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">Voice input is unavailable in this browser.</p> : null}
      <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 border-x border-border">
        {scenario?.simulatedAccount ? <AccountWorkspace sessionId={sessionId} initialAccount={scenario.simulatedAccount} /> : <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Opening customer account…</div>}
      </div>
    </main>
  );
}
