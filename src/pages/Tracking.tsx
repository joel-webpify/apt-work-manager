import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Code, Globe, Tag } from "lucide-react";
import { trackingEvents } from "@/data/mockData";

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

export default function Tracking() {
  return (
    <>
      <PageHeader
        title="Tracking"
        description="Install tracking on your website to capture leads and attribution"
      />
      <PageBody>
        <div className="grid grid-cols-3 gap-3 mb-6">
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
                <div className="mt-3 bg-surface rounded-md p-2.5 text-xs font-mono text-muted-foreground border-hairline overflow-hidden">
                  &lt;script src="//track.servicecrm.io/t.js"&gt;&lt;/script&gt;
                </div>
              ) : (
                <div className="mt-3">
                  <Btn className="w-full justify-center">{m.installed ? "Manage" : "Install"}</Btn>
                </div>
              )}
              {m.id === "js" && (
                <div className="mt-2">
                  <Btn className="w-full justify-center">Copy snippet</Btn>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-hairline rounded-lg bg-card">
          <div className="px-4 h-11 flex items-center justify-between border-b-hairline">
            <span className="text-sm font-medium">Live event feed</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              Receiving events
            </span>
          </div>
          <div className="grid grid-cols-[1.2fr_2fr_1.5fr_0.6fr] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
            <div>Event</div><div>Page</div><div>UTM source</div><div className="text-right">Time</div>
          </div>
          {trackingEvents.map((e) => (
            <div key={e.id} className="grid grid-cols-[1.2fr_2fr_1.5fr_0.6fr] px-4 h-10 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover">
              <div className="font-mono text-xs">{e.event}</div>
              <div className="text-muted-foreground truncate">{e.page}</div>
              <div className="text-muted-foreground truncate">{e.utm}</div>
              <div className="text-right text-muted-foreground tabular-nums">{e.time}</div>
            </div>
          ))}
        </div>
      </PageBody>
    </>
  );
}
