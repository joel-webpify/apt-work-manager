import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Btn } from "@/components/layout/PageShell";
import { AdPreview } from "./AdPreview";
import {
  CTAS,
  INTEREST_SUGGESTIONS,
  OBJECTIVES,
  PLACEMENTS,
  SAVED_AUDIENCES,
  estimateReach,
  fmtInt,
  fmtMoney,
  objectiveMeta,
  type AdPlacement,
  type AdPlatform,
  type Campaign,
  type CreativeFormat,
} from "@/lib/adsStore";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  Facebook,
  Image as ImageIcon,
  Instagram,
  LayoutGrid,
  Target,
  Users,
  Video,
  Wallet,
} from "lucide-react";

const steps = [
  { id: 0, label: "Goal", Icon: Target },
  { id: 1, label: "Budget & dates", Icon: Wallet },
  { id: 2, label: "Who sees it", Icon: Users },
  { id: 3, label: "Where it shows", Icon: LayoutGrid },
  { id: 4, label: "The ad", Icon: ImageIcon },
  { id: 5, label: "Review", Icon: Check },
];

function toDateInput(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export function CreateAdWizard(props: {
  open: boolean;
  campaign: Campaign | null;
  onClose: () => void;
  onSaveDraft: (c: Campaign) => void;
  onPublish: (c: Campaign) => void;
}) {
  if (!props.campaign) return null;
  return <WizardInner key={props.campaign.id} {...props} campaign={props.campaign} />;
}

function WizardInner({
  open,
  campaign,
  onClose,
  onSaveDraft,
  onPublish,
}: {
  open: boolean;
  campaign: Campaign;
  onClose: () => void;
  onSaveDraft: (c: Campaign) => void;
  onPublish: (c: Campaign) => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Campaign>(campaign);

  const adSet = draft.adSets[0];

  const ad = adSet.ads[0];
  const meta = objectiveMeta(draft.objective);

  const patch = (p: Partial<Campaign>) => setDraft({ ...draft, ...p });
  const patchAdSet = (p: Partial<typeof adSet>) =>
    setDraft({ ...draft, adSets: [{ ...adSet, ...p }, ...draft.adSets.slice(1)] });
  const patchAudience = (p: Partial<typeof adSet.audience>) =>
    patchAdSet({ audience: { ...adSet.audience, ...p } });
  const patchAd = (p: Partial<typeof ad>) =>
    patchAdSet({ ads: [{ ...ad, ...p }, ...adSet.ads.slice(1)] });
  const patchCreative = (p: Partial<typeof ad.creative>) =>
    patchAd({ creative: { ...ad.creative, ...p } });

  const reach = useMemo(
    () => estimateReach(adSet.audience, draft.platforms, draft.budget),
    [adSet.audience, draft.platforms, draft.budget],
  );

  const previewPlacement: AdPlacement =
    adSet.placements.find((p) => p === "ig_stories" || p === "ig_reels") && adSet.placements.length === 1
      ? "ig_stories"
      : adSet.placements.includes("fb_feed")
        ? "fb_feed"
        : adSet.placements[0] ?? "fb_feed";

  const canPublish =
    draft.name.trim() && ad.creative.primaryText.trim() && ad.creative.headline.trim() && adSet.placements.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        <div className="flex h-[640px]">
          {/* Steps rail */}
          <aside className="w-52 shrink-0 border-r-hairline bg-surface/40 p-3 flex flex-col">
            <div className="px-2 py-1.5">
              <div className="text-sm font-medium">New ad campaign</div>
              <div className="text-xs text-muted-foreground mt-0.5">Facebook & Instagram</div>
            </div>
            <div className="mt-3 space-y-0.5">
              {steps.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  className={cn(
                    "w-full text-left px-2 h-8 rounded-md text-sm inline-flex items-center gap-2 transition-colors",
                    step === s.id
                      ? "bg-card border-hairline font-medium"
                      : "text-muted-foreground hover:bg-surface-hover",
                  )}
                >
                  <s.Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-auto px-2 text-xs text-muted-foreground leading-relaxed">
              Nothing goes live until you press <span className="text-foreground">Publish</span>.
            </div>
          </aside>

          {/* Body */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 overflow-auto p-6">
              {step === 0 && (
                <Section
                  title="What do you want this ad to do?"
                  hint="This decides who Facebook and Instagram show your ad to."
                >
                  <div className="grid grid-cols-2 gap-2">
                    {OBJECTIVES.map((o) => (
                      <button
                        key={o.id}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            objective: o.id,
                            adSets: [{ ...adSet, optimisationGoal: o.goal }, ...draft.adSets.slice(1)],
                          })
                        }
                        className={cn(
                          "text-left p-3 rounded-lg border-hairline transition-colors",
                          draft.objective === o.id ? "bg-primary/5 border-primary" : "bg-card hover:bg-surface-hover",
                        )}
                      >
                        <div className="text-sm font-medium">{o.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{o.blurb}</div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Label className="text-xs text-muted-foreground">Campaign name</Label>
                    <Input
                      className="mt-1.5"
                      placeholder="e.g. Spring kitchen promo"
                      value={draft.name}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Run on</Label>
                    <div className="flex gap-2 mt-1.5">
                      {(
                        [
                          { id: "facebook", label: "Facebook", Icon: Facebook },
                          { id: "instagram", label: "Instagram", Icon: Instagram },
                        ] as { id: AdPlatform; label: string; Icon: typeof Facebook }[]
                      ).map(({ id, label, Icon }) => {
                        const on = draft.platforms.includes(id);
                        return (
                          <button
                            key={id}
                            onClick={() =>
                              patch({
                                platforms: on
                                  ? draft.platforms.filter((p) => p !== id)
                                  : [...draft.platforms, id],
                              })
                            }
                            className={cn(
                              "h-8 px-3 rounded-md border-hairline text-sm inline-flex items-center gap-1.5",
                              on ? "bg-primary text-primary-foreground" : "bg-card hover:bg-surface-hover",
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Section>
              )}

              {step === 1 && (
                <Section title="How much do you want to spend?" hint="You can change or pause this at any time.">
                  <div className="flex gap-2">
                    {(["daily", "lifetime"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => patch({ budgetType: t, budget: t === "daily" ? 25 : 500 })}
                        className={cn(
                          "flex-1 p-3 rounded-lg border-hairline text-left transition-colors",
                          draft.budgetType === t ? "bg-primary/5 border-primary" : "bg-card hover:bg-surface-hover",
                        )}
                      >
                        <div className="text-sm font-medium">{t === "daily" ? "Daily budget" : "Total budget"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t === "daily" ? "Spend roughly this much each day." : "Spread this amount over the dates you pick."}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <Label className="text-xs text-muted-foreground">
                        {draft.budgetType === "daily" ? "Per day" : "Total"}
                      </Label>
                      <span className="text-lg font-medium tabular-nums">{fmtMoney(draft.budget)}</span>
                    </div>
                    <Slider
                      className="mt-3"
                      min={draft.budgetType === "daily" ? 5 : 100}
                      max={draft.budgetType === "daily" ? 300 : 5000}
                      step={draft.budgetType === "daily" ? 5 : 50}
                      value={[draft.budget]}
                      onValueChange={([v]) => patch({ budget: v })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start date</Label>
                      <Input
                        type="date"
                        className="mt-1.5"
                        value={toDateInput(draft.startDate)}
                        onChange={(e) => patch({ startDate: new Date(e.target.value).toISOString() })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End date (optional)</Label>
                      <Input
                        type="date"
                        className="mt-1.5"
                        value={toDateInput(draft.endDate)}
                        onChange={(e) =>
                          patch({ endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                        }
                      />
                    </div>
                  </div>

                  <Callout>
                    At {fmtMoney(draft.budget)} {draft.budgetType === "daily" ? "a day" : "in total"} you should reach around{" "}
                    <strong className="text-foreground">
                      {fmtInt(reach.dailyLow)}–{fmtInt(reach.dailyHigh)}
                    </strong>{" "}
                    people a day.
                  </Callout>
                </Section>
              )}

              {step === 2 && (
                <Section title="Who should see it?" hint="Narrow enough to be relevant, wide enough to be worth spending on.">
                  <div>
                    <Label className="text-xs text-muted-foreground">Saved audience</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Chip
                        active={!adSet.audience.savedAudience}
                        onClick={() => patchAudience({ savedAudience: undefined })}
                      >
                        Build a new one
                      </Chip>
                      {SAVED_AUDIENCES.map((a) => (
                        <Chip
                          key={a}
                          active={adSet.audience.savedAudience === a}
                          onClick={() => patchAudience({ savedAudience: a })}
                        >
                          {a}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Location</Label>
                      <Input
                        className="mt-1.5"
                        value={adSet.audience.locations.join(", ")}
                        onChange={(e) => patchAudience({ locations: e.target.value.split(",").map((s) => s.trim()) })}
                        placeholder="Town, city or postcode"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Radius — {adSet.audience.radiusMiles} miles
                      </Label>
                      <Slider
                        className="mt-4"
                        min={1}
                        max={60}
                        step={1}
                        value={[adSet.audience.radiusMiles]}
                        onValueChange={([v]) => patchAudience({ radiusMiles: v })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Age — {adSet.audience.ageMin} to {adSet.audience.ageMax}
                      </Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Input
                          type="number"
                          min={18}
                          max={64}
                          value={adSet.audience.ageMin}
                          onChange={(e) => patchAudience({ ageMin: Number(e.target.value) })}
                        />
                        <span className="text-muted-foreground text-sm">–</span>
                        <Input
                          type="number"
                          min={19}
                          max={65}
                          value={adSet.audience.ageMax}
                          onChange={(e) => patchAudience({ ageMax: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Gender</Label>
                      <div className="flex gap-1.5 mt-1.5">
                        {(["all", "women", "men"] as const).map((g) => (
                          <Chip key={g} active={adSet.audience.genders === g} onClick={() => patchAudience({ genders: g })}>
                            {g === "all" ? "All" : g === "women" ? "Women" : "Men"}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Interests & behaviours</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {INTEREST_SUGGESTIONS.map((i) => {
                        const on = adSet.audience.interests.includes(i);
                        return (
                          <Chip
                            key={i}
                            active={on}
                            onClick={() =>
                              patchAudience({
                                interests: on
                                  ? adSet.audience.interests.filter((x) => x !== i)
                                  : [...adSet.audience.interests, i],
                              })
                            }
                          >
                            {i}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>

                  <Callout>
                    Audience size roughly <strong className="text-foreground">{fmtInt(reach.pool)}</strong> people —{" "}
                    {reach.pool < 12000
                      ? "quite narrow, your ad may run out of people quickly."
                      : reach.pool > 250000
                        ? "very broad, consider adding an interest or shrinking the radius."
                        : "a good size for local work."}
                  </Callout>
                </Section>
              )}

              {step === 3 && (
                <Section title="Where should it show?" hint="Leave all on unless you have a reason not to — it usually gets cheaper results.">
                  <div className="space-y-1.5">
                    {PLACEMENTS.filter(
                      (p) => p.platform === "both" || draft.platforms.includes(p.platform as AdPlatform),
                    ).map((p) => {
                      const on = adSet.placements.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-lg border-hairline bg-card"
                        >
                          <div>
                            <div className="text-sm">{p.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.id === "ig_stories" || p.id === "ig_reels"
                                ? "Full screen, works best with vertical video"
                                : p.id === "audience_network"
                                  ? "Cheap extra reach outside Facebook and Instagram"
                                  : "Appears between normal posts"}
                            </div>
                          </div>
                          <Switch
                            checked={on}
                            onCheckedChange={(v) =>
                              patchAdSet({
                                placements: v
                                  ? [...adSet.placements, p.id]
                                  : adSet.placements.filter((x) => x !== p.id),
                              })
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Ad set name</Label>
                    <Input
                      className="mt-1.5"
                      value={adSet.name}
                      onChange={(e) => patchAdSet({ name: e.target.value })}
                    />
                  </div>
                </Section>
              )}

              {step === 4 && (
                <div className="grid grid-cols-[1fr_260px] gap-6">
                  <Section title="Build the ad" hint="This is exactly what people will see in their feed.">
                    <div>
                      <Label className="text-xs text-muted-foreground">Format</Label>
                      <div className="flex gap-1.5 mt-1.5">
                        {(
                          [
                            { id: "single_image", label: "Single image", Icon: ImageIcon },
                            { id: "video", label: "Video", Icon: Video },
                            { id: "carousel", label: "Carousel", Icon: LayoutGrid },
                          ] as { id: CreativeFormat; label: string; Icon: typeof ImageIcon }[]
                        ).map(({ id, label, Icon }) => (
                          <Chip key={id} active={ad.creative.format === id} onClick={() => patchCreative({ format: id })}>
                            <Icon className="w-3 h-3" />
                            {label}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Media URL (optional)</Label>
                      <Input
                        className="mt-1.5"
                        placeholder="Paste an image or video link"
                        value={ad.creative.mediaUrls[0] ?? ""}
                        onChange={(e) => patchCreative({ mediaUrls: e.target.value ? [e.target.value] : [] })}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Main text</Label>
                      <Textarea
                        className="mt-1.5 min-h-[100px]"
                        placeholder="What's the offer, and why should someone care?"
                        value={ad.creative.primaryText}
                        onChange={(e) => patchCreative({ primaryText: e.target.value })}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {ad.creative.primaryText.length}/125 shown before "See more"
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Headline</Label>
                        <Input
                          className="mt-1.5"
                          placeholder="Free kitchen design visit"
                          value={ad.creative.headline}
                          onChange={(e) => patchCreative({ headline: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <Input
                          className="mt-1.5"
                          placeholder="10% off in April"
                          value={ad.creative.description}
                          onChange={(e) => patchCreative({ description: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Button</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {CTAS.map((c) => (
                            <Chip key={c} active={ad.creative.cta === c} onClick={() => patchCreative({ cta: c })}>
                              {c}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Where the button goes</Label>
                        <Input
                          className="mt-1.5"
                          placeholder="https://yourwebsite.com/quote"
                          value={ad.creative.destinationUrl}
                          onChange={(e) => patchCreative({ destinationUrl: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Ad name</Label>
                      <Input className="mt-1.5" value={ad.name} onChange={(e) => patchAd({ name: e.target.value })} />
                    </div>
                  </Section>

                  <div className="pt-1">
                    <div className="text-xs text-muted-foreground mb-2">Preview</div>
                    <AdPreview creative={ad.creative} placement={previewPlacement} />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="grid grid-cols-[1fr_260px] gap-6">
                  <Section title="Check it over" hint="Have a last look, then publish.">
                    <div className="border-hairline rounded-lg bg-card divide-y divide-border">
                      <Row label="Goal" value={meta.label} onEdit={() => setStep(0)} />
                      <Row label="Campaign" value={draft.name || "Untitled"} onEdit={() => setStep(0)} />
                      <Row
                        label="Platforms"
                        value={draft.platforms.map((p) => (p === "facebook" ? "Facebook" : "Instagram")).join(" · ") || "—"}
                        onEdit={() => setStep(0)}
                      />
                      <Row
                        label="Budget"
                        value={`${fmtMoney(draft.budget)} ${draft.budgetType === "daily" ? "per day" : "total"}`}
                        onEdit={() => setStep(1)}
                      />
                      <Row
                        label="Dates"
                        value={`${new Date(draft.startDate).toLocaleDateString("en-GB")}${
                          draft.endDate ? ` → ${new Date(draft.endDate).toLocaleDateString("en-GB")}` : " → ongoing"
                        }`}
                        onEdit={() => setStep(1)}
                      />
                      <Row
                        label="Audience"
                        value={
                          adSet.audience.savedAudience ??
                          `${adSet.audience.locations.join(", ")} · ${adSet.audience.radiusMiles} mi · ${adSet.audience.ageMin}–${adSet.audience.ageMax}`
                        }
                        onEdit={() => setStep(2)}
                      />
                      <Row
                        label="Placements"
                        value={adSet.placements
                          .map((p) => PLACEMENTS.find((x) => x.id === p)?.label)
                          .filter(Boolean)
                          .join(", ")}
                        onEdit={() => setStep(3)}
                      />
                      <Row label="Button" value={ad.creative.cta} onEdit={() => setStep(4)} />
                    </div>
                    <Callout>
                      Expected reach {fmtInt(reach.dailyLow)}–{fmtInt(reach.dailyHigh)} people a day, measured on{" "}
                      {meta.resultLabel.toLowerCase()}.
                    </Callout>
                    {!canPublish && (
                      <div className="text-xs text-destructive">
                        Add a campaign name, main text, a headline and at least one placement before publishing.
                      </div>
                    )}
                  </Section>
                  <div className="pt-1">
                    <div className="text-xs text-muted-foreground mb-2">Preview</div>
                    <AdPreview creative={ad.creative} placement={previewPlacement} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t-hairline px-6 py-3 flex items-center justify-between">
              <Btn variant="ghost" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>
                {step === 0 ? "Cancel" : (<><ChevronLeft className="w-3.5 h-3.5" /> Back</>)}
              </Btn>
              <div className="flex items-center gap-2">
                <Btn variant="secondary" onClick={() => onSaveDraft(draft)}>Save as draft</Btn>
                {step < 5 ? (
                  <Btn variant="primary" onClick={() => setStep(step + 1)}>Continue</Btn>
                ) : (
                  <Btn variant="primary" disabled={!canPublish} onClick={() => canPublish && onPublish(draft)}>
                    Publish campaign
                  </Btn>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 px-2.5 rounded-full border-hairline text-xs inline-flex items-center gap-1 transition-colors",
        active ? "bg-foreground text-background border-transparent" : "bg-card text-muted-foreground hover:bg-surface-hover",
      )}
    >
      {children}
    </button>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return <div className="border-hairline rounded-lg bg-surface p-3 text-xs text-muted-foreground">{children}</div>;
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="text-sm flex-1 min-w-0 truncate">{value || "—"}</span>
      <button onClick={onEdit} className="text-xs text-primary hover:underline shrink-0">
        Edit
      </button>
    </div>
  );
}
