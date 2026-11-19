import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Info, Send, CheckCircle2 } from "lucide-react";
import { replyChannelsFor, type InboxContact, type Message, type ReplyChannel } from "@/lib/inboxMock";
import { ChannelIcon, channelMeta } from "./channels";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "./ConversationList";

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const replyLabel = (c: ReplyChannel) => c === "comment" ? "Public reply" : channelMeta[c].label;

export function Timeline({ contact, messages, defaultChannel, statusText, onSend, onBack, onInfo }: {
  contact: InboxContact; statusText: string; messages: Message[]; defaultChannel: ReplyChannel;
  onSend: (ch: ReplyChannel, body: string, subject?: string) => void; onBack: () => void; onInfo: () => void;
}) {
  const [ch, setCh] = useState<ReplyChannel>(defaultChannel);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { setCh(defaultChannel); setBody(""); setSubject(""); }, [contact.id, defaultChannel]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length, contact.id]);
  const used = [...new Set(messages.map((m) => m.channel))];
  const options = replyChannelsFor(messages);
  let lastDay = "";
  const send = () => { if (!body.trim()) return; onSend(ch, body.trim(), ch === "email" ? subject || "Re: your enquiry" : undefined); setBody(""); setSubject(""); };

  return <div className="flex h-full flex-col">
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
      <Avatar className="hidden sm:flex"><AvatarFallback>{initials(contact.name)}</AvatarFallback></Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{contact.name}</div>
        <div className="truncate text-sm text-muted-foreground">{statusText} · {contact.postcode}</div>
      </div>
      <div className="hidden gap-1 sm:flex">{used.map((c) => <ChannelIcon key={c} channel={c} size="sm" />)}</div>
      <Button variant="ghost" size="icon" className="xl:hidden" onClick={onInfo} aria-label="Contact details"><Info className="h-4 w-4" /></Button>
    </div>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((m) => {
        const day = fmtDay(m.createdAt);
        const divider = day !== lastDay ? (lastDay = day) : null;
        return <div key={m.id}>
          {divider && <div className="my-2 text-center text-[11px] text-muted-foreground">{divider}</div>}
          {m.direction === "system" ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-success" />{m.body} · {fmtTime(m.createdAt)}</div>
          ) : m.channel === "call" ? (
            <div className="mx-auto flex max-w-md items-start gap-2 rounded-lg border px-3 py-2 text-sm">
              <ChannelIcon channel="call" size="sm" />
              <div><div className="text-xs font-medium">{m.durationSec ? `Call · ${Math.floor(m.durationSec / 60)}m ${m.durationSec % 60}s` : "Missed call"} · {fmtTime(m.createdAt)}</div><div className="text-muted-foreground">{m.body}</div></div>
            </div>
          ) : (
            <div className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm", m.direction === "out" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted")}>
                {m.channel === "comment" && m.post && <div className={cn("mb-1.5 rounded-md border-l-2 px-2 py-1 text-[11px]", m.direction === "out" ? "border-primary-foreground/60 bg-primary-foreground/10" : "border-border bg-background")}>
                  {m.direction === "out" ? "Public reply on" : "Commented on"} {m.network === "instagram" ? "Instagram" : "Facebook"} post: “{m.post}”
                </div>}
                {m.subject && <div className="mb-1 text-xs font-semibold">{m.subject}</div>}
                <div className="whitespace-pre-line">{m.body}</div>
                <div className={cn("mt-1 flex items-center gap-1 text-[10px]", m.direction === "out" ? "justify-end opacity-80" : "text-muted-foreground")}>
                  {m.direction === "out" ? (() => { const I = channelMeta[m.channel].icon; return <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20"><I className="h-3 w-3" /></span>; })() : <ChannelIcon channel={m.channel} size="sm" />}{m.channel === "comment" && m.direction === "out" ? "Public reply" : channelMeta[m.channel].label} · {fmtTime(m.createdAt)}
                </div>
              </div>
            </div>
          )}
        </div>;
      })}
      <div ref={end} />
    </div>
    <div className="space-y-2 border-t p-3">
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Reply channel">
        {options.map((c) => {
          const Icon = channelMeta[c].icon;
          return <button key={c} role="radio" aria-checked={ch === c} onClick={() => setCh(c)} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", ch === c ? "border-primary bg-primary/10 font-medium" : "text-muted-foreground")}>
            <Icon className="h-3.5 w-3.5" />{replyLabel(c)}
          </button>;
        })}
        <span className="ml-auto self-center text-[11px] text-muted-foreground">{ch === "comment" ? "Visible to everyone on the post" : ch === "facebook" || ch === "instagram" ? `Private message to ${contact.name.split(" ")[0]}` : `To ${ch === "email" ? contact.email : contact.phone}`}</span>
      </div>
      {ch === "email" && <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />}
      <div className="flex gap-2">
        <Textarea rows={2} placeholder={ch === "comment" ? "Write a public reply…" : `Reply via ${replyLabel(ch)}…`} value={body} onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} className="min-h-0 resize-none" />
        <Button onClick={send} disabled={!body.trim()} className="self-end"><Send className="mr-1 h-4 w-4" />Send</Button>
      </div>
    </div>
  </div>;
}
