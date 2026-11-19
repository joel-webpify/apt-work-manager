import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { slaState, type Conversation, type InboxContact, type InboundChannel, type Message, type StatusFilter } from "@/lib/inboxMock";
import { ChannelIcon, channelMeta, relTime } from "./channels";

const slaCls = { fast: "bg-success text-primary-foreground", slow: "bg-warning text-foreground", overdue: "bg-destructive text-destructive-foreground" } as const;
const slaLabel = { fast: "<5m", slow: "15m+", overdue: "Overdue" } as const;
const channels: (InboundChannel | "all")[] = ["all", "whatsapp", "email", "webform", "facebook", "instagram", "comment", "call"];

export function SlaChip({ sla }: { sla: ReturnType<typeof slaState> }) {
  if (!sla) return null;
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", slaCls[sla])}>{slaLabel[sla]}</span>;
}

export function ChannelBadge({ channel, network }: { channel: InboundChannel; network?: "facebook" | "instagram" }) {
  const meta = channel === "comment" && network ? channelMeta[network] : channelMeta[channel];
  const Icon = meta.icon;
  const label = channel === "comment" && network ? `${network === "instagram" ? "Instagram" : "Facebook"} comment` : channelMeta[channel].label;
  return <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[11px] text-foreground">
    <Icon className="h-3 w-3" />{label}
  </span>;
}

export const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

interface Props {
  rows: { conv: Conversation; contact: InboxContact; last: Message; sla: ReturnType<typeof slaState> }[];
  all: Conversation[]; status: StatusFilter; channel: InboundChannel | "all"; selected?: string; now: number; query: string;
  onStatus: (s: StatusFilter) => void; onChannel: (c: InboundChannel | "all") => void; onSelect: (id: string) => void; onQuery: (q: string) => void;
}

export function ConversationList({ rows, all, status, channel, selected, now, query, onStatus, onChannel, onSelect, onQuery }: Props) {
  return <div className="flex h-full min-h-0 flex-col">
    <div className="space-y-3 p-4 pb-3">
      <div>
        <h1 className="text-lg font-semibold leading-tight">Inbox</h1>
        <p className="text-xs text-muted-foreground">Every message, one place · demo data</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search name or postcode" className="pl-9" aria-label="Search conversations" />
      </div>
      <div className="grid grid-cols-3 rounded-md bg-muted p-0.5 text-xs">
        {([["needs", "Needs reply"], ["all", "All"], ["done", "Done"]] as const).map(([id, l]) =>
          <button key={id} onClick={() => onStatus(id)} className={cn("rounded px-2 py-1.5", status === id ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}>{l}</button>)}
      </div>
      <div className="flex flex-wrap gap-1">
        {channels.map((c) => {
          const count = c === "all" ? all.length : all.filter((x) => x.channel === c).length;
          const active = channel === c;
          return <button key={c} onClick={() => onChannel(c)} title={c === "all" ? "All channels" : channelMeta[c].label} aria-pressed={active}
            className={cn("flex items-center gap-1 rounded-full border px-2 py-1 text-xs", active ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {c === "all" ? "All" : <ChannelIcon channel={c} size="sm" />}<span>{count}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
      {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nothing here. Nice work.</p>}
      <ul className="space-y-1">
        {rows.map(({ conv, contact, last, sla }) =>
          <li key={conv.id}><button onClick={() => onSelect(conv.id)} className={cn("w-full rounded-lg p-3 text-left transition-colors hover:bg-muted", selected === conv.id && "bg-muted")}>
            <div className="flex items-center gap-2">
              {conv.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              <span className={cn("flex-1 truncate text-sm", conv.unread ? "font-semibold" : "font-medium")}>{contact.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{relTime(conv.lastMessageAt, now)}</span>
            </div>
            <p className={cn("mt-1 line-clamp-1 text-sm", conv.unread ? "text-foreground" : "text-muted-foreground")}>{last.direction === "out" ? "You: " : ""}{last.body.split("\n")[0]}</p>
            <div className="mt-2 flex items-center gap-2">
              <ChannelBadge channel={conv.channel} network={conv.network} />
              <SlaChip sla={sla} />
              <span className="ml-auto truncate text-[11px] text-muted-foreground">{contact.postcode}</span>
            </div>
          </button></li>)}
      </ul>
    </div>
  </div>;
}
