import { useState } from "react";
import { PageHeader, PageBody } from "@/components/layout/PageShell";
import { ProductsTab } from "@/components/forms/ProductsTab";
import ChannelGroupsTab from "@/components/settings/ChannelGroupsTab";

type Tab = "products" | "channels";

export default function Settings() {
  const [tab, setTab] = useState<Tab>("products");

  const tabs: { id: Tab; label: string }[] = [
    { id: "products", label: "Products & services" },
    { id: "channels", label: "Channel grouping" },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your catalogue, team and workspace preferences"
      />
      <PageBody>
        <div className="flex items-center gap-1 border-b-hairline mb-5 -mt-2">
          {tabs.map((t) => (
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

        {tab === "products" && <ProductsTab />}
        {tab === "channels" && <ChannelGroupsTab />}
      </PageBody>
    </>
  );
}
