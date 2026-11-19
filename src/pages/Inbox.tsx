import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { buildMock, defaultReplyChannel, filterConversations, slaState, threadForContact, type InboundChannel, type Message, type ReplyChannel, type StatusFilter, type Conversation } from "@/lib/inboxMock";
import { ConversationList } from "@/components/inbox/ConversationList";
import { Timeline } from "@/components/inbox/Timeline";
import { ContextPanel } from "@/components/inbox/ContextPanel";

const statusText = { open: "New enquiry", replied: "Replied", lead: "Lead", booked: "Survey booked", done: "Done" } as const;
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
  const [query, setQuery] = useState("");
  const contactOf = (id: string) => seed.contacts.find((c) => c.id === id)!;

  const q = query.trim().toLowerCase();
  const rows = useMemo(() => filterConversations(convs, status, channel).filter((conv) => {
    if (!q) return true;
    const ct = contactOf(conv.contactId);
    return ct.name.toLowerCase().includes(q) || ct.postcode.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""));
  }).map((conv) => {
    const own = msgs.filter((m) => m.conversationId === conv.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const firstIn = own.find((m) => m.direction === "in")?.createdAt ?? conv.lastMessageAt;
    return { conv, contact: contactOf(conv.contactId), last: own[own.length - 1], sla: slaState(conv, firstIn, now) };
  }).sort((a, b) => {
    const ra = a.sla ? slaRank[a.sla] : 3, rb = b.sla ? slaRank[b.sla] : 3;
    return ra - rb || b.conv.lastMessageAt.localeCompare(a.conv.lastMessageAt);
  }), [convs, msgs, status, channel, now, q]);

  const current = convs.find((c) => c.id === (selected ?? rows[0]?.conv.id));
  const contact = current && contactOf(current.contactId);
  const thread = contact ? threadForContact(contact.id, convs, msgs) : [];
  const defaultCh: ReplyChannel = defaultReplyChannel(thread);

  const select = (id: string) => { setSelected(id); setMobileThread(true); setConvs((cs) => cs.map((c) => c.id === id ? { ...c, unread: false } : c)); };
  const patchContactConvs = (fn: (c: Conversation) => Conversation) => setConvs((cs) => cs.map((c) => c.contactId === contact!.id ? fn(c) : c));
  const addMsg = (m: Omit<Message, "id" | "createdAt">) => { const t = Date.now(); setNow(t); setMsgs((ms) => [...ms, { ...m, id: `m${t}`, createdAt: new Date(t).toISOString() }]); return new Date(t).toISOString(); };

  const send = (ch: ReplyChannel, body: string, subject?: string) => {
    const lastComment = [...thread].reverse().find((m) => m.channel === "comment");
    const target = ch === "comment" && lastComment ? lastComment.conversationId : current!.id;
    const at = addMsg({ conversationId: target, channel: ch, direction: "out", body, subject, ...(ch === "comment" && lastComment ? { network: lastComment.network, post: lastComment.post } : {}) });
    patchContactConvs((c) => ({ ...c, firstResponseAt: c.firstResponseAt ?? at, lastMessageAt: c.id === current!.id ? at : c.lastMessageAt, status: c.status === "open" ? "replied" : c.status, unread: false }));
    toast.success(ch === "comment" ? "Public reply posted (demo)" : `Sent via ${{ sms: "SMS", email: "Email", whatsapp: "WhatsApp", facebook: "Facebook DM", instagram: "Instagram DM" }[ch]} (demo)`);
  };
  const action = (a: "lead" | "survey" | "job") => {
    const text = { lead: "Converted to lead · added to Sales pipeline", survey: "Survey requested · pick a slot in Schedule", job: "Job created · Installation pipeline" }[a];
    addMsg({ conversationId: current!.id, channel: current!.channel, direction: "system", body: text });
    patchContactConvs((c) => ({ ...c, status: a === "lead" ? "lead" : a === "survey" ? "booked" : "done" }));
    toast.success(`${text} (demo)`);
  };

  const panel = contact && current && <ContextPanel contact={contact} status={current.status} onAction={action} />;

  return <div className="grid h-screen min-h-[560px] grid-cols-1 gap-4 overflow-hidden bg-muted/40 p-4 md:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_320px]">
    <Card className={cn("flex min-h-0 flex-col overflow-hidden", mobileThread && "hidden md:flex")}>
      <ConversationList rows={rows} all={convs} status={status} channel={channel} selected={current?.id} now={now} query={query} onQuery={setQuery} onStatus={setStatus} onChannel={setChannel} onSelect={select} />
    </Card>
    <Card className={cn("flex min-h-0 flex-col overflow-hidden", !mobileThread && "hidden md:flex")}>
      {contact && current ? <Timeline contact={contact} messages={thread} defaultChannel={defaultCh} statusText={statusText[current.status]} onSend={send} onBack={() => setMobileThread(false)} onInfo={() => setInfo(true)} />
        : <div className="m-auto text-sm text-muted-foreground">Select a conversation</div>}
    </Card>
    <div className="hidden min-h-0 overflow-y-auto xl:block">{panel}</div>
    <Sheet open={info} onOpenChange={setInfo}><SheetContent className="overflow-y-auto bg-muted/40 p-4 pt-12">{panel}</SheetContent></Sheet>
  </div>;
}
