import { useSearchParams } from "react-router-dom";
import { PageHeader, PageBody, Pill } from "@/components/layout/PageShell";
import { Inbox } from "@/components/whatsapp/Inbox";
import { Campaigns } from "@/components/whatsapp/Campaigns";
import { TemplatesList } from "@/components/whatsapp/TemplatesList";
import { Results } from "@/components/whatsapp/Results";
import { useWhatsApp } from "@/lib/whatsappStore";

const tabs = [["inbox", "Inbox"], ["campaigns", "Campaigns"], ["templates", "Templates"], ["results", "Results"]] as const;
type Tab = (typeof tabs)[number][0];

export default function WhatsApp() {
  const [params, setParams] = useSearchParams();
  const tab = (tabs.find(([id]) => id === params.get("tab"))?.[0] ?? "inbox") as Tab;
  const edit = params.get("edit") ?? undefined;
  const { conversations } = useWhatsApp();
  const unread = conversations.reduce((n, c) => n + c.unread, 0);
  return <>
    <PageHeader title="WhatsApp" description="Booking updates, replies and marketing campaigns" actions={<Pill tone="neutral">Demo connection</Pill>} />
    <PageBody>
      <div className="flex border-b-hairline mb-4 -mt-2">
        {tabs.map(([id, label]) => <button key={id} onClick={() => setParams({ tab: id }, { replace: true })} className={`h-9 px-3 text-sm border-b-2 -mb-px ${tab === id ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          {label}{id === "inbox" && unread > 0 && <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{unread}</span>}
        </button>)}
      </div>
      {tab === "inbox" && <Inbox />}
      {tab === "campaigns" && <Campaigns />}
      {tab === "templates" && <TemplatesList key={edit} editName={edit} onEdited={() => edit && setParams({ tab: "templates" }, { replace: true })} />}
      {tab === "results" && <Results />}
    </PageBody>
  </>;
}
