import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { buildMock, filterConversations, slaState, threadForContact, type InboundChannel, type Message, type ReplyChannel, type StatusFilter, type Conversation } from "@/lib/inboxMock";
import { ConversationList } from "@/components/inbox/ConversationList";
import { Timeline } from "@/components/inbox/Timeline";
import { ContextPanel } from "@/components/inbox/ContextPanel";

const slaRank = { overdue: 0, slow: 1, fast: 2 } as const;

export default function Inbox() {
  const [seed] = useState(() => buildMock());
  const [now, setNow] = useState(() => Date.now());
  const [convs, setConvs] = useState(seed.conversations);
  const [msgs, setMsgs] = useState(seed.messages);
  const [status, setStatus] = useState<StatusFilter>("needs");
  const [channel, setChannel] = useState<InboundChannel | "all">("all");
  const [selected, setSelected] = useState<string>();
  const [mobileThread, setMobileThread] = useState(false);
  const [info, setInfo] = useState(false);
  const contactOf = (id: string) => seed.contacts.find((c) => c.id === id)!;

  const rows = useMemo(() => filterConversations(convs, status, channel).map((conv) => {
    const own = msgs.filter((m) => m.conversationId === conv.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const firstIn = own.find((m) => m.direction === "in")?.createdAt ?? conv.lastMessageAt;
    return { conv, contact: contactOf(conv.contactId), last: own[own.length - 1], sla: slaState(conv, firstIn, now) };
  }).sort((a, b) => {
    const ra = a.sla ? slaRank[a.sla] : 3, rb = b.sla ? slaRank[b.sla] : 3;
    return ra - rb || b.conv.lastMessageAt.localeCompare(a.conv.lastMessageAt);
  }), [convs, msgs, status, channel, now]);

  const current = convs.find((c) => c.id === (selected ?? rows[0]?.conv.id));
  const contact = current && contactOf(current.contactId);
  const thread = contact ? threadForContact(contact.id, convs, msgs) : [];
  const lastIn = [...thread].reverse().find((m) => m.direction === "in")?.channel;
  const defaultCh: ReplyChannel = lastIn === "email" || lastIn === "webform" ? "email" : lastIn === "call" ? "sms" : "whatsapp";

  const select = (id: string) => { setSelected(id); setMobileThread(true); setConvs((cs) => cs.map((c) => c.id === id ? { ...c, unread: false } : c)); };
  const patchContactConvs = (fn: (c: Conversation) => Conversation) => setConvs((cs) => cs.map((c) => c.contactId === contact!.id ? fn(c) : c));
  const addMsg = (m: Omit<Message, "id" | "createdAt">) => { const t = Date.now(); setNow(t); setMsgs((ms) => [...ms, { ...m, id: `m${t}`, createdAt: new Date(t).toISOString() }]); return new Date(t).toISOString(); };

  const send = (ch: ReplyChannel, body: string, subject?: string) => {
    const at = addMsg({ conversationId: current!.id, channel: ch, direction: "out", body, subject });
    patchContactConvs((c) => ({ ...c, firstResponseAt: c.firstResponseAt ?? at, lastMessageAt: c.id === current!.id ? at : c.lastMessageAt, status: c.status === "open" ? "replied" : c.status, unread: false }));
    toast.success(`Sent via ${ch === "sms" ? "SMS" : ch === "email" ? "Email" : "WhatsApp"} (demo)`);
  };
  const action = (a: "lead" | "survey" | "job") => {
    const text = { lead: "Converted to lead · added to Sales pipeline", survey: "Survey requested · pick a slot in Schedule", job: "Job created · Installation pipeline" }[a];
    addMsg({ conversationId: current!.id, channel: current!.channel, direction: "system", body: text });
    patchContactConvs((c) => ({ ...c, status: a === "lead" ? "lead" : a === "survey" ? "booked" : "done" }));
    toast.success(`${text} (demo)`);
  };

  const panel = contact && current && <ContextPanel contact={contact} status={current.status} onAction={action} />;

  return <div className="flex h-[calc(100vh-0px)] min-h-0 overflow-hidden bg-background">
    <aside className={cn("w-full shrink-0 border-r md:w-80", mobileThread && "hidden md:block")}>
      <div className="border-b px-4 py-3"><h1 className="text-lg font-semibold">Inbox</h1><p className="text-xs text-muted-foreground">Every message, one place · demo data</p></div>
      <div className="h-[calc(100%-61px)]">
        <ConversationList rows={rows} all={convs} status={status} channel={channel} selected={current?.id} now={now} onStatus={setStatus} onChannel={setChannel} onSelect={select} />
      </div>
    </aside>
    <main className={cn("min-w-0 flex-1", !mobileThread && "hidden md:block")}>
      {contact ? <Timeline contact={contact} messages={thread} defaultChannel={defaultCh} onSend={send} onBack={() => setMobileThread(false)} onInfo={() => setInfo(true)} />
        : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a conversation</div>}
    </main>
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-l xl:block">{panel}</aside>
    <Sheet open={info} onOpenChange={setInfo}><SheetContent className="overflow-y-auto p-0">{panel}</SheetContent></Sheet>
  </div>;
}
