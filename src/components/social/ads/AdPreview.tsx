import { Globe, Heart, MessageCircle, MoreHorizontal, Send, ThumbsUp } from "lucide-react";
import type { AdCreative, AdPlacement } from "@/lib/adsStore";

/** Meta-style ad previews: feed post and story. */
export function AdPreview({
  creative,
  placement,
  pageName = "Your business",
  pageHandle = "yourbusiness",
}: {
  creative: AdCreative;
  placement: AdPlacement;
  pageName?: string;
  pageHandle?: string;
}) {
  const isStory = placement === "ig_stories" || placement === "ig_reels";
  return isStory ? (
    <StoryPreview creative={creative} pageHandle={pageHandle} />
  ) : (
    <FeedPreview creative={creative} pageName={pageName} placement={placement} />
  );
}

function Media({ creative, className }: { creative: AdCreative; className?: string }) {
  const label =
    creative.format === "video" ? "Video" : creative.format === "carousel" ? "Carousel" : "Image";
  return (
    <div className={`bg-surface flex items-center justify-center ${className ?? ""}`}>
      {creative.mediaUrls[0] ? (
        <img src={creative.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs text-muted-foreground">{label} goes here</span>
      )}
    </div>
  );
}

function FeedPreview({
  creative,
  pageName,
  placement,
}: {
  creative: AdCreative;
  pageName: string;
  placement: AdPlacement;
}) {
  const instagram = placement === "ig_feed";
  return (
    <div className="w-full max-w-[340px] mx-auto border-hairline rounded-lg bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">
          {pageName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium truncate">{pageName}</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            Sponsored {!instagram && <Globe className="w-3 h-3" />}
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </div>

      {creative.primaryText && (
        <p className="px-3 pb-2 text-xs leading-relaxed whitespace-pre-wrap">
          {creative.primaryText}
        </p>
      )}

      <Media creative={creative} className="aspect-[4/5] w-full" />

      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface/60">
        <div className="min-w-0">
          {creative.destinationUrl && (
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
              {safeHost(creative.destinationUrl)}
            </div>
          )}
          <div className="text-xs font-medium truncate">{creative.headline || "Your headline"}</div>
          {creative.description && (
            <div className="text-[11px] text-muted-foreground truncate">{creative.description}</div>
          )}
        </div>
        <span className="shrink-0 h-7 px-2.5 rounded-md bg-surface border-hairline text-[11px] font-medium inline-flex items-center">
          {creative.cta}
        </span>
      </div>

      <div className="flex items-center gap-4 px-3 py-2 text-muted-foreground border-t-hairline">
        {instagram ? (
          <>
            <Heart className="w-4 h-4" />
            <MessageCircle className="w-4 h-4" />
            <Send className="w-4 h-4" />
          </>
        ) : (
          <>
            <span className="text-[11px] inline-flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" /> Like
            </span>
            <span className="text-[11px] inline-flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" /> Comment
            </span>
            <span className="text-[11px] inline-flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Share
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function StoryPreview({ creative, pageHandle }: { creative: AdCreative; pageHandle: string }) {
  return (
    <div className="w-full max-w-[220px] mx-auto rounded-[22px] overflow-hidden border-hairline bg-card relative aspect-[9/16]">
      <Media creative={creative} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-0 inset-x-0 p-2.5">
        <div className="h-0.5 rounded-full bg-foreground/25 overflow-hidden">
          <div className="h-full w-1/3 bg-foreground/70" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-semibold flex items-center justify-center">
            {pageHandle.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-[11px] font-medium">{pageHandle}</span>
          <span className="text-[10px] text-muted-foreground">Sponsored</span>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-3 space-y-2 bg-gradient-to-t from-background/85 to-transparent">
        {creative.primaryText && (
          <p className="text-[11px] leading-snug line-clamp-3">{creative.primaryText}</p>
        )}
        <div className="h-7 rounded-full bg-card border-hairline text-[11px] font-medium flex items-center justify-center">
          {creative.cta}
        </div>
      </div>
    </div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).host;
  } catch {
    return url;
  }
}
