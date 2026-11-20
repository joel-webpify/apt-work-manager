import { describe, it, expect } from "vitest";
import { slaState, filterConversations, replyChannelsFor, defaultReplyChannel, type Conversation, type Message } from "@/lib/inboxMock";

const now = Date.parse("2026-11-17T12:00:00Z");
const at = (m: number) => new Date(now - m * 60000).toISOString();
const conv = (p: Partial<Conversation> = {}): Conversation => ({ id: "x", contactId: "c", channel: "email", lastMessageAt: at(1), firstResponseAt: null, status: "open", unread: true, ...p });

describe("inbox SLA", () => {
  it("under 5 minutes is green", () => expect(slaState(conv(), at(3), now)).toBe("fast"));
  it("15+ minutes is amber", () => expect(slaState(conv(), at(20), now)).toBe("slow"));
  it("over 60 minutes is overdue", () => expect(slaState(conv(), at(61), now)).toBe("overdue"));
  it("no chip once booked", () => expect(slaState(conv({ status: "booked" }), at(90), now)).toBeNull());
  it("no chip once replied", () => expect(slaState(conv({ firstResponseAt: at(1) }), at(90), now)).toBeNull());
});

describe("inbox filters", () => {
  const list = [conv({ id: "a", channel: "whatsapp" }), conv({ id: "b", firstResponseAt: at(1) }), conv({ id: "c", status: "done" })];
  it("needs reply hides replied and done", () => expect(filterConversations(list, "needs", "all").map((c) => c.id)).toEqual(["a"]));
  it("channel filter", () => expect(filterConversations(list, "all", "whatsapp").map((c) => c.id)).toEqual(["a"]));
  it("done filter", () => expect(filterConversations(list, "done", "all").map((c) => c.id)).toEqual(["c"]));
});

describe("comments and DMs", () => {
  const msg = (p: Partial<Message>): Message => ({ id: "m", conversationId: "x", channel: "email", direction: "in", body: "", createdAt: at(1), ...p });
  it("a comment thread offers a public reply and a DM on that network", () =>
    expect(replyChannelsFor([msg({ channel: "comment", network: "instagram" })])).toEqual(["whatsapp", "sms", "email", "comment", "instagram"]));
  it("plain threads only offer WhatsApp, SMS and email", () => expect(replyChannelsFor([msg({})])).toEqual(["whatsapp", "sms", "email"]));
  it("comments default to a public reply", () => expect(defaultReplyChannel([msg({ channel: "comment", network: "facebook" })])).toBe("comment"));
  it("Instagram DMs default to an Instagram DM", () => expect(defaultReplyChannel([msg({ channel: "instagram" })])).toBe("instagram"));
  it("Facebook filter covers both Facebook DMs and Facebook comments", () =>
    expect(filterConversations([conv({ id: "a", channel: "comment", network: "facebook" }), conv({ id: "b", channel: "facebook" }), conv({ id: "c", channel: "comment", network: "instagram" })], "all", "facebook").map((c) => c.id)).toEqual(["a", "b"]));
  it("Instagram comments sit under the Instagram filter", () =>
    expect(filterConversations([conv({ id: "a", channel: "comment", network: "instagram" }), conv({ id: "b", channel: "instagram" })], "all", "instagram").map((c) => c.id)).toEqual(["a", "b"]));
});

describe("Google reviews", () => {
  const msg = (p: Partial<Message>): Message => ({ id: "m", conversationId: "x", channel: "review", direction: "in", body: "", createdAt: at(1), rating: 5, ...p });
  it("reviews default to a public reply on Google", () => expect(defaultReplyChannel([msg({})])).toBe("review"));
  it("a review thread offers a reply on Google", () => expect(replyChannelsFor([msg({})])).toContain("review"));
  it("review filter", () => expect(filterConversations([conv({ id: "a", channel: "review" }), conv({ id: "b" })], "all", "review").map((c) => c.id)).toEqual(["a"]));
});
