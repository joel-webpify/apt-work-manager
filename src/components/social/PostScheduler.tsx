import { useMemo, useState } from "react";
import { PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Facebook,
  Instagram,
  Linkedin,
  Music2,
  Twitter,
  Check,
  X,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  deletePost,
  newDraft,
  setStatus,
  upsertPost,
  useSocialPosts,
  type PostKind,
  type PostStatus,
  type SocialChannel,
  type SocialPost,
} from "@/lib/socialPostsStore";
import { ComposePostDialog } from "./ComposePostDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const channelIcon: Record<SocialChannel, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music2,
  x: Twitter,
};

const statusMeta: Record<PostStatus, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_approval: { label: "Pending approval", tone: "warning" },
  approved: { label: "Approved", tone: "info" },
  scheduled: { label: "Scheduled", tone: "info" },
  published: { label: "Published", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function fmtMonth(d: Date) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}
function fmtTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ChannelChips({ channels }: { channels: SocialChannel[] }) {
  return (
    <div className="flex items-center gap-1">
      {channels.map((c) => {
        const Icon = channelIcon[c];
        return (
          <span
            key={c}
            className="w-5 h-5 rounded bg-surface border-hairline inline-flex items-center justify-center text-muted-foreground"
          >
            <Icon className="w-3 h-3" />
          </span>
        );
      })}
    </div>
  );
}

function PostRow({
  post,
  onEdit,
  actions,
}: {
  post: SocialPost;
  onEdit: (p: SocialPost) => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-hairline rounded-lg p-3 bg-background flex items-start gap-3 hover:bg-surface-hover transition-colors">
      <ChannelChips channels={post.channels} />
      <div className="flex-1 min-w-0">
        <div className="text-sm line-clamp-2">{post.content || <span className="italic text-muted-foreground">No content yet</span>}</div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <Pill tone={statusMeta[post.status].tone}>{statusMeta[post.status].label}</Pill>
          <span>· {post.author}</span>
          {post.scheduledAt && <span>· {fmtTime(post.scheduledAt)}</span>}
          {post.publishedAt && <span>· Published {fmtTime(post.publishedAt)}</span>}
          {post.kind === "paid" && post.budget != null && <span>· ${post.budget}</span>}
          {post.metrics && (
            <span>
              · {post.metrics.impressions.toLocaleString()} impr · {post.metrics.clicks} clicks
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {actions}
        <button
          onClick={() => onEdit(post)}
          className="h-7 w-7 rounded hover:bg-surface-hover inline-flex items-center justify-center text-muted-foreground"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            if (confirm("Delete this post?")) {
              deletePost(post.id);
              toast.success("Post deleted");
            }
          }}
          className="h-7 w-7 rounded hover:bg-surface-hover inline-flex items-center justify-center text-muted-foreground"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function CalendarGrid({ posts, onEdit, onNew }: { posts: SocialPost[]; onEdit: (p: SocialPost) => void; onNew: (date: Date) => void }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const monthStart = startOfMonth(cursor);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - ((monthStart.getDay() + 6) % 7)); // Monday-first
  const days: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const byDay = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    posts.forEach((p) => {
      const iso = p.scheduledAt || p.publishedAt;
      if (!iso) return;
      const d = new Date(iso);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) || [];
      arr.push(p);
      map.set(key, arr);
    });
    return map;
  }, [posts]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">{fmtMonth(cursor)}</div>
        <div className="flex items-center gap-1">
          <Btn variant="ghost" onClick={() => setCursor(new Date())}>
            Today
          </Btn>
          <button
            className="h-7 w-7 rounded hover:bg-surface-hover inline-flex items-center justify-center"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            className="h-7 w-7 rounded hover:bg-surface-hover inline-flex items-center justify-center"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-hairline rounded-lg overflow-hidden bg-background">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 py-1.5 text-xs text-muted-foreground border-b-hairline bg-surface">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const inMonth = d.getMonth() === cursor.getMonth();
          const dayPosts = byDay.get(key) || [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-[104px] p-1.5 border-t-hairline border-l-hairline first:border-l-0 group relative",
                !inMonth && "bg-surface/40",
                i % 7 === 0 && "border-l-0",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs w-5 h-5 inline-flex items-center justify-center rounded",
                    key === todayKey ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground",
                    !inMonth && "opacity-50",
                  )}
                >
                  {d.getDate()}
                </span>
                <button
                  onClick={() => onNew(d)}
                  className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded hover:bg-surface-hover inline-flex items-center justify-center text-muted-foreground"
                  title="New post"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onEdit(p)}
                    className={cn(
                      "w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded border-hairline truncate",
                      p.status === "published" && "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]",
                      p.status === "scheduled" && "bg-primary/10 text-primary",
                      p.status === "pending_approval" && "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]",
                      p.status === "approved" && "bg-primary/10 text-primary",
                      p.status === "draft" && "bg-surface text-muted-foreground",
                      p.status === "rejected" && "bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]",
                    )}
                  >
                    {p.scheduledAt || p.publishedAt
                      ? new Date(p.scheduledAt || p.publishedAt!).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}{" "}
                    · {p.content.slice(0, 24) || "Untitled"}
                  </button>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-[11px] text-muted-foreground px-1.5">+{dayPosts.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PostScheduler({ kind }: { kind: PostKind }) {
  const posts = useSocialPosts(kind);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = (date?: Date) => {
    const d = newDraft(kind);
    if (date) {
      const scheduled = new Date(date);
      scheduled.setHours(9, 0, 0, 0);
      d.scheduledAt = scheduled.toISOString();
    }
    setEditing(d);
    setOpen(true);
  };

  const openEdit = (p: SocialPost) => {
    setEditing(p);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditing(null);
  };

  const save = (p: SocialPost) => {
    upsertPost({ ...p, updatedAt: new Date().toISOString() });
    toast.success("Draft saved");
    close();
  };
  const submit = (p: SocialPost) => {
    upsertPost({ ...p, status: "pending_approval", updatedAt: new Date().toISOString() });
    toast.success("Submitted for approval");
    close();
  };
  const schedule = (p: SocialPost) => {
    upsertPost({ ...p, status: "scheduled", updatedAt: new Date().toISOString() });
    toast.success("Post scheduled");
    close();
  };

  const drafts = posts.filter((p) => p.status === "draft");
  const approvals = posts.filter((p) => p.status === "pending_approval");
  const scheduled = posts.filter((p) => p.status === "scheduled" || p.status === "approved");
  const published = posts.filter((p) => p.status === "published");

  const kpis = [
    { label: "Drafts", value: drafts.length },
    { label: "Awaiting approval", value: approvals.length },
    { label: "Scheduled", value: scheduled.length },
    { label: "Published (30d)", value: published.length },
  ];

  return (
    <PageBody>
      <div className="flex items-center justify-between mb-4">
        <div className="grid grid-cols-4 gap-2 flex-1 max-w-2xl">
          {kpis.map((k) => (
            <div key={k.label} className="border-hairline rounded-md px-3 py-2 bg-surface">
              <div className="text-[11px] text-muted-foreground">{k.label}</div>
              <div className="text-lg font-medium tracking-tight leading-tight">{k.value}</div>
            </div>
          ))}
        </div>
        <Btn variant="primary" onClick={() => openNew()}>
          <Plus className="w-3.5 h-3.5" /> New post
        </Btn>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="approval">Approval ({approvals.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CalendarGrid posts={posts} onEdit={openEdit} onNew={(d) => openNew(d)} />
        </TabsContent>

        <TabsContent value="drafts" className="mt-4 space-y-2">
          {drafts.length === 0 && <EmptyState label="No drafts yet" />}
          {drafts.map((p) => (
            <PostRow
              key={p.id}
              post={p}
              onEdit={openEdit}
              actions={
                <Btn variant="secondary" onClick={() => setStatus(p.id, "pending_approval") || toast.success("Submitted")}>
                  Submit
                </Btn>
              }
            />
          ))}
        </TabsContent>

        <TabsContent value="approval" className="mt-4 space-y-2">
          {approvals.length === 0 && <EmptyState label="Nothing awaiting approval" />}
          {approvals.map((p) => (
            <PostRow
              key={p.id}
              post={p}
              onEdit={openEdit}
              actions={
                <>
                  <button
                    onClick={() => {
                      setStatus(p.id, p.scheduledAt ? "scheduled" : "approved");
                      toast.success("Approved");
                    }}
                    className="h-7 px-2 rounded text-xs font-medium bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] inline-flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      const note = prompt("Reason for rejection?") || "";
                      setStatus(p.id, "rejected", { rejectionNote: note });
                      toast.success("Rejected");
                    }}
                    className="h-7 px-2 rounded text-xs font-medium bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Reject
                  </button>
                </>
              }
            />
          ))}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4 space-y-2">
          {scheduled.length === 0 && <EmptyState label="Nothing scheduled" />}
          {scheduled
            .slice()
            .sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""))
            .map((p) => (
              <PostRow
                key={p.id}
                post={p}
                onEdit={openEdit}
                actions={
                  <Btn
                    variant="secondary"
                    onClick={() => {
                      setStatus(p.id, "published", { publishedAt: new Date().toISOString() });
                      toast.success("Marked as published");
                    }}
                  >
                    Publish now
                  </Btn>
                }
              />
            ))}
        </TabsContent>

        <TabsContent value="published" className="mt-4 space-y-2">
          {published.length === 0 && <EmptyState label="No published posts yet" />}
          {published
            .slice()
            .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
            .map((p) => (
              <PostRow key={p.id} post={p} onEdit={openEdit} />
            ))}
        </TabsContent>
      </Tabs>

      <ComposePostDialog
        open={open}
        post={editing}
        onClose={close}
        onSave={save}
        onSubmitForApproval={submit}
        onSchedule={schedule}
      />
    </PageBody>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="border-hairline rounded-lg p-10 text-center text-sm text-muted-foreground bg-surface/40">
      {label}
    </div>
  );
}
