import { describe, expect, it } from "vitest";
import { subjectNeedsLengthWarning, ensureEmailFooter, canDeleteEmailBlock } from "@/lib/emailEditor";
import { createBlock, renderBlocksToHtml } from "@/components/email/EmailDesigner";
import { saveBusinessSettings } from "@/lib/businessSettings";

describe("email subject length warning", () => {
  it("warns above 60 characters, but not at 60", () => {
    expect(subjectNeedsLengthWarning("a".repeat(60))).toBe(false);
    expect(subjectNeedsLengthWarning("a".repeat(61))).toBe(true);
  });
});

describe("required email footer", () => {
  it("uses the business logo by default and keeps an email-specific override", () => {
    saveBusinessSettings({ name: "", address: "", phone: "", logo: "/business-logo.png", brandColour: "#347ba8", bookingLink: "" });
    expect(renderBlocksToHtml([createBlock("logo")])).toContain('src="/business-logo.png"');
    expect(renderBlocksToHtml([{ ...createBlock("logo"), src: "/custom-logo.png" }])).toContain('src="/custom-logo.png"');
    localStorage.removeItem("business.settings.v1");
  });
  it("always adds a business name, address and unsubscribe footer", () => {
    const blocks = ensureEmailFooter([createBlock("text")]);
    expect(blocks.at(-1)).toMatchObject({ type: "footer", company: "{{business_name}}", address: "{{business_address}}", url: "{{unsubscribe_link}}" });
    expect(ensureEmailFooter(blocks)).toBe(blocks);
  });
  it("does not allow deleting a footer", () => {
    expect(canDeleteEmailBlock(createBlock("footer"))).toBe(false);
    expect(canDeleteEmailBlock(createBlock("text"))).toBe(true);
  });
  it("retains required business identity and unsubscribe when restyled", () => {
    saveBusinessSettings({ name: "Example Services", address: "10 Test Street", phone: "", logo: "", brandColour: "#347ba8", bookingLink: "" });
    const html = renderBlocksToHtml([{ ...createBlock("footer"), company: "", address: "", unsubLabel: "", url: "", color: "#999999" }]);
    expect(html).toContain("Example Services");
    expect(html).toContain("10 Test Street");
    expect(html).toContain('href="{{unsubscribe_link}}"');
    expect(html).toContain("Unsubscribe");
    localStorage.removeItem("business.settings.v1");
  });
});
describe("column rows", () => {
  it("render any block inside a column, and keep old text-only columns", async () => {
    const { columnCells } = await import("@/components/email/EmailDesigner");
    const row = { ...createBlock("columns"), cells: [[{ ...createBlock("image"), src: "/a.png" }], [createBlock("text"), { ...createBlock("button"), label: "Book now" }]] };
    const html = renderBlocksToHtml([row]);
    expect(html).toContain('src="/a.png"');
    expect(html).toContain("Book now");
    expect(columnCells({ ...createBlock("columns"), leftText: "Old" })[0][0]).toMatchObject({ type: "text", text: "Old" });
  });
});
