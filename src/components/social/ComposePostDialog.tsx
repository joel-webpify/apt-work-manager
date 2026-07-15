import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Btn } from "@/components/layout/PageShell";
import { Facebook, Instagram, Linkedin, Music2, Twitter } from "lucide-react";
import type { SocialChannel, SocialPost } from "@/lib/socialPostsStore";
import { cn } from "@/lib/utils";

const channelDefs: { id: SocialChannel; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "facebook", label: "Facebook", Icon: Facebook },
  { id: "instagram", label: "Instagram", Icon: Instagram },
  { id: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { id: "tiktok", label: "TikTok", Icon: Music2 },
  { id: "x", label: "X", Icon: Twitter },
];

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  useEffect(() => setDraft(post), [post]);

  if (!draft) return null;

  const toggleChannel = (c: SocialChannel) => {
    setDraft({
      ...draft,
      channels: draft.channels.includes(c)
        ? draft.channels.filter((x) => x !== c)
        : [...draft.channels, c],
    });
  };

  const canSchedule = draft.content.trim() && draft.channels.length && draft.scheduledAt;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {post?.status === "draft" ? "Compose post" : "Edit post"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Channels</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {channelDefs.map(({ id, label, Icon }) => {
                const active = draft.channels.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleChannel(id)}
                    className={cn(
                      "h-8 px-3 rounded-md border-hairline text-sm inline-flex items-center gap-1.5 transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-surface-hover",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Content</Label>
            <Textarea
              className="mt-1.5 min-h-[140px]"
              placeholder="What do you want to share?"
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            />
            <div className="text-xs text-muted-foreground mt-1">{draft.content.length} characters</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Schedule for</Label>
              <Input
                type="datetime-local"
                className="mt-1.5"
                value={toLocalInput(draft.scheduledAt)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Author</Label>
              <Input
                className="mt-1.5"
                value={draft.author}
                onChange={(e) => setDraft({ ...draft, author: e.target.value })}
              />
            </div>
          </div>

          {draft.kind === "paid" && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t-hairline">
              <div>
                <Label className="text-xs text-muted-foreground">Budget ($)</Label>
                <Input
                  type="number"
                  className="mt-1.5"
                  value={draft.budget ?? 0}
                  onChange={(e) => setDraft({ ...draft, budget: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Objective</Label>
                <Input
                  className="mt-1.5"
                  value={draft.objective ?? ""}
                  onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Audience</Label>
                <Input
                  className="mt-1.5"
                  value={draft.audience ?? ""}
                  onChange={(e) => setDraft({ ...draft, audience: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={() => onSave(draft)}>Save draft</Btn>
            <Btn variant="secondary" onClick={() => onSubmitForApproval(draft)}>
              Submit for approval
            </Btn>
            <Btn
              variant="primary"
              disabled={!canSchedule}
              onClick={() => canSchedule && onSchedule(draft)}
            >
              Schedule
            </Btn>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
