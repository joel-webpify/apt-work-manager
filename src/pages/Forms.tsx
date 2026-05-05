import { useState } from "react";
import { PageHeader, PageBody, Btn, Pill } from "@/components/layout/PageShell";
import { Plus, FileText, ArrowRight } from "lucide-react";
import { forms, formSubmissions } from "@/data/mockData";
import { ProductsTab } from "@/components/forms/ProductsTab";

type Tab = "forms" | "products";

export default function Forms() {
  const [tab, setTab] = useState<Tab>("forms");

  return (
    <>
      <PageHeader
        title="Forms & quote requests"
        description="Embed forms on your website, capture leads, and manage your service catalogue"
        actions={
          tab === "forms" ? (
            <Btn variant="primary">
              <Plus className="w-3.5 h-3.5" /> New form
            </Btn>
          ) : null
        }
      />
      <PageBody>
        <div className="flex items-center gap-1 border-b-hairline mb-5 -mt-2">
          {([
            { id: "forms", label: "Forms" },
            { id: "products", label: "Products & services" },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`h-9 px-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "forms" && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {forms.map((f) => (
                <div
                  key={f.id}
                  className="border-hairline rounded-lg bg-card p-4 hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center">
                      <FileText
                        className="w-4 h-4 text-muted-foreground"
                        strokeWidth={1.75}
                      />
                    </div>
                    <Pill tone="success">Live</Pill>
                  </div>
                  <div className="text-sm font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {f.trade}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t-hairline">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Submissions
                      </div>
                      <div className="text-base font-medium tabular-nums mt-0.5">
                        {f.submissions}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Conversion
                      </div>
                      <div className="text-base font-medium tabular-nums mt-0.5">
                        {f.conversionRate}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-hairline rounded-lg bg-card">
              <div className="px-4 h-11 flex items-center justify-between border-b-hairline">
                <span className="text-sm font-medium">Recent submissions</span>
                <span className="text-xs text-muted-foreground">
                  {formSubmissions.length} this week
                </span>
              </div>
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1.2fr_auto] px-4 h-9 items-center text-xs text-muted-foreground font-medium border-b-hairline bg-surface/50">
                <div>Contact</div>
                <div>Service</div>
                <div>Postcode</div>
                <div>Date</div>
                <div></div>
              </div>
              {formSubmissions.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_1.2fr_auto] px-4 h-11 items-center text-sm border-b-hairline last:border-b-0 hover:bg-surface-hover transition-colors"
                >
                  <div className="font-medium">{s.contact}</div>
                  <div className="text-muted-foreground">{s.service}</div>
                  <div className="text-muted-foreground tabular-nums">
                    {s.postcode}
                  </div>
                  <div className="text-muted-foreground tabular-nums">
                    {s.date}
                  </div>
                  <Btn className="h-7">
                    Create job <ArrowRight className="w-3 h-3" />
                  </Btn>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "products" && <ProductsTab />}
      </PageBody>
    </>
  );
}
