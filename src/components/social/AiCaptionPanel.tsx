import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Hash, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  resizeCaption,
  suggestCaptions,
  suggestHashtags,
  toneOptions,
  topicOptions,
  type SuggestInput,
} from "@/lib/socialAiSuggest";

export function AiCaptionPanel({
  input,
  onInputChange,
  tightestLimit,
  onUseCaption,
  onUseHashtags,
}: {
  input: SuggestInput;
  onInputChange: (patch: Partial<SuggestInput>) => void;
  tightestLimit: number;
  onUseCaption: (text: string) => void;
  onUseHashtags: (tags: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [shuffle, setShuffle] = useState(0);
  const [captions, setCaptions] = useState<string[] | null>(null);

  const generate = (nextShuffle = shuffle) => {
    setShuffle(nextShuffle);
    setCaptions(suggestCaptions(input, nextShuffle));
  };

  return (
    <div className="border-hairline rounded-lg bg-surface/40 mb-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-9 px-3 flex items-center justify-between text-left"
      >
        <span className="text-xs font-medium inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Write it for me
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">What is the post about?</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {topicOptions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onInputChange({ topic: t.id })}
                  className={cn(
                    "h-7 px-2.5 rounded-md border-hairline text-[11px] transition-colors",
                    input.topic === t.id ? "bg-primary text-primary-foreground" : "bg-background hover:bg-surface-hover",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">How should it sound?</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {toneOptions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onInputChange({ tone: t.id })}
                  className={cn(
                    "h-7 px-2.5 rounded-md border-hairline text-[11px] transition-colors",
                    input.tone === t.id ? "bg-primary text-primary-foreground" : "bg-background hover:bg-surface-hover",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Anything to mention? (optional)</Label>
            <Input
              className="mt-1.5"
              placeholder="New bathroom in Headingley, oak worktops"
              value={input.note ?? ""}
              onChange={(e) => onInputChange({ note: e.target.value || undefined })}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => generate(shuffle)}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs inline-flex items-center gap-1.5 hover:opacity-90"
            >
              <Wand2 className="w-3.5 h-3.5" /> Suggest captions
            </button>
            {captions && (
              <button
                type="button"
                onClick={() => generate(shuffle + 1)}
                className="h-8 px-3 rounded-md border-hairline text-xs inline-flex items-center gap-1.5 hover:bg-surface-hover"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Shuffle
              </button>
            )}
          </div>

          {captions && (
            <div className="space-y-2">
              {captions.map((c, i) => (
                <CaptionCard
                  key={`${shuffle}-${i}`}
                  caption={c}
                  input={input}
                  tightestLimit={tightestLimit}
                  onUse={onUseCaption}
                />
              ))}
              <button
                type="button"
                onClick={() => onUseHashtags(suggestHashtags(input.topic, input.location))}
                className="h-7 px-2 rounded border-hairline text-[11px] text-muted-foreground hover:bg-surface-hover inline-flex items-center gap-1"
              >
                <Hash className="w-3 h-3" /> Add suggested hashtags as first comment
              </button>
              <p className="text-[11px] text-muted-foreground">
                Suggestions only — edit anything before it goes out.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CaptionCard({
  caption,
  input,
  tightestLimit,
  onUse,
}: {
  caption: string;
  input: SuggestInput;
  tightestLimit: number;
  onUse: (text: string) => void;
}) {
  const [text, setText] = useState(caption);
  const over = text.length > tightestLimit;

  return (
    <div className="border-hairline rounded-md bg-background p-2.5">
      <div className="text-xs whitespace-pre-wrap leading-relaxed">{text}</div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUse(text)}
            className="h-7 px-2.5 rounded border-hairline text-[11px] hover:bg-surface-hover"
          >
            Use this
          </button>
          <button
            type="button"
            onClick={() => setText(resizeCaption(text, "shorter", input))}
            className="h-7 px-2 rounded border-hairline text-[11px] text-muted-foreground hover:bg-surface-hover"
          >
            Shorter
          </button>
          <button
            type="button"
            onClick={() => setText(resizeCaption(text, "longer", input))}
            className="h-7 px-2 rounded border-hairline text-[11px] text-muted-foreground hover:bg-surface-hover"
          >
            Longer
          </button>
        </div>
        <span
          className={cn(
            "text-[11px] tabular-nums",
            over ? "text-[hsl(var(--destructive))]" : "text-muted-foreground",
          )}
        >
          {text.length}/{tightestLimit.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
