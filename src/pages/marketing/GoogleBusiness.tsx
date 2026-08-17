import { useMemo, useState } from "react";
import {
  Store,
  Star,
  MessageSquare,
  Megaphone,
  BarChart3,
  Phone,
  Globe,
  MapPin,
  Clock,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Grid3x3,
} from "lucide-react";
import { PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { RankGridTab } from "@/components/marketing/RankGridTab";
import { GoogleBusinessReport } from "@/components/reporting/GoogleBusinessReport";

import {
  useGbp,
  saveProfile,
  replyToReview,
  upsertPost,
  deletePost,
  newPost,
  suggestedReply,
  type GbpProfile,
  type GbpPost,
} from "@/lib/gbpStore";
import { toast } from "@/hooks/use-toast";

const tabs = [
  { id: "profile", label: "Business info", icon: Store },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "posts", label: "Posts & offers", icon: Megaphone },
  { id: "rank", label: "Map ranking", icon: Grid3x3 },
  { id: "insights", label: "Insights", icon: BarChart3 },
] as const;


type TabId = typeof tabs[number]["id"];

export default function GoogleBusiness() {
  const { profile, reviews, posts } = useGbp();
  const [tab, setTab] = useState<TabId>("profile");

  const unanswered = reviews.filter((r) => !r.reply).length;
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / (reviews.length || 1);

  return (
    <PageBody>
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Average rating" value={avg.toFixed(1)} sub={`${reviews.length} reviews`} />
        <Stat label="Waiting for a reply" value={String(unanswered)} sub="Replying helps you rank" />
        <Stat label="Posts live or planned" value={String(posts.filter((p) => p.status !== "draft").length)} sub="Keep one going each week" />
        <Stat label="Profile completeness" value={`${completeness(profile)}%`} sub="Fill everything in to show up more" />
      </div>

      <div className="flex items-center gap-1 mt-5 border-b-hairline">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`h-9 px-3 -mb-px inline-flex items-center gap-1.5 text-sm border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "profile" && <ProfileTab />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "posts" && <PostsTab />}
        {tab === "rank" && <RankGridTab businessName={profile.name} />}

        {tab === "insights" && <GoogleBusinessReport range="30d" />}
      </div>
    </PageBody>
  );
}

function completeness(p: GbpProfile) {
  const checks = [
    p.name,
    p.category,
    p.phone,
    p.website,
    p.address,
    p.description.length > 60,
    p.serviceArea,
    p.services.length >= 3,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-medium tracking-tight mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

/* ---------------- business info ---------------- */

function ProfileTab() {
  const { profile } = useGbp();
  const [draft, setDraft] = useState<GbpProfile>(profile);
  const [serviceInput, setServiceInput] = useState("");
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(profile), [draft, profile]);

  const set = <K extends keyof GbpProfile>(k: K, v: GbpProfile[K]) => setDraft({ ...draft, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="border-hairline rounded-lg bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium">How you appear on Google</h3>
          <Field label="Business name" value={draft.name} onChange={(v) => set("name", v)} />
          <Field label="Main category" value={draft.category} onChange={(v) => set("category", v)} />
          <Field label="Phone number" icon={<Phone className="w-3.5 h-3.5" />} value={draft.phone} onChange={(v) => set("phone", v)} />
          <Field label="Website" icon={<Globe className="w-3.5 h-3.5" />} value={draft.website} onChange={(v) => set("website", v)} />
          <Field label="Address" icon={<MapPin className="w-3.5 h-3.5" />} value={draft.address} onChange={(v) => set("address", v)} />
          <Field label="Areas you cover" value={draft.serviceArea} onChange={(v) => set("serviceArea", v)} />
          <div>
            <label className="text-xs text-muted-foreground">Short description</label>
            <textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className="mt-1 w-full text-sm bg-background border-hairline rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="text-xs text-muted-foreground mt-1">{draft.description.length}/750 characters</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-hairline rounded-lg bg-card p-4">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Opening hours
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Wrong hours is the top reason people call a competitor.</p>
            <div className="mt-3 space-y-1.5">
              {draft.hours.map((h, i) => (
                <div key={h.day} className="flex items-center gap-2 text-sm">
                  <span className="w-24 text-muted-foreground text-xs">{h.day}</span>
                  {h.closed ? (
                    <span className="flex-1 text-xs text-muted-foreground">Closed</span>
                  ) : (
                    <>
                      <TimeInput
                        value={h.open}
                        onChange={(v) =>
                          set("hours", draft.hours.map((x, j) => (j === i ? { ...x, open: v } : x)))
                        }
                      />
                      <span className="text-muted-foreground text-xs">to</span>
                      <TimeInput
                        value={h.close}
                        onChange={(v) =>
                          set("hours", draft.hours.map((x, j) => (j === i ? { ...x, close: v } : x)))
                        }
                      />
                    </>
                  )}
                  <button
                    onClick={() =>
                      set("hours", draft.hours.map((x, j) => (j === i ? { ...x, closed: !x.closed } : x)))
                    }
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                  >
                    {h.closed ? "Set open" : "Mark closed"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-hairline rounded-lg bg-card p-4">
            <h3 className="text-sm font-medium">Services you list</h3>
            <p className="text-xs text-muted-foreground mt-0.5">These match the words people search for.</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {draft.services.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full border-hairline text-xs bg-surface">
                  {s}
                  <button
                    onClick={() => set("services", draft.services.filter((x) => x !== s))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${s}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && serviceInput.trim()) {
                    set("services", [...draft.services, serviceInput.trim()]);
                    setServiceInput("");
                  }
                }}
                placeholder="Add a service…"
                className="flex-1 h-8 text-sm bg-background border-hairline rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Btn
                onClick={() => {
                  if (!serviceInput.trim()) return;
                  set("services", [...draft.services, serviceInput.trim()]);
                  setServiceInput("");
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Btn>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Btn
          variant="primary"
          disabled={!dirty}
          className={!dirty ? "opacity-50 pointer-events-none" : ""}
          onClick={() => {
            saveProfile(draft);
            toast({ title: "Business info saved", description: "Your Google listing details are up to date." });
          }}
        >
          <Check className="w-3.5 h-3.5" /> Save changes
        </Btn>
        {dirty && (
          <Btn onClick={() => setDraft(profile)}>Discard</Btn>
        )}
        {!dirty && <span className="text-xs text-muted-foreground">Everything is saved.</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-8 text-sm bg-background border-hairline rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 text-xs bg-background border-hairline rounded-md px-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

/* ---------------- reviews ---------------- */

function ReviewsTab() {
  const { reviews, profile } = useGbp();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "unanswered" | "low">("all");

  const list = reviews.filter((r) =>
    filter === "unanswered" ? !r.reply : filter === "low" ? r.rating <= 3 : true
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {([
          { id: "all", label: "All reviews" },
          { id: "unanswered", label: "Needs a reply" },
          { id: "low", label: "3 stars or less" },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`h-7 px-3 text-xs rounded-full border-hairline transition-colors ${
              filter === f.id ? "bg-foreground text-background border-transparent" : "bg-card hover:bg-surface-hover text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="border-hairline rounded-lg bg-surface p-6 text-sm text-muted-foreground text-center">
          Nothing here — every review in this view has been answered.
        </div>
      )}

      {list.map((r) => {
        const draft = drafts[r.id] ?? r.reply ?? "";
        return (
          <div key={r.id} className="border-hairline rounded-lg bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{r.author}</span>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < r.rating ? "text-[hsl(var(--warning))] fill-current" : "text-muted-foreground/40"}`}
                      />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.daysAgo}d ago</span>
                </div>
                <p className="text-sm mt-1.5">{r.text}</p>
              </div>
              {r.reply ? <Pill tone="success">Replied</Pill> : <Pill tone="warning">Needs a reply</Pill>}
            </div>

            <div className="mt-3 pl-3 border-l-2 border-border">
              <textarea
                value={draft}
                onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                rows={3}
                placeholder="Write a reply…"
                className="w-full text-sm bg-background border-hairline rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex items-center gap-2 mt-2">
                <Btn
                  variant="primary"
                  onClick={() => {
                    replyToReview(r.id, draft);
                    toast({ title: r.reply ? "Reply updated" : "Reply posted" });
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> {r.reply ? "Update reply" : "Post reply"}
                </Btn>
                <Btn onClick={() => setDrafts({ ...drafts, [r.id]: suggestedReply(r, profile.name) })}>
                  <Sparkles className="w-3.5 h-3.5" /> Suggest a reply
                </Btn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- posts ---------------- */

const postTypes: { id: GbpPost["type"]; label: string }[] = [
  { id: "update", label: "Update" },
  { id: "offer", label: "Offer" },
  { id: "event", label: "Event" },
];

function PostsTab() {
  const { posts } = useGbp();
  const [editing, setEditing] = useState<GbpPost | null>(null);

  return (
    <div className="grid grid-cols-5 gap-3">
      <div className="col-span-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Your posts</h3>
          <Btn variant="primary" onClick={() => setEditing(newPost())}>
            <Plus className="w-3.5 h-3.5" /> New post
          </Btn>
        </div>
        {posts.length === 0 && (
          <div className="border-hairline rounded-lg bg-surface p-6 text-sm text-muted-foreground text-center">
            No posts yet. A weekly offer or update keeps your listing near the top.
          </div>
        )}
        {posts.map((p) => (
          <div key={p.id} className="border-hairline rounded-lg bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Pill tone={p.type === "offer" ? "info" : "neutral"}>{p.type}</Pill>
                <Pill tone={p.status === "published" ? "success" : p.status === "scheduled" ? "warning" : "neutral"}>
                  {p.status === "published" ? "Live" : p.status === "scheduled" ? "Scheduled" : "Draft"}
                </Pill>
                <span className="text-xs text-muted-foreground">{p.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Btn variant="ghost" onClick={() => setEditing(p)}>Edit</Btn>
                <Btn
                  variant="ghost"
                  onClick={() => {
                    deletePost(p.id);
                    if (editing?.id === p.id) setEditing(null);
                    toast({ title: "Post deleted" });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Btn>
              </div>
            </div>
            <div className="text-sm font-medium mt-2">{p.title || "Untitled post"}</div>
            <p className="text-sm text-muted-foreground mt-0.5">{p.body}</p>
            {p.cta && <div className="text-xs text-primary mt-2">{p.cta} →</div>}
          </div>
        ))}
      </div>

      <div className="col-span-2">
        {editing ? (
          <PostEditor
            key={editing.id}
            post={editing}
            onClose={() => setEditing(null)}
          />
        ) : (
          <div className="border-hairline rounded-lg bg-surface p-4 text-sm text-muted-foreground">
            Pick a post to edit, or create a new one. Posts show on your Google listing for 7 days — offers work best.
          </div>
        )}
      </div>
    </div>
  );
}

function PostEditor({ post, onClose }: { post: GbpPost; onClose: () => void }) {
  const [draft, setDraft] = useState<GbpPost>(post);
  const set = <K extends keyof GbpPost>(k: K, v: GbpPost[K]) => setDraft({ ...draft, [k]: v });

  return (
    <div className="border-hairline rounded-lg bg-card p-4 space-y-3 sticky top-0">
      <h3 className="text-sm font-medium">{post.title ? "Edit post" : "New post"}</h3>

      <div className="flex items-center gap-1">
        {postTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => set("type", t.id)}
            className={`h-7 px-3 text-xs rounded-full border-hairline transition-colors ${
              draft.type === t.id ? "bg-foreground text-background border-transparent" : "bg-surface text-muted-foreground hover:bg-surface-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Field label="Headline" value={draft.title} onChange={(v) => set("title", v)} />
      <div>
        <label className="text-xs text-muted-foreground">What you want to say</label>
        <textarea
          value={draft.body}
          onChange={(e) => set("body", e.target.value)}
          rows={4}
          className="mt-1 w-full text-sm bg-background border-hairline rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <Field label="Button text" value={draft.cta} onChange={(v) => set("cta", v)} />
      <Field label="Button link" value={draft.ctaUrl} onChange={(v) => set("ctaUrl", v)} />
      <div>
        <label className="text-xs text-muted-foreground">Date</label>
        <input
          type="date"
          value={draft.date}
          onChange={(e) => set("date", e.target.value)}
          className="mt-1 w-full h-8 text-sm bg-background border-hairline rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Btn
          variant="primary"
          onClick={() => {
            upsertPost({ ...draft, status: "published" });
            toast({ title: "Post is live", description: "It will show on your listing for 7 days." });
            onClose();
          }}
        >
          Publish now
        </Btn>
        <Btn
          onClick={() => {
            upsertPost({ ...draft, status: "scheduled" });
            toast({ title: "Post scheduled", description: `Going out on ${draft.date}.` });
            onClose();
          }}
        >
          Schedule
        </Btn>
        <Btn
          variant="ghost"
          onClick={() => {
            upsertPost({ ...draft, status: "draft" });
            onClose();
          }}
        >
          Save draft
        </Btn>
      </div>
    </div>
  );
}
