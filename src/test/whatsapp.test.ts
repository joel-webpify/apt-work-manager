import { describe, it, expect } from "vitest";
import { toE164, canSend, placeholderCount } from "@/lib/whatsappStore";

describe("whatsapp rules", () => {
  it("normalises UK numbers to digits-only E.164", () => expect(toE164("07700 900201")).toBe("447700900201"));
  it("normalises Swedish numbers", () => expect(toE164("070-123 45 67", "SE")).toBe("46701234567"));
  it("skips marketing without marketing consent", () => expect(canSend("utility", "07700 900201", "MARKETING")).toEqual({ ok: false, reason: "No WhatsApp marketing consent" }));
  it("allows booking updates with utility consent", () => expect(canSend("utility", "07700 900201", "UTILITY").ok).toBe(true));
  it("skips landlines", () => expect(canSend("all", "020 7946 0000", "UTILITY").reason).toBe("No mobile number"));
  it("counts template variables", () => expect(placeholderCount("Hi {{1}} on {{2}} {{1}}")).toBe(2));
});

import { validateTemplate, replyWindow, audienceSplit } from "@/lib/whatsappStore";
describe("whatsapp module rules", () => {
  const base = { name: "ok_name", body: "Hi {{1}}, your visit is booked for {{2}} at the address on file.", buttons: [], footer: "" };
  it("accepts a valid template", () => expect(validateTemplate(base)).toEqual([]));
  it("rejects body over 1024 chars", () => expect(validateTemplate({ ...base, body: "a ".repeat(600) })).toContain("Body is over 1024 characters"));
  it("rejects adjacent variables", () => expect(validateTemplate({ ...base, body: "Hello there {{1}} {{2}} see you soon friend" })).toContain("Variables can't sit next to each other"));
  it("rejects ending with a variable", () => expect(validateTemplate({ ...base, body: "Hello there friend, see you {{1}}" })).toContain("Body can't start or end with a variable"));
  it("caps buttons at 3", () => expect(validateTemplate({ ...base, buttons: Array(4).fill({ type: "quick_reply", text: "Ok" }) })).toContain("Up to 3 buttons"));
  it("reply window open within 24h", () => expect(replyWindow([{ id: "1", dir: "in", text: "", at: new Date(Date.now() - 23 * 3600e3).toISOString() }]).open).toBe(true));
  it("reply window closed after 24h", () => expect(replyWindow([{ id: "1", dir: "in", text: "", at: new Date(Date.now() - 25 * 3600e3).toISOString() }]).open).toBe(false));
  it("counts skips with reasons", () => expect(audienceSplit([{ id: "a", phone: "07700 900201" }, { id: "b", phone: "07700 900202" }, { id: "c", phone: "020 7946 0000" }], { a: "all", b: "utility", c: "all" }, "MARKETING")).toEqual({ receive: 1, skipped: 2, reasons: { "No WhatsApp marketing consent": 1, "No mobile number": 1 } }));
});
