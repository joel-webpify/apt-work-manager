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
