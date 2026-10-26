import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Clock, User, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Btn } from "@/components/layout/PageShell";
import { useWhatsApp, sendReply, markRead, replyWindow } from "@/lib/whatsappStore";

const quick = ["Thanks, see you then!", "I'll check and get back to you shortly.", "Yes, that works for us."];
const time = (iso: string) => new Date(iso).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });

export function Inbox() {
  const { conversations } = useWhatsApp();
  const [active, setActive] = useState(conversations[0]?.id);
  const [text, setText] = useState("");
  const conv = conversations.find((c) => c.id === active);
  const win = conv ? replyWindow(conv.messages) : { open: false };
  const send = (t: string) => { if (!conv || !t.trim()) return; sendReply(conv.id, t.trim()); setText(""); };
  return <div className="grid h-[calc(100vh-220px)] min-h-[460px] grid-cols-[260px_1fr] rounded-lg border-hairline bg-card overflow-hidden">
    <div className="border-r-hairline overflow-auto">
      {conversations.map((c) => { const last = c.messages[c.messages.length - 1]; return <button key={c.id} onClick={() => { setActive(c.id); markRead(c.id); }} className={`w-full text-left p-3 border-b-hairline ${c.id === active ? "bg-surface" : "hover:bg-surface-hover"}`}>
        <div className="flex items-center gap-2"><span className="text-sm font-medium flex-1 truncate">{c.name}</span>{c.unread > 0 && <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">{c.unread}</span>}</div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">{last?.dir === "out" ? "You: " : ""}{last?.text}</div>
      </button>; })}
    </div>
    {conv ? <div className="flex flex-col min-h-0">
      <div className="h-14 border-b-hairline px-4 flex items-center gap-3">
        <div className="flex-1"><div className="text-sm font-medium">{conv.name}</div><div className="text-xs text-muted-foreground">{conv.phone}</div></div>
        <Link to={`/contacts?contact=${conv.contactId}`} className="text-xs text-primary inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />Contact</Link>
        {conv.jobId && <Link to={`/pipeline?job=${conv.jobId}`} className="text-xs text-primary inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />Job</Link>}
      </div>
      <div className="flex-1 overflow-auto bg-surface p-4 space-y-2">
        {conv.messages.map((m) => <div key={m.id} className={`flex ${m.dir === "out" ? "justify-end" : ""}`}>
          <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm ${m.dir === "out" ? "bg-primary/10" : "bg-card"}`}>
            {m.template && <div className="text-[10px] font-mono text-muted-foreground mb-0.5">template · {m.template}</div>}
            {m.text}<div className="text-[10px] text-muted-foreground text-right mt-1">{time(m.at)}</div>
          </div>
        </div>)}
      </div>
      <div className="border-t-hairline p-3 space-y-2">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{win.open ? `Free reply until ${win.until!.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Reply window closed — start with an approved template."}</div>
        {win.open && <div className="flex gap-1.5 flex-wrap">{quick.map((q) => <button key={q} onClick={() => send(q)} className="text-xs rounded-full border-hairline px-2.5 py-1 hover:bg-surface-hover">{q}</button>)}</div>}
        <div className="flex gap-2"><Input aria-label="Reply" disabled={!win.open} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(text)} placeholder={win.open ? "Type a reply…" : "Use a template to reopen the chat"} /><Btn variant="primary" disabled={!win.open} onClick={() => send(text)}><Send className="h-3.5 w-3.5" />Send</Btn></div>
      </div>
    </div> : <div className="flex items-center justify-center text-sm text-muted-foreground">No conversations yet</div>}
  </div>;
}
