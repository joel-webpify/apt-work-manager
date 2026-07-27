import { useMemo, useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import {
  Activity,
  Code,
  Globe,
  MonitorSmartphone,
  MapPin,
  Search,
  Tag,
  Filter,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  liveEvents,
  eventCatalog,
  trafficByDay,
  topPages,
  channelBreakdown,
  deviceSplit,
  geoSplit,
  funnelSteps,
  formatAgo,
  type EventCategory,
} from "@/lib/trackingData";

const methods = [
  {
    id: "js",
    icon: Code,
    name: "JavaScript snippet",
    description: "Paste a small script into the <head> of your website. Works with any platform.",
    installed: true,
  },
  {
    id: "wp",
    icon: Globe,
    name: "WordPress plugin",
    description: "Install our official plugin from the WordPress directory. One-click setup.",
    installed: false,
  },
  {
    id: "gtm",
    icon: Tag,
    name: "Google Tag Manager",
    description: "Import our GTM container template. Recommended if you already use GTM.",
    installed: false,
  },
];

const categoryTone: Record<EventCategory, "neutral" | "info" | "success" | "warning" | "danger"> = {
  page: "neutral",
  form: "info",
  engagement: "warning",
  commerce: "success",
  custom: "danger",
};

const tabs = [
  { id: "live", label: "Live events", icon: Activity },
  { id: "web", label: "Web data", icon: TrendingUp },
  { id: "catalog", label: "Event catalog", icon: Layers },
  { id: "install", label: "Install", icon: Code },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default function Tracking() {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <>
      <PageHeader
        title="Tracking"
        description="Capture every visit, event and attribution signal from your website"
        actions={
          <>
            <Btn>Export</Btn>
            <Btn variant="primary">Add event</Btn>
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
        {tab === "web" && <WebTab />}
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

  const cats: (EventCategory | "all")[] = ["all", "page", "form", "engagement", "commerce", "custom"];

  return (
    <>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <Kpi label="Events (24h)" value="4,812" delta="+12.4%" />
        <Kpi label="Active visitors" value="37" delta="live" tone="success" />
        <Kpi label="Conversion events" value="164" delta="+8.1%" />
        <Kpi label="Tracked pages" value="42" delta="3 new" />
      </div>

      <div className="border-hairline rounded-lg bg-card">
        <div className="px-4 h-12 flex items-center justify-between gap-3 border-b-hairline">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, pages, sources…"
                className="h-8 w-64 rounded-md border-hairline bg-surface pl-7 pr-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`h-6 px-2 rounded text-[11px] font-medium capitalize transition-colors ${
                    cat === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-hover"
                  }`}
                >
                  {c}
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
          <div>Event</div>
          <div>Page</div>
          <div>Source / medium</div>
          <div>Device</div>
          <div>Location</div>
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
                  <span className="font-mono text-xs truncate">{e.event}</span>
                  <Pill tone={categoryTone[e.category]}>{e.category}</Pill>
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
                  <Detail label="Visitor" value={`${e.visitorId} · ${e.isNew ? "new" : "returning"}`} />
                  <Detail label="Campaign" value={e.campaign ?? "—"} />
                  <Detail label="OS / browser" value={`${e.os} · ${e.browser}`} />
                  <Detail label="Country" value={e.country} />
                  <Detail label="Value" value={e.value ? `£${e.value}` : "—"} />
                  <Detail label="Landing page" value={e.page} />
                  <Detail label="Category" value={e.category} />
                  <Detail label="Timestamp" value={formatAgo(e.minutesAgo)} />
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">No events match your filters.</div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------- Web data ---------------- */

function WebTab() {
  const max = Math.max(...trafficByDay.map((d) => d.sessions));
  const maxChannel = Math.max(...channelBreakdown.map((c) => c.sessions));
  const topFunnel = funnelSteps[0].count;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Sessions (14d)" value="4,525" delta="+9.2%" />
        <Kpi label="Unique visitors" value="3,318" delta="+6.8%" />
        <Kpi label="Avg. session" value="1m 47s" delta="+11s" />
        <Kpi label="Bounce rate" value="38.4%" delta="-2.1pt" tone="success" />
      </div>

      <Card title="Sessions over time" icon={Activity}>
        <div className="px-4 py-4">
          <div className="flex items-end gap-1.5 h-32">
            {trafficByDay.map((d, i) => (
              <div key={i} className="flex-1 group relative flex flex-col justify-end h-full">
                <div
                  className="w-full rounded-t bg-primary/70 group-hover:bg-primary transition-colors"
                  style={{ height: `${(d.sessions / max) * 100}%` }}
                />
                <div
                  className="w-full rounded-b bg-[hsl(var(--success)/0.5)]"
                  style={{ height: `${(d.conversions / max) * 100}%` }}
                />
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap rounded bg-foreground text-background text-[10px] px-1.5 py-1">
                  {d.sessions} sessions · {d.conversions} conv.
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-primary/70" /> Sessions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[hsl(var(--success)/0.5)]" /> Conversions
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Top pages" icon={Globe}>
          <div className="grid grid-cols-[2fr_0.7fr_0.7fr_0.7fr] px-4 h-8 items-center text-[11px] text-muted-foreground font-medium border-b-hairline bg-surface/50">
            <div>Page</div>
            <div className="text-right">Views</div>
            <div className="text-right">Bounce</div>
            <div className="text-right">Conv.</div>
          </div>
          {topPages.map((p) => (
            <div
              key={p.page}
              className="grid grid-cols-[2fr_0.7fr_0.7fr_0.7fr] px-4 h-9 items-center text-xs border-b-hairline last:border-b-0 hover:bg-surface-hover"
            >
              <div className="truncate">{p.page}</div>
              <div className="text-right tabular-nums text-muted-foreground">{p.views}</div>
              <div className="text-right tabular-nums text-muted-foreground">{p.bounce}%</div>
              <div className="text-right tabular-nums font-medium">{p.conversions}</div>
            </div>
          ))}
        </Card>

        <Card title="Channels" icon={TrendingUp}>
          <div className="p-4 space-y-3">
            {channelBreakdown.map((c) => (
              <div key={c.channel}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{c.channel}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {c.sessions} · {c.conversions} conv · £{c.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${(c.sessions / maxChannel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Devices" icon={MonitorSmartphone}>
          <div className="p-4 space-y-3">
            {deviceSplit.map((d) => (
              <div key={d.device}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{d.device}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {d.share}% · {d.sessions}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${d.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top locations" icon={MapPin}>
          <div className="p-4 space-y-2">
            {geoSplit.map((g) => (
              <div key={g.place} className="flex items-center justify-between text-xs">
                <span>{g.place}</span>
                <span className="text-muted-foreground tabular-nums">
                  {g.sessions} · {g.conversions} conv
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Conversion funnel" icon={Layers}>
          <div className="p-4 space-y-2">
            {funnelSteps.map((s, i) => {
              const pct = (s.count / topFunnel) * 100;
              const prev = i === 0 ? null : funnelSteps[i - 1].count;
              return (
                <div key={s.step}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{s.step}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {s.count}
                      {prev ? ` · ${Math.round((s.count / prev) * 100)}%` : ""}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                    <div className="h-full rounded-full bg-[hsl(var(--success)/0.6)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
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
        <span className="text-sm font-medium">Event catalog</span>
        <span className="text-xs text-muted-foreground">
          {events.filter((e) => e.enabled).length} of {events.length} enabled
        </span>
      </div>
      <div className="grid grid-cols-[1.2fr_2fr_0.8fr_0.7fr_0.6fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
        <div>Event</div>
        <div>Description</div>
        <div>Category</div>
        <div className="text-right">7d count</div>
        <div className="text-right">Status</div>
      </div>
      {events.map((e) => (
        <div
          key={e.name}
          className="grid grid-cols-[1.2fr_2fr_0.8fr_0.7fr_0.6fr] px-4 h-11 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-xs truncate">{e.name}</span>
            {e.conversion && <Pill tone="success">conv</Pill>}
          </div>
          <div className="text-xs text-muted-foreground truncate">{e.description}</div>
          <div>
            <Pill tone={categoryTone[e.category]}>{e.category}</Pill>
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
              {e.enabled ? "Tracking" : "Paused"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Install ---------------- */

function InstallTab() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {methods.map((m) => (
        <div key={m.id} className="border-hairline rounded-lg bg-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center">
              <m.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <Pill tone={m.installed ? "success" : "neutral"}>
              {m.installed ? "Installed" : "Not installed"}
            </Pill>
          </div>
          <div className="text-sm font-medium">{m.name}</div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
          {m.id === "js" ? (
            <>
              <div className="mt-3 bg-surface rounded-md p-2.5 text-xs font-mono text-muted-foreground border-hairline overflow-hidden">
                &lt;script src="//track.servicecrm.io/t.js"&gt;&lt;/script&gt;
              </div>
              <div className="mt-2">
                <Btn className="w-full justify-center">Copy snippet</Btn>
              </div>
            </>
          ) : (
            <div className="mt-3">
              <Btn className="w-full justify-center">{m.installed ? "Manage" : "Install"}</Btn>
            </div>
          )}
        </div>
      ))}
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
