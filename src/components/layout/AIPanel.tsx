import { useState, useRef, useEffect } from "react";
import { X, Send, Paperclip, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  card?: { title: string; rows: { label: string; value: string }[] };
}

const suggestedPrompts = [
  "Summarise this week's pipeline",
  "Which lead source is converting best?",
  "Show me lapsed customers from last year",
  "Draft a re-engagement email for window cleaning customers",
  "How is my Google Ads spend tracking vs jobs booked?",
];

const cannedResponses: Record<string, Message> = {
  "Summarise this week's pipeline": {
    role: "assistant",
    content: "Here's your pipeline snapshot for the week:",
    card: {
      title: "Pipeline this week",
      rows: [
        { label: "New enquiries", value: "2" },
        { label: "Quotes sent", value: "2 (£3,470)" },
        { label: "Jobs booked", value: "2 (£800)" },
        { label: "In progress", value: "2" },
        { label: "Paid this week", value: "£1,840" },
      ],
    },
  },
  "Which lead source is converting best?": {
    role: "assistant",
    content:
      "**Referral** is your top converter at 68% (quote → booking), followed by **Local Service Ads** at 54%. Google Ads brings the most volume but converts at 38%.",
  },
};

export function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    const reply: Message =
      cannedResponses[text] ?? {
        role: "assistant",
        content:
          "I'd pull that from your CRM data. (Connect Lovable AI to enable live responses — for now this is a preview.)",
      };
    setMessages((m) => [...m, userMsg, reply]);
    setInput("");
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/25 z-40 animate-fade-in"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 h-screen w-[420px] bg-background border-l-hairline z-50 flex flex-col animate-slide-in-right">
        <header className="h-14 px-4 flex items-center justify-between border-b-hairline shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.75} />
            <span className="text-sm font-medium">AI Assistant</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-surface-hover"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Ask anything about your pipeline, contacts, or marketing. Try:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-xs px-2.5 h-7 rounded-full border-hairline bg-background hover:bg-surface-hover text-foreground transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-primary/10 text-foreground"
                      : "bg-surface text-foreground"
                  )}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  {m.card && (
                    <div className="mt-2.5 border-hairline rounded-md bg-background p-3 space-y-1.5">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {m.card.title}
                      </div>
                      {m.card.rows.map((r) => (
                        <div key={r.label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="font-medium">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t-hairline p-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-1.5 border-hairline rounded-lg px-2 py-1.5 bg-background focus-within:border-primary/40"
          >
            <button type="button" className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-surface-hover">
              <Paperclip className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="w-7 h-7 rounded-md flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90"
            >
              <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
