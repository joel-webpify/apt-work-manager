import { useSearchParams } from "react-router-dom";
import { PageHeader, PageBody } from "@/components/layout/PageShell";
import { ProductsTab } from "@/components/forms/ProductsTab";
import ChannelGroupsTab from "@/components/settings/ChannelGroupsTab";
import PipelinesTab from "@/components/settings/PipelinesTab";

type Tab = "products" | "pipelines" | "channels";

const tabs: { id: Tab; label: string }[] = [
  { id: "products", label: "Products & services" },
  { id: "pipelines", label: "Pipelines & stages" },
  { id: "channels", label: "Channel grouping" },
];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const raw = (params.get("tab") ?? "").toLowerCase();
  const tab: Tab = (tabs.find((t) => t.id === raw)?.id ?? "products") as Tab;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your catalogue, pipelines and workspace preferences"
      />
      <PageBody>
        <div className="flex items-center gap-1 border-b-hairline mb-5 -mt-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setParams({ tab: t.id }, { replace: true })}
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
        {tab === "pipelines" && <PipelinesTab />}
        {tab === "channels" && <ChannelGroupsTab />}
      </PageBody>
    </>
  );
}
