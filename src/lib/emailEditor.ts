export function subjectNeedsLengthWarning(subject: string): boolean {
  return subject.length > 60;
}

import type { EmailBlock } from "@/components/email/EmailDesigner";
export function ensureEmailFooter(blocks: EmailBlock[]): EmailBlock[] {
  if (blocks.some((block) => block.type === "footer")) return blocks;
  return [...blocks, { id: "required-business-footer", type: "footer", company: "{{business_name}}", address: "{{business_address}}", url: "{{unsubscribe_link}}", unsubLabel: "Unsubscribe", align: "center" }];
}
export function canDeleteEmailBlock(block: EmailBlock): boolean { return block.type !== "footer"; }
export function decorateMergePills(html: string): string {
  return html.split(/(<[^>]*>)/g).map((part) => part.startsWith("<") ? part : part.replace(/\{\{([a-z_]+)(?:\|([^{}]*))?\}\}/g, '<span class="email-merge-pill">$1</span>')).join("");
}