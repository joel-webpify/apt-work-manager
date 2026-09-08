/**
 * Links we hand to customers must open in a normal browser tab, not only
 * inside the editor preview. Two things can break that:
 *  - the preview address (id-preview--…) isn't reachable for customers
 *  - copying can be blocked inside an embedded frame
 * These helpers deal with both.
 */

/**
 * The address a customer can actually open.
 * We keep whatever address the app is currently served from: while the site
 * isn't published yet, the tidied-up "live" address doesn't exist and the
 * link would land on a missing page.
 */
export function publicOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

/** Full shareable link for a path like "/quote/Q-2041". */
export function shareUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${publicOrigin()}${p}`;
}

/** Customer-facing quote link (sign-in happens on the way if needed). */
export function quoteLink(quoteId: string): string {
  return shareUrl(`/quote/${encodeURIComponent(quoteId)}`);
}

/** Copies text, falling back to a hidden textarea when the clipboard is blocked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the manual copy below */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Opens a shared link in a new browser tab (top-level, not inside the frame). */
export function openInBrowser(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
