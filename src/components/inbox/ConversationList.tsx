import { cn } from "@/lib/utils";
import { slaState, type Conversation, type InboxContact, type InboundChannel, type Message, type StatusFilter } from "@/lib/inboxMock";
import { ChannelIcon, channelMeta, relTime } from "./channels";

const slaCls = { fast: "bg-success/15 text-success", slow: "bg-warning/15 text-warning", overdue: "bg-destructive/15 text-destructive" } as const;
const slaLabel = { fast: "<5m", slow: "15m+", overdue: "Overdue" } as const;
const channels: (InboundChannel | "all")[] = ["all", "whatsapp", "email", "webform", "facebook", "call"];

export function SlaChip({ sla }: { sla: ReturnType<typeof slaState> }) {
  if (!sla) return null;
  return <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", slaCls[sla])}>{slaLabel[sla]}</span>;
}

interface Props {
  rows: { conv: Conversation; contact: InboxContact; last: Message; sla: ReturnType<typeof slaState> }[];
  all: Conversation[]; status: StatusFilter; channel: InboundChannel | "all"; selected?: string; now: number;
  onStatus: (s: StatusFilter) => void; onChannel: (c: InboundChannel | "all") => void; onSelect: (id: string) => void;
}

export function ConversationList({ rows, all, status, channel, selected, now, onStatus, onChannel, onSelect }: Props) {
  return <div className="flex h-full flex-col">
    <div className="space-y-2 border-b p-3">
      <div className="grid grid-cols-3 rounded-md bg-muted p-0.5 text-xs">
        {([["needs", "Needs reply"], ["all", "All"], ["done", "Done"]] as const).map(([id, l]) =>
          <button key={id} onClick={() => onStatus(id)} className={cn("rounded px-2 py-1.5", status === id ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}>{l}</button>)}
      </div>
      <div className="flex flex-wrap gap-1">
        {channels.map((c) => {
          const count = c === "all" ? all.length : all.filter((x) => x.channel === c).length;
          const active = channel === c;
          return <button key={c} onClick={() => onChannel(c)} title={c === "all" ? "All channels" : channelMeta[c].label}
            className={cn("flex items-center gap-1 rounded-full border px-2 py-1 text-xs", active ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {c === "all" ? "All" : <ChannelIcon channel={c} size="sm" />}<span>{count}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nothing here. Nice work.</p>}
      {rows.map(({ conv, contact, last, sla }) =>
        <button key={conv.id} onClick={() => onSelect(conv.id)} className={cn("flex w-full gap-3 border-b px-3 py-3 text-left hover:bg-muted/50", selected === conv.id && "bg-muted")}>
          <ChannelIcon channel={conv.channel} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("truncate text-sm", conv.unread ? "font-semibold" : "font-medium")}>{contact.name}</span>
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{relTime(conv.lastMessageAt, now)}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <p className={cn("flex-1 truncate text-xs", conv.unread ? "text-foreground" : "text-muted-foreground")}>{last.direction === "out" ? "You: " : ""}{last.body.split("\n")[0]}</p>
              <SlaChip sla={sla} />
              {conv.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
            </div>
          </div>
        </button>)}
    </div>
  </div>;
}
