import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

type Rec = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: unknown) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): Rec | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

export function dictationAvailable() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

/**
 * Talking is an alternative, never a replacement — the text field stays
 * exactly where it is. If the device can't dictate, this button doesn't render.
 */
export default function VoiceNoteButton({
  onTranscript,
  label = "Say it instead",
  busy,
  className = "",
}: {
  onTranscript: (text: string) => void;
  label?: string;
  busy?: boolean;
  className?: string;
}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Rec | null>(null);
  const bufferRef = useRef("");

  useEffect(() => () => recRef.current?.abort(), []);

  if (!dictationAvailable()) return null;

  const start = () => {
    setError(null);
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    bufferRef.current = "";
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-GB";
    rec.onresult = (e: unknown) => {
      const ev = e as { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number };
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        bufferRef.current += `${ev.results[i][0].transcript} `;
      }
    };
    rec.onerror = () => {
      setError("Couldn't hear that — try again or just type it.");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      const text = bufferRef.current.trim();
      if (text) onTranscript(text);
    };
    rec.start();
    setListening(true);
  };

  const stop = () => recRef.current?.stop();

  return (
    <div className={className}>
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={busy}
        className={`h-9 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border-hairline disabled:opacity-40 ${
          listening ? "bg-destructive text-destructive-foreground" : "bg-surface hover:bg-surface-hover"
        }`}
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : listening ? (
          <Square className="w-3.5 h-3.5" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
        {busy ? "Sorting it out…" : listening ? "Stop and use it" : label}
      </button>
      {listening && <p className="text-[11px] text-muted-foreground mt-1">Listening — speak normally, then tap stop.</p>}
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}
