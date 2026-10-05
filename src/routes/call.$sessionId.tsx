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
import { CallInput } from "@/components/CallInput";
import { CallAudioStage } from "@/components/CallAudioStage";
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
    <main className="flex min-h-screen flex-col bg-background">
      <header className="brand-surface">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
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
            {voice.degraded ? (
              <p className="text-xs opacity-80">
                Backup voice in use — realistic voice unavailable.
              </p>
            ) : null}
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

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[360px_minmax(0,1fr)] lg:border-x lg:border-border">
        <aside className="flex flex-col border-b border-border p-4 lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-sm font-medium" aria-live="polite">{state}</p>
            <Button variant={micOn ? "secondary" : "default"} size="sm" onClick={toggleMic}>
              {micOn ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}{micOn ? "Mute" : "Talk"}
            </Button>
          </div>
          {!recognition.supported ? <p className="mb-3 border border-warning/40 bg-warning/10 p-3 text-xs text-warning">This browser can't hear you. Type your side of the call below instead.</p> : null}
          <CallAudioStage customerName={scenario?.customerName ?? "Customer"} speaking={voice.speaking} listening={recognition.listening} thinking={thinking} />
          <CallInput onSend={(text) => { if (!busyRef.current) void speak(text); }} disabled={ending} busy={thinking} />
        </aside>
        {scenario?.simulatedAccount ? <AccountWorkspace sessionId={sessionId} initialAccount={scenario.simulatedAccount} /> : <div className="flex min-h-[520px] items-center justify-center text-sm text-muted-foreground">Opening customer account…</div>}
      </div>
    </main>
  );
}
