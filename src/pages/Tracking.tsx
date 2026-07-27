import { useMemo, useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import {
  Activity,
  Code,
  Globe,
  Search,
  Tag,
  Filter,
  Layers,
} from "lucide-react";
import { liveEvents, eventCatalog, formatAgo, eventLabel, categoryLabels, type EventCategory } from "@/lib/trackingData";

const methods = [
  {
    id: "js",
    icon: Code,
    name: "Code snippet",
    description: "Add one line of code to your website. Works with any website builder.",
    installed: true,
  },
  {
    id: "wp",
    icon: Globe,
    name: "WordPress plugin",
    description: "If your site runs on WordPress, install our plugin — no code needed.",
    installed: false,
  },
  {
    id: "gtm",
    icon: Tag,
    name: "Google Tag Manager",
    description: "Already using Google Tag Manager? Import our ready-made setup.",
    installed: false,
  },
];

const categoryTone: Record<EventCategory, "neutral" | "info" | "success" | "warning" | "danger"> = {
  session: "neutral",
  form: "info",
};

const tabs = [
  { id: "live", label: "Live activity", icon: Activity },
  { id: "catalog", label: "What we track", icon: Layers },
  { id: "install", label: "Set up tracking", icon: Code },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default function Tracking() {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <>
      <PageHeader
        title="Website tracking"
        description="See who visits your website and how they get on with your forms"
        actions={
          <>
            <Btn>Export</Btn>
            <Btn variant="primary">Add something to track</Btn>
          </>
        }
      />
      <PageBody>
        <div className="flex items-center gap-1 border-hairline rounded-md p-1 bg-surface w-fit mb-5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium transition-colors ${
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "live" && <LiveTab />}
        {tab === "catalog" && <CatalogTab />}
        {tab === "install" && <InstallTab />}
      </PageBody>
    </>
  );
}

/* ---------------- Live events ---------------- */

function LiveTab() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<EventCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      liveEvents.filter((e) => {
        if (cat !== "all" && e.category !== cat) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          e.event.includes(q) ||
          e.page.toLowerCase().includes(q) ||
          e.source.includes(q) ||
          (e.campaign ?? "").includes(q) ||
          e.city.toLowerCase().includes(q)
        );
      }),
    [query, cat],
  );

  const cats: (EventCategory | "all")[] = ["all", "session", "form"];

  return (
    <>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Kpi label="Things happened (last 24h)" value="4,812" delta="+12.4% vs yesterday" />
        <Kpi label="People on your site now" value="37" delta="live" tone="success" />
        <Kpi label="Forms sent" value="164" delta="+8.1% vs last period" />
        <Kpi label="Pages being tracked" value="42" delta="3 new" />
      </div>

      <div className="border-hairline rounded-lg bg-card">
        <div className="px-4 h-12 flex items-center justify-between gap-3 border-b-hairline">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by page, source or town…"
                className="h-8 w-64 rounded-md border-hairline bg-surface pl-7 pr-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`h-6 px-2 rounded text-[11px] font-medium transition-colors ${
                    cat === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-hover"
                  }`}
                >
                  {c === "all" ? "Everything" : categoryLabels[c]}
                </button>
              ))}
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            Receiving events
          </span>
        </div>

        <div className="grid grid-cols-[1.3fr_1.7fr_1.2fr_1fr_0.9fr_0.6fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
          <div>What happened</div>
          <div>Page</div>
          <div>Came from</div>
          <div>Device</div>
          <div>Where</div>
          <div className="text-right">When</div>
        </div>

        <div className="max-h-[460px] overflow-auto">
          {rows.map((e) => (
            <div key={e.id} className="border-b-hairline last:border-b-0">
              <button
                onClick={() => setOpenId(openId === e.id ? null : e.id)}
                className="w-full grid grid-cols-[1.3fr_1.7fr_1.2fr_1fr_0.9fr_0.6fr] px-4 h-10 items-center text-sm text-left hover:bg-surface-hover"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs truncate">{eventLabel(e.event)}</span>
                  <Pill tone={categoryTone[e.category]}>{categoryLabels[e.category]}</Pill>
                </div>
                <div className="text-muted-foreground truncate text-xs">{e.page}</div>
                <div className="text-muted-foreground truncate text-xs">
                  {e.source} / {e.medium}
                </div>
                <div className="text-muted-foreground truncate text-xs capitalize">
                  {e.device} · {e.browser}
                </div>
                <div className="text-muted-foreground truncate text-xs">{e.city}</div>
                <div className="text-right text-muted-foreground tabular-nums text-xs">
                  {formatAgo(e.minutesAgo)}
                </div>
              </button>
              {openId === e.id && (
                <div className="px-4 pb-3 pt-1 bg-surface/40 grid grid-cols-4 gap-3">
                  <Detail label="Visitor" value={`${e.isNew ? "First time here" : "Been here before"} · ${e.visitorId}`} />
                  <Detail label="Campaign" value={e.campaign ?? "No campaign"} />
                  <Detail label="Device" value={`${e.os} · ${e.browser}`} />
                  <Detail label="Country" value={e.country} />
                  <Detail label="Estimated value" value={e.value ? `£${e.value}` : "—"} />
                  <Detail label="Page" value={e.page} />
                  <Detail label="Event name (technical)" value={e.event} />
                  <Detail label="When" value={formatAgo(e.minutesAgo)} />
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">Nothing matches that search — try clearing the filters.</div>
          )}
        </div>
      </div>
    </>
  );
}



/* ---------------- Event catalog ---------------- */

function CatalogTab() {
  const [events, setEvents] = useState(eventCatalog);
  const toggle = (name: string) =>
    setEvents((prev) => prev.map((e) => (e.name === name ? { ...e, enabled: !e.enabled } : e)));

  return (
    <div className="border-hairline rounded-lg bg-card">
      <div className="px-4 h-11 flex items-center justify-between border-b-hairline">
        <div>
          <span className="text-sm font-medium">What we track</span>
          <p className="text-xs text-muted-foreground">Turn anything off you don't want recorded.</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {events.filter((e) => e.enabled).length} of {events.length} turned on
        </span>
      </div>
      <div className="grid grid-cols-[1.2fr_2fr_0.8fr_0.7fr_0.6fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
        <div>What happened</div>
        <div>What it means</div>
        <div>Type</div>
        <div className="text-right">Last 7 days</div>
        <div className="text-right">Status</div>
      </div>
      {events.map((e) => (
        <div
          key={e.name}
          className="grid grid-cols-[1.2fr_2fr_0.8fr_0.7fr_0.6fr] px-4 h-14 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs truncate">{eventLabel(e.name)}</span>
              {e.conversion && <Pill tone="success">enquiry</Pill>}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">{e.name}</div>
          </div>
          <div className="text-xs text-muted-foreground truncate">{e.description}</div>
          <div>
            <Pill tone={categoryTone[e.category]}>{categoryLabels[e.category]}</Pill>
          </div>
          <div className="text-right tabular-nums text-xs text-muted-foreground">{e.count7d}</div>
          <div className="flex justify-end">
            <button
              onClick={() => toggle(e.name)}
              className={`h-6 px-2 rounded text-[11px] font-medium transition-colors ${
                e.enabled
                  ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover"
              }`}
            >
              {e.enabled ? "On" : "Off"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Install ---------------- */

function InstallTab() {
  const snippet = '<script src="//track.servicecrm.io/t.js"></script>';
  return (
    <div className="space-y-4">
      <div className="border-hairline rounded-lg bg-card p-5">
        <div className="text-sm font-medium">Copy this and paste it into your website</div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          It goes just before the closing &lt;/head&gt; tag on every page. Once it's there, tracking starts
          straight away — there's nothing else to set up.
        </p>
        <div className="mt-3 bg-surface rounded-md p-3 text-xs font-mono text-muted-foreground border-hairline overflow-x-auto">
          {snippet}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Btn variant="primary" onClick={() => navigator.clipboard?.writeText(snippet)}>
            Copy code
          </Btn>
          <Btn
            onClick={() =>
              (window.location.href = `mailto:?subject=${encodeURIComponent(
                "Please add this to our website",
              )}&body=${encodeURIComponent(
                "Hi,\n\nPlease add the line below just before the </head> tag on every page of our website:\n\n" +
                  snippet +
                  "\n\nThanks!",
              )}`)
            }
          >
            Email it to my web person
          </Btn>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Not sure what this means? Send it to whoever looks after your website — they'll know what to do.
        </p>
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-2">Or use one of these instead</div>
        <div className="grid grid-cols-3 gap-3">
          {methods.map((m) => (
            <div key={m.id} className="border-hairline rounded-lg bg-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center">
                  <m.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <Pill tone={m.installed ? "success" : "neutral"}>
                  {m.installed ? "Set up" : "Not set up"}
                </Pill>
              </div>
              <div className="text-sm font-medium">{m.name}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
              <div className="mt-3">
                <Btn className="w-full justify-center">{m.installed ? "Manage" : "Set up"}</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Shared bits ---------------- */

function Kpi({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "neutral" | "success";
}) {
  return (
    <div className="border-hairline rounded-lg bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-medium tracking-tight mt-1 tabular-nums">{value}</div>
      {delta && (
        <div className={`text-[11px] mt-0.5 ${tone === "success" ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`}>
          {delta}
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="border-hairline rounded-lg bg-card">
      <div className="px-4 h-11 flex items-center gap-1.5 border-b-hairline">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-xs mt-0.5 truncate">{value}</div>
    </div>
  );
}
