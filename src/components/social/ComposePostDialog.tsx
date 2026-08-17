import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Btn, Pill } from "@/components/layout/PageShell";
import {
  AlertTriangle,
  Clock,
  Facebook,
  Hash,
  ImagePlus,
  Instagram,
  Linkedin,
  Link2,
  MapPin,
  MessageSquare,
  Music2,
  Sparkles,
  Twitter,
  Wand2,
  X,
} from "lucide-react";
import {
  channelBestTimes,
  channelLimits,
  channelRequiresMedia,
  type SocialChannel,
  type SocialPost,
} from "@/lib/socialPostsStore";
import { OrganicPostPreview } from "./OrganicPostPreview";
import { AiCaptionPanel } from "./AiCaptionPanel";
import { bestTimeReasons, describePhoto, type SuggestInput } from "@/lib/socialAiSuggest";
import { cn } from "@/lib/utils";

const channelDefs: { id: SocialChannel; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "facebook", label: "Facebook", Icon: Facebook },
  { id: "instagram", label: "Instagram", Icon: Instagram },
  { id: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { id: "tiktok", label: "TikTok", Icon: Music2 },
  { id: "x", label: "X", Icon: Twitter },
];

const hashtagSets: { label: string; tags: string }[] = [
  { label: "Local trade", tags: "#localbuilder #tradesman #homeimprovement" },
  { label: "Before & after", tags: "#beforeandafter #renovation #transformation" },
  { label: "Hiring", tags: "#hiring #jobsnearme #construction" },
];

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nextDateAt(base: Date | undefined, hour: number, minute: number) {
  const now = new Date();
  const d = base ? new Date(base) : new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

export function ComposePostDialog({
  open,
  post,
  onClose,
  onSave,
  onSubmitForApproval,
  onSchedule,
}: {
  open: boolean;
  post: SocialPost | null;
  onClose: () => void;
  onSave: (p: SocialPost) => void;
  onSubmitForApproval: (p: SocialPost) => void;
  onSchedule: (p: SocialPost) => void;
}) {
  const [draft, setDraft] = useState<SocialPost | null>(post);
  const [previewChannel, setPreviewChannel] = useState<SocialChannel | null>(null);
  const [ai, setAi] = useState<SuggestInput>({ topic: "finished-job", tone: "friendly" });

  useEffect(() => {
    setDraft(post);
    setPreviewChannel(post?.channels[0] ?? null);
  }, [post]);

  const active = draft?.channels ?? [];
  const shown = previewChannel && active.includes(previewChannel) ? previewChannel : active[0];

  const issues = useMemo(() => {
    if (!draft) return [] as string[];
    const list: string[] = [];
    if (!draft.channels.length) list.push("Pick at least one channel.");
    if (!draft.content.trim()) list.push("Write a caption.");
    draft.channels.forEach((c) => {
      const def = channelDefs.find((d) => d.id === c)!;
      if (draft.content.length > channelLimits[c])
        list.push(`${def.label} allows ${channelLimits[c].toLocaleString()} characters — you are ${(
          draft.content.length - channelLimits[c]
        ).toLocaleString()} over.`);
      if (channelRequiresMedia[c] && !draft.mediaUrl) list.push(`${def.label} needs a photo or video.`);
    });
    if (draft.mediaUrl && !draft.altText) list.push("Add alt text so the photo is accessible.");
    if (draft.scheduledAt && new Date(draft.scheduledAt).getTime() < Date.now())
      list.push("The scheduled time is in the past.");
    return list;
  }, [draft]);

  if (!draft) return null;

  const set = (patch: Partial<SocialPost>) => setDraft({ ...draft, ...patch });

  const toggleChannel = (c: SocialChannel) => {
    const channels = draft.channels.includes(c)
      ? draft.channels.filter((x) => x !== c)
      : [...draft.channels, c];
    set({ channels });
    if (!channels.includes(previewChannel as SocialChannel)) setPreviewChannel(channels[0] ?? null);
  };

  const blocking = issues.filter((i) => !i.startsWith("Add alt text"));
  const canSchedule = blocking.length === 0 && !!draft.scheduledAt;
  const tightestLimit = draft.channels.length
    ? Math.min(...draft.channels.map((c) => channelLimits[c]))
    : 2200;
  const remaining = tightestLimit - draft.content.length;

  const bestTimes = shown ? channelBestTimes[shown] : channelBestTimes.instagram;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {post?.status === "draft" ? "Create post" : "Edit post"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_300px] gap-5 overflow-y-auto pr-1">
          {/* -------- Editor -------- */}
          <div className="space-y-5">
            <Step n={1} title="Where should it go?">
              <div className="flex flex-wrap gap-2">
                {channelDefs.map(({ id, label, Icon }) => {
                  const on = draft.channels.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleChannel(id)}
                      className={cn(
                        "h-8 px-3 rounded-md border-hairline text-sm inline-flex items-center gap-1.5 transition-colors",
                        on ? "bg-primary text-primary-foreground" : "bg-background hover:bg-surface-hover",
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </Step>

            <Step n={2} title="What are you posting?">
              <AiCaptionPanel
                input={{ ...ai, location: draft.locationTag }}
                onInputChange={(patch) => setAi((a) => ({ ...a, ...patch }))}
                tightestLimit={tightestLimit}
                onUseCaption={(text) => set({ content: text })}
                onUseHashtags={(tags) => set({ firstComment: tags })}
              />
              <Textarea
                className="min-h-[130px]"
                placeholder="Share the job you just finished, a happy customer, or an offer…"
                value={draft.content}
                onChange={(e) => set({ content: e.target.value })}
              />
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1.5">
                  {hashtagSets.map((h) => (
                    <button
                      key={h.label}
                      type="button"
                      onClick={() =>
                        set({ content: `${draft.content.trimEnd()}\n\n${h.tags}`.trim() })
                      }
                      className="h-6 px-2 rounded border-hairline text-[11px] text-muted-foreground hover:bg-surface-hover inline-flex items-center gap-1"
                    >
                      <Hash className="w-3 h-3" /> {h.label}
                    </button>
                  ))}
                </div>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    remaining < 0 ? "text-[hsl(var(--destructive))]" : "text-muted-foreground",
                  )}
                >
                  {remaining.toLocaleString()} left
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <ImagePlus className="w-3 h-3" /> Photo or video link
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="https://…"
                    value={draft.mediaUrl ?? ""}
                    onChange={(e) => set({ mediaUrl: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Alt text (describes the photo)</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const { altText, opener } = describePhoto({ ...ai, location: draft.locationTag });
                        set({
                          altText,
                          content: draft.content.trim()
                            ? draft.content
                            : `${opener} `,
                        });
                      }}
                      className="h-6 px-2 rounded border-hairline text-[11px] text-muted-foreground hover:bg-surface-hover inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-primary" /> Describe this photo
                    </button>
                  </div>
                  <Input
                    className="mt-1.5"
                    placeholder="New kitchen with oak worktops"
                    value={draft.altText ?? ""}
                    onChange={(e) => set({ altText: e.target.value || undefined })}
                  />
                  {!ai.note?.trim() && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Tip: add a line under “Write it for me” about what is in the photo for a better description.
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> Link to your site
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="yoursite.com/kitchens"
                    value={draft.link ?? ""}
                    onChange={(e) => set({ link: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location tag
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="Willow Ave, Leeds"
                    value={draft.locationTag ?? ""}
                    onChange={(e) => set({ locationTag: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> First comment (good place for hashtags)
                </Label>
                <Input
                  className="mt-1.5"
                  placeholder="#kitchenrenovation #leedsbuilder"
                  value={draft.firstComment ?? ""}
                  onChange={(e) => set({ firstComment: e.target.value || undefined })}
                />
              </div>
            </Step>

            <Step n={3} title="When should it go out?">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Date and time</Label>
                  <Input
                    type="datetime-local"
                    className="mt-1.5"
                    value={toLocalInput(draft.scheduledAt)}
                    onChange={(e) =>
                      set({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Posting as</Label>
                  <Input className="mt-1.5" value={draft.author} onChange={(e) => set({ author: e.target.value })} />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-1">
                  <Wand2 className="w-3 h-3" /> Best times {shown ? `for ${shown}` : ""}
                </div>
                {shown && (
                  <p className="text-[11px] text-muted-foreground mb-1.5">{bestTimeReasons[shown]}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {bestTimes.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() =>
                        set({
                          scheduledAt: nextDateAt(
                            draft.scheduledAt ? new Date(draft.scheduledAt) : undefined,
                            t.hour,
                            t.minute,
                          ).toISOString(),
                        })
                      }
                      className="h-7 px-2 rounded border-hairline text-[11px] hover:bg-surface-hover inline-flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3 text-muted-foreground" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {draft.kind === "paid" && (
              <Step n={4} title="Budget and audience">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Budget ($)</Label>
                    <Input
                      type="number"
                      className="mt-1.5"
                      value={draft.budget ?? 0}
                      onChange={(e) => set({ budget: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Goal</Label>
                    <Input
                      className="mt-1.5"
                      value={draft.objective ?? ""}
                      onChange={(e) => set({ objective: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Audience</Label>
                    <Input
                      className="mt-1.5"
                      value={draft.audience ?? ""}
                      onChange={(e) => set({ audience: e.target.value })}
                    />
                  </div>
                </div>
              </Step>
            )}

            {issues.length > 0 && (
              <div className="border-hairline rounded-lg bg-surface p-3">
                <div className="text-xs font-medium inline-flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--warning))]" /> Before this can go out
                </div>
                <ul className="space-y-1">
                  {issues.map((i) => (
                    <li key={i} className="text-xs text-muted-foreground">· {i}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* -------- Preview -------- */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium">Preview</div>
              {draft.locationTag && <Pill tone="neutral">{draft.locationTag}</Pill>}
            </div>
            {active.length === 0 ? (
              <div className="border-hairline rounded-lg p-6 text-center text-xs text-muted-foreground bg-surface/40">
                Pick a channel to see how the post will look.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 mb-2">
                  {active.map((c) => {
                    const def = channelDefs.find((d) => d.id === c)!;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPreviewChannel(c)}
                        className={cn(
                          "h-7 w-7 rounded inline-flex items-center justify-center border-hairline",
                          shown === c ? "bg-primary text-primary-foreground" : "hover:bg-surface-hover text-muted-foreground",
                        )}
                        title={def.label}
                      >
                        <def.Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
                {shown && <OrganicPostPreview channel={shown} post={draft} />}
                <div className="text-[11px] text-muted-foreground mt-2">
                  {draft.scheduledAt
                    ? `Goes out ${new Date(draft.scheduledAt).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : "No time picked yet — it stays a draft."}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between border-t-hairline pt-3">
          <Btn variant="ghost" onClick={onClose}>
            <X className="w-3.5 h-3.5" /> Cancel
          </Btn>
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={() => onSave(draft)}>Save as draft</Btn>
            <Btn
              variant="secondary"
              disabled={blocking.length > 0}
              onClick={() => blocking.length === 0 && onSubmitForApproval(draft)}
            >
              Send for approval
            </Btn>
            <Btn variant="primary" disabled={!canSchedule} onClick={() => canSchedule && onSchedule(draft)}>
              Schedule post
            </Btn>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full bg-surface border-hairline text-[11px] inline-flex items-center justify-center text-muted-foreground">
          {n}
        </span>
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      {children}
    </section>
  );
}
