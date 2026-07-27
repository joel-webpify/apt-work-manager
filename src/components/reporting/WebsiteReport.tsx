import {
  Activity,
  Globe,
  MonitorSmartphone,
  MapPin,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  trafficByDay,
  topPages,
  channelBreakdown,
  deviceSplit,
  geoSplit,
  funnelSteps,
  formBehaviourByChannel,
  fieldDropoff,
} from "@/lib/trackingData";

export function WebsiteReport() {
  const max = Math.max(...trafficByDay.map((d) => d.sessions));
  const maxChannel = Math.max(...channelBreakdown.map((c) => c.sessions));
  const topFunnel = funnelSteps[0].count;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Kpi label="Visits (last 14 days)" value="4,525" delta="+9.2% vs previous 14 days" />
        <Kpi label="Different people" value="3,318" delta="+6.8% vs previous 14 days" />
        <Kpi label="Average time on site" value="1m 47s" delta="+11s vs previous 14 days" />
        <Kpi label="Left after one page" value="38.4%" delta="2.1 points better" tone="success" />
      </div>

      <Card title="Visits over time" icon={Activity} takeaway="Green shows how many of those visits turned into an enquiry.">
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
                  {d.sessions} visits · {d.conversions} forms sent
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-primary/70" /> Visits
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[hsl(var(--success)/0.5)]" /> Forms sent
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Most-visited pages" icon={Globe} takeaway="The pages doing the most work for you right now.">
          <div className="grid grid-cols-[2fr_0.7fr_0.7fr_0.7fr] px-4 h-8 items-center text-[11px] text-muted-foreground font-medium border-b-hairline bg-surface/50">
            <div>Page</div>
            <div className="text-right">Views</div>
            <div className="text-right">Left straight away</div>
            <div className="text-right">Enquiries</div>
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

        <Card title="Where visitors come from" icon={TrendingUp} takeaway="Which marketing brings the most people — and the most money.">
          <div className="p-4 space-y-3">
            {channelBreakdown.map((c) => (
              <div key={c.channel}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{c.channel}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {c.sessions} visits · {c.conversions} enquiries · £{c.revenue.toLocaleString()}
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
        <Card title="Phone vs computer" icon={MonitorSmartphone} takeaway="Most people browse on their phone, so forms need to be short.">
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

        <Card title="Where they are" icon={MapPin} takeaway="The towns and areas your enquiries come from.">
          <div className="p-4 space-y-2">
            {geoSplit.map((g) => (
              <div key={g.place} className="flex items-center justify-between text-xs">
                <span>{g.place}</span>
                <span className="text-muted-foreground tabular-nums">
                  {g.sessions} visits · {g.conversions} enquiries
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="From visit to enquiry" icon={Layers} takeaway="How many people make it through each step.">
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

      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Card title="How each channel does on your forms" icon={Layers} takeaway="Some channels send lots of visits but few enquiries — that is where to look first.">
          <div className="grid grid-cols-[1.1fr_0.7fr_0.6fr_0.6fr_0.6fr_0.95fr_0.8fr] px-4 h-8 items-center text-[11px] text-muted-foreground font-medium border-b-hairline bg-surface/50">
            <div>Came from</div>
            <div className="text-right">Visits</div>
            <div className="text-right">Saw form</div>
            <div className="text-right">Started</div>
            <div className="text-right">Sent it</div>
            <div className="text-right">Sent after seeing</div>
            <div className="text-right">Time to send</div>
          </div>
          {formBehaviourByChannel.map((c) => {
            const rate = (c.submits / c.formViews) * 100;
            return (
              <div
                key={c.channel}
                className="grid grid-cols-[1.1fr_0.7fr_0.6fr_0.6fr_0.6fr_0.95fr_0.8fr] px-4 h-9 items-center text-xs border-b-hairline last:border-b-0 hover:bg-surface-hover"
              >
                <div className="truncate">{c.channel}</div>
                <div className="text-right tabular-nums text-muted-foreground">{c.sessions}</div>
                <div className="text-right tabular-nums text-muted-foreground">{c.formViews}</div>
                <div className="text-right tabular-nums text-muted-foreground">{c.formStarts}</div>
                <div className="text-right tabular-nums font-medium">{c.submits}</div>
                <div className="text-right tabular-nums">
                  <span className={rate >= 15 ? "text-[hsl(var(--success))]" : "text-muted-foreground"}>
                    {rate.toFixed(1)}%
                  </span>
                </div>
                <div className="text-right tabular-nums text-muted-foreground">{c.avgTimeToSubmit}</div>
              </div>
            );
          })}
        </Card>

        <Card title="Where people give up on the form" icon={Activity} takeaway="The questions people abandon. Removing or simplifying them wins you more enquiries.">
          <div className="p-4 space-y-3">
            {fieldDropoff.map((f) => {
              const pct = (f.completes / fieldDropoff[0].completes) * 100;
              return (
                <div key={f.field}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{f.field}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {f.completes} answered · {f.dropoff}% gave up here
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface overflow-hidden flex">
                    <div className="h-full rounded-l-full bg-primary/70" style={{ width: `${pct}%` }} />
                    <div
                      className="h-full bg-[hsl(var(--danger,var(--destructive))/0.5)]"
                      style={{ width: `${(f.dropoff / 100) * pct}%` }}
                    />
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
  takeaway,
  children,
}: {
  title: string;
  icon: React.ElementType;
  takeaway?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-hairline rounded-lg bg-card">
      <div className="px-4 py-2.5 border-b-hairline">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {takeaway && <p className="text-xs text-muted-foreground mt-0.5">{takeaway}</p>}
      </div>
      {children}
    </div>
  );
}
