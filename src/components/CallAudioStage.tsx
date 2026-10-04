import { useEffect, useRef } from "react";
import { Headphones, Mic, Volume2 } from "lucide-react";

type Props = {
  customerName: string;
  speaking: boolean;
  listening: boolean;
  thinking: boolean;
  getAudioElement: () => HTMLAudioElement | null;
};

const BAR_COUNT = 31;

export function CallAudioStage({ customerName, speaking, listening, thinking, getAudioElement }: Props) {
  const bars = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!listening && !speaking && !thinking) return;
    let disposed = false;
    let frame = 0;
    let micStream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let sourceElement: HTMLAudioElement | null = null;
    const heights = new Uint8Array(128);

    if (listening && navigator.mediaDevices?.getUserMedia) {
      void navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        if (disposed) { stream.getTracks().forEach((track) => track.stop()); return; }
        micStream = stream;
        context = new AudioContext();
        analyser = context.createAnalyser();
        analyser.fftSize = 256;
        context.createMediaStreamSource(stream).connect(analyser);
      }).catch(() => { /* recognition reports microphone errors separately */ });
    }

    const draw = (time: number) => {
      if (speaking && !sourceElement) {
        const element = getAudioElement();
        if (element) {
          try {
            context = new AudioContext();
            analyser = context.createAnalyser();
            analyser.fftSize = 256;
            context.createMediaElementSource(element).connect(analyser);
            analyser.connect(context.destination);
            sourceElement = element;
          } catch { /* browser speech remains a state animation */ }
        }
      }
      if (analyser) analyser.getByteFrequencyData(heights);
      bars.current.forEach((bar, index) => {
        if (!bar) return;
        const sample = analyser ? heights[Math.min(heights.length - 1, index * 3)] / 255 : 0;
        const fallback = speaking || thinking ? (Math.sin(time / 190 + index * 1.1) + 1) * 0.17 : 0;
        const center = 1 - Math.abs(index - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
        bar.style.height = `${Math.round(10 + Math.min(1, sample * 2.4 + fallback) * (65 + 36 * center))}px`;
      });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      micStream?.getTracks().forEach((track) => track.stop());
      if (context) void context.close();
      bars.current.forEach((bar) => { if (bar) bar.style.height = "10px"; });
    };
  }, [listening, speaking, thinking, getAudioElement]);

  const label = speaking ? `${customerName} is speaking` : thinking ? `${customerName} is thinking` : listening ? "Listening to you" : "The line is quiet";
  return (
    <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center gap-6 border-y border-border bg-card px-4 py-10 text-center sm:min-h-[380px]" aria-label={label}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary text-primary">
        {speaking ? <Volume2 className="h-6 w-6" /> : listening ? <Mic className="h-6 w-6" /> : <Headphones className="h-6 w-6" />}
      </div>
      <div className="flex h-32 w-full max-w-md items-center justify-center gap-1.5 overflow-hidden" aria-hidden="true">
        {Array.from({ length: BAR_COUNT }, (_, index) => (
          <span key={index} ref={(node) => { bars.current[index] = node; }} className="w-1.5 shrink-0 rounded-full bg-primary/75 transition-[background-color] duration-300" style={{ height: 10 }} />
        ))}
      </div>
      <div>
        <p className="font-display text-lg font-semibold">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{speaking ? "Listen closely" : listening ? "Your microphone is active" : thinking ? "Waiting for a response" : "Use Talk when you’re ready"}</p>
      </div>
    </div>
  );
}