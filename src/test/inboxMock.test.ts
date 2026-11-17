import { describe, it, expect } from "vitest";
import { slaState, filterConversations, type Conversation } from "@/lib/inboxMock";

const now = Date.parse("2026-11-17T12:00:00Z");
const at = (m: number) => new Date(now - m * 60000).toISOString();
const conv = (p: Partial<Conversation> = {}): Conversation => ({ id: "x", contactId: "c", channel: "email", lastMessageAt: at(1), firstResponseAt: null, status: "open", unread: true, ...p });

describe("inbox SLA", () => {
  it("under 5 minutes is green", () => expect(slaState(conv(), at(3), now)).toBe("fast"));
  it("15+ minutes is amber", () => expect(slaState(conv(), at(20), now)).toBe("slow"));
  it("over 60 minutes is overdue", () => expect(slaState(conv(), at(61), now)).toBe("overdue"));
  it("no chip once replied", () => expect(slaState(conv({ firstResponseAt: at(1) }), at(90), now)).toBeNull());
});

describe("inbox filters", () => {
  const list = [conv({ id: "a", channel: "whatsapp" }), conv({ id: "b", firstResponseAt: at(1) }), conv({ id: "c", status: "done" })];
  it("needs reply hides replied and done", () => expect(filterConversations(list, "needs", "all").map((c) => c.id)).toEqual(["a"]));
  it("channel filter", () => expect(filterConversations(list, "all", "whatsapp").map((c) => c.id)).toEqual(["a"]));
  it("done filter", () => expect(filterConversations(list, "done", "all").map((c) => c.id)).toEqual(["c"]));
});
