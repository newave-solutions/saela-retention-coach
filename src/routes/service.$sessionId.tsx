import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, MicOff, PhoneOff } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCustomerVoice } from "@/hooks/useCustomerVoice";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { endServiceCall, getServiceCall, sendServiceTurn } from "@/lib/service-training.functions";
import type { PublicServiceScenario } from "@/lib/service-scenarios";
import {
  instructionsFor,
  settingsFor,
  shapeLine,
  voiceForScenario,
  type Mood,
} from "@/lib/voice-direction";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CallTimer } from "@/components/CallTimer";
import { CallInput } from "@/components/CallInput";
import { CallAudioStage } from "@/components/CallAudioStage";

export const Route = createFileRoute("/service/$sessionId")({
  head: () => ({
    meta: [
      { title: "Live service call — Saela Way CES" },
      {
        name: "description",
        content:
          "You're on a live CES service call. Catch every detail the customer gives you and confirm it back.",
      },
      { property: "og:title", content: "Live service call — Saela Way CES" },
      {
        property: "og:description",
        content: "A live CES service roleplay call graded on listening comprehension.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LiveServiceCall,
});

function LiveServiceCall() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const load = useServerFn(getServiceCall);
  const send = useServerFn(sendServiceTurn);
  const hangUp = useServerFn(endServiceCall);
  const voice = useCustomerVoice();

  const [scenario, setScenario] = useState<PublicServiceScenario | null>(null);
  const [thinking, setThinking] = useState(false);
  const [ending, setEnding] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const busyRef = useRef(false);
  const scenarioRef = useRef<PublicServiceScenario | null>(null);
  scenarioRef.current = scenario;
  const micOnRef = useRef(false);
  micOnRef.current = micOn;
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const finish = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnding(true);
    voice.stop();
    try {
      await hangUp({ data: { sessionId } });
      void navigate({ to: "/service-session/$sessionId", params: { sessionId } });
    } catch (error) {
      endedRef.current = false;
      setEnding(false);
      toast.error(error instanceof Error ? error.message : "Couldn't wrap up the call.");
    }
  }, [hangUp, navigate, sessionId, voice]);

  const speakAs = useCallback(
    async (text: string, mood: Mood) => {
      const current = scenarioRef.current;
      if (!current) {
        await voice.say(text);
        return;
      }
      const assigned = current.voice ?? voiceForScenario({ customerName: current.customerName });
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
        if (result.callShouldEnd) await finish();
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
          void navigate({ to: "/service-session/$sessionId", params: { sessionId } });
          return;
        }
        setScenario(data.scenario);
        scenarioRef.current = data.scenario;
        const opening = data.transcript[0];
        if (opening) void speakAs(opening.text, "neutral");
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
            {voice.degraded ? (
              <p className="text-xs opacity-80">
                Backup voice in use — realistic voice unavailable.
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <CallTimer />
            <Button variant="destructive" size="sm" onClick={() => finish()} disabled={ending}>
              <PhoneOff className="mr-2 h-4 w-4" />
              {ending ? "Wrapping up..." : "End call"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-5">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-4">
          <p className="text-sm font-medium" aria-live="polite">{state}</p>
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

        <CallAudioStage customerName={scenario?.customerName ?? "Customer"} speaking={voice.speaking} listening={recognition.listening} thinking={thinking} getAudioElement={voice.getAudioElement} />

        <CallInput
          onSend={(text) => {
            if (busyRef.current) return;
            void speak(text);
          }}
          disabled={ending}
          busy={thinking}
        />
      </div>
    </main>
  );
}
