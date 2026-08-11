import { useMemo, useState } from "react";
import { PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { AdPreview } from "./AdPreview";
import { CreateAdWizard } from "./CreateAdWizard";
import {
  PLACEMENTS,
  adSetMetrics,
  campaignMetrics,
  deleteCampaign,
  duplicateCampaign,
  fmtInt,
  fmtMoney,
  newCampaignDraft,
  objectiveMeta,
  setAdSetStatus,
  setAdStatus,
  setCampaignStatus,
  statusLabel,
  statusTone,
  upsertCampaign,
  useCampaigns,
  type AdStatus,
  type Campaign,
} from "@/lib/adsStore";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Facebook,
  Instagram,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";

const filters: { id: "all" | AdStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "in_review", label: "In review" },
  { id: "paused", label: "Paused" },
  { id: "draft", label: "Drafts" },
  { id: "completed", label: "Finished" },
];

export function AdsManager() {
  const campaigns = useCampaigns();
  const [filter, setFilter] = useState<"all" | AdStatus>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [campaigns[0]?.id ?? ""]: true });
  const [wizard, setWizard] = useState<Campaign | null>(null);
  const [previewAd, setPreviewAd] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter)),
    [campaigns, filter],
  );

  const totals = useMemo(() => {
    const live = campaigns.filter((c) => c.status === "active");
    const m = live.map(campaignMetrics).reduce(
      (a, b) => ({
        spend: a.spend + b.spend,
        impressions: a.impressions + b.impressions,
        reach: a.reach + b.reach,
        clicks: a.clicks + b.clicks,
        results: a.results + b.results,
      }),
      { spend: 0, impressions: 0, reach: 0, clicks: 0, results: 0 },
    );
    const dailyBudget = live.reduce((a, c) => a + (c.budgetType === "daily" ? c.budget : 0), 0);
    return { ...m, dailyBudget, liveCount: live.length };
  }, [campaigns]);

  const openNew = () => setWizard(newCampaignDraft());

  return (
    <>
      <PageBody>
        <div className="space-y-4">
          {/* Account summary */}
          <div className="grid grid-cols-5 gap-3">
            <Kpi label="Live campaigns" value={String(totals.liveCount)} />
            <Kpi label="Spent so far" value={fmtMoney(totals.spend)} />
            <Kpi label="Budget per day" value={fmtMoney(totals.dailyBudget)} />
            <Kpi label="Results" value={fmtInt(totals.results)} />
            <Kpi
              label="Cost per result"
              value={totals.results ? fmtMoney(Number((totals.spend / totals.results).toFixed(2))) : "—"}
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 flex-wrap">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "h-7 px-3 text-xs rounded-full border-hairline transition-colors",
                    filter === f.id
                      ? "bg-foreground text-background border-transparent"
                      : "bg-card text-muted-foreground hover:bg-surface-hover",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Btn variant="primary" onClick={openNew}>
              <Plus className="w-3.5 h-3.5" /> Create ad
            </Btn>
          </div>

          {/* Campaign / ad set / ad tree */}
          <div className="border-hairline rounded-lg bg-card overflow-hidden">
            <div className="grid grid-cols-[minmax(0,2.2fr)_repeat(6,minmax(0,1fr))_88px] gap-2 px-4 py-2 text-xs text-muted-foreground border-b-hairline">
              <div>Campaign · ad set · ad</div>
              <div className="text-right">Budget</div>
              <div className="text-right">Spent</div>
              <div className="text-right">Seen</div>
              <div className="text-right">Reached</div>
              <div className="text-right">Clicks</div>
              <div className="text-right">Results</div>
              <div />
            </div>

            {visible.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-sm text-muted-foreground">No campaigns here yet.</p>
                <Btn variant="primary" className="mt-3 mx-auto" onClick={openNew}>
                  <Plus className="w-3.5 h-3.5" /> Create your first ad
                </Btn>
              </div>
            )}

            {visible.map((c) => {
              const m = campaignMetrics(c);
              const open = !!expanded[c.id];
              const meta = objectiveMeta(c.objective);
              return (
                <div key={c.id} className="border-b-hairline last:border-0">
                  {/* Campaign row */}
                  <div className="grid grid-cols-[minmax(0,2.2fr)_repeat(6,minmax(0,1fr))_88px] gap-2 px-4 py-3 items-center hover:bg-surface-hover/40">
                    <div className="min-w-0 flex items-start gap-2">
                      <button
                        onClick={() => setExpanded({ ...expanded, [c.id]: !open })}
                        className="mt-0.5 text-muted-foreground hover:text-foreground"
                        aria-label={open ? "Collapse campaign" : "Expand campaign"}
                      >
                        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="min-w-0">
                        <button
                          onClick={() => setWizard(c)}
                          className="text-sm font-medium truncate hover:underline text-left"
                        >
                          {c.name || "Untitled campaign"}
                        </button>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Pill tone={statusTone[c.status]}>{statusLabel[c.status]}</Pill>
                          <span className="text-xs text-muted-foreground">{meta.label}</span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            {c.platforms.includes("facebook") && <Facebook className="w-3 h-3" />}
                            {c.platforms.includes("instagram") && <Instagram className="w-3 h-3" />}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Num>
                      {fmtMoney(c.budget)}
                      <span className="block text-[10px] text-muted-foreground">
                        {c.budgetType === "daily" ? "per day" : "total"}
                      </span>
                    </Num>
                    <Num>{m.spend ? fmtMoney(m.spend) : "—"}</Num>
                    <Num>{m.impressions ? fmtInt(m.impressions) : "—"}</Num>
                    <Num>{m.reach ? fmtInt(m.reach) : "—"}</Num>
                    <Num>{m.clicks ? fmtInt(m.clicks) : "—"}</Num>
                    <Num>{m.results ? fmtInt(m.results) : "—"}</Num>
                    <div className="flex items-center justify-end gap-0.5">
                      {(c.status === "active" || c.status === "paused") && (
                        <IconBtn
                          label={c.status === "active" ? "Pause campaign" : "Resume campaign"}
                          onClick={() => setCampaignStatus(c.id, c.status === "active" ? "paused" : "active")}
                        >
                          {c.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </IconBtn>
                      )}
                      <IconBtn label="Duplicate campaign" onClick={() => duplicateCampaign(c.id)}>
                        <Copy className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn label="Delete campaign" onClick={() => deleteCampaign(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconBtn>
                    </div>
                  </div>

                  {/* Ad sets */}
                  {open &&
                    c.adSets.map((s) => {
                      const sm = adSetMetrics(s);
                      return (
                        <div key={s.id}>
                          <div className="grid grid-cols-[minmax(0,2.2fr)_repeat(6,minmax(0,1fr))_88px] gap-2 px-4 py-2.5 items-center bg-surface/40 border-t-hairline">
                            <div className="pl-6 min-w-0">
                              <div className="text-sm truncate">{s.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {s.audience.savedAudience ??
                                  `${s.audience.locations.join(", ")} · ${s.audience.radiusMiles} mi · ${s.audience.ageMin}–${s.audience.ageMax}`}
                                {" · "}
                                {s.placements
                                  .map((p) => PLACEMENTS.find((x) => x.id === p)?.label)
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </div>
                            <Num>
                              <Pill tone={statusTone[s.status]}>{statusLabel[s.status]}</Pill>
                            </Num>
                            <Num>{sm.spend ? fmtMoney(sm.spend) : "—"}</Num>
                            <Num>{sm.impressions ? fmtInt(sm.impressions) : "—"}</Num>
                            <Num>{sm.reach ? fmtInt(sm.reach) : "—"}</Num>
                            <Num>{sm.clicks ? fmtInt(sm.clicks) : "—"}</Num>
                            <Num>{sm.results ? fmtInt(sm.results) : "—"}</Num>
                            <div className="flex items-center justify-end">
                              {(s.status === "active" || s.status === "paused") && (
                                <IconBtn
                                  label={s.status === "active" ? "Pause ad set" : "Resume ad set"}
                                  onClick={() => setAdSetStatus(c.id, s.id, s.status === "active" ? "paused" : "active")}
                                >
                                  {s.status === "active" ? (
                                    <Pause className="w-3.5 h-3.5" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5" />
                                  )}
                                </IconBtn>
                              )}
                            </div>
                          </div>

                          {/* Ads */}
                          {s.ads.map((a) => (
                            <div key={a.id}>
                              <div className="grid grid-cols-[minmax(0,2.2fr)_repeat(6,minmax(0,1fr))_88px] gap-2 px-4 py-2.5 items-center border-t-hairline">
                                <div className="pl-12 min-w-0">
                                  <button
                                    onClick={() => setPreviewAd(previewAd === a.id ? null : a.id)}
                                    className="text-sm truncate hover:underline text-left"
                                  >
                                    {a.name}
                                  </button>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {a.creative.headline || "No headline yet"} · {a.creative.cta}
                                  </div>
                                </div>
                                <Num>
                                  <Pill tone={statusTone[a.status]}>{statusLabel[a.status]}</Pill>
                                </Num>
                                <Num>{a.metrics ? fmtMoney(a.metrics.spend) : "—"}</Num>
                                <Num>{a.metrics ? fmtInt(a.metrics.impressions) : "—"}</Num>
                                <Num>{a.metrics ? fmtInt(a.metrics.reach) : "—"}</Num>
                                <Num>{a.metrics ? fmtInt(a.metrics.clicks) : "—"}</Num>
                                <Num>{a.metrics ? fmtInt(a.metrics.results) : "—"}</Num>
                                <div className="flex items-center justify-end">
                                  {(a.status === "active" || a.status === "paused") && (
                                    <IconBtn
                                      label={a.status === "active" ? "Pause ad" : "Resume ad"}
                                      onClick={() =>
                                        setAdStatus(c.id, s.id, a.id, a.status === "active" ? "paused" : "active")
                                      }
                                    >
                                      {a.status === "active" ? (
                                        <Pause className="w-3.5 h-3.5" />
                                      ) : (
                                        <Play className="w-3.5 h-3.5" />
                                      )}
                                    </IconBtn>
                                  )}
                                </div>
                              </div>
                              {previewAd === a.id && (
                                <div className="px-4 py-4 border-t-hairline bg-surface/30 flex gap-6">
                                  <AdPreview
                                    creative={a.creative}
                                    placement={s.placements.includes("fb_feed") ? "fb_feed" : s.placements[0] ?? "fb_feed"}
                                  />
                                  {s.placements.some((p) => p === "ig_stories" || p === "ig_reels") && (
                                    <AdPreview creative={a.creative} placement="ig_stories" />
                                  )}
                                  <div className="flex-1 min-w-0 text-sm space-y-2">
                                    <div className="text-xs text-muted-foreground">Main text</div>
                                    <p className="whitespace-pre-wrap">{a.creative.primaryText || "—"}</p>
                                    <Btn variant="secondary" onClick={() => setWizard(c)}>Edit this ad</Btn>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Spend, reach and results are pulled from your connected Facebook and Instagram ad account.
          </p>
        </div>
      </PageBody>

      <CreateAdWizard
        open={!!wizard}
        campaign={wizard}
        onClose={() => setWizard(null)}
        onSaveDraft={(c) => {
          upsertCampaign({ ...c, status: c.status === "active" ? "active" : "draft", updatedAt: new Date().toISOString() });
          setWizard(null);
        }}
        onPublish={(c) => {
          upsertCampaign({
            ...c,
            status: "in_review",
            updatedAt: new Date().toISOString(),
            adSets: c.adSets.map((s) => ({
              ...s,
              status: "in_review",
              ads: s.ads.map((a) => ({ ...a, status: "in_review" as AdStatus })),
            })),
          });
          setExpanded((e) => ({ ...e, [c.id]: true }));
          setWizard(null);
        }}
      />
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-hairline rounded-lg bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-medium tracking-tight mt-1">{value}</div>
    </div>
  );
}

function Num({ children }: { children: React.ReactNode }) {
  return <div className="text-right text-sm tabular-nums">{children}</div>;
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-7 h-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover"
    >
      {children}
    </button>
  );
}
