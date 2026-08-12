import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, Bookmark, ThumbsUp, Music2 } from "lucide-react";
import type { SocialChannel, SocialPost } from "@/lib/socialPostsStore";

const brand = "Northside Builders";
const handle = "northsidebuilders";

function Media({ url, alt, ratio = "aspect-square" }: { url?: string; alt?: string; ratio?: string }) {
  return (
    <div className={`${ratio} w-full bg-surface border-y-hairline flex items-center justify-center overflow-hidden`}>
      {url ? (
        <img src={url} alt={alt || ""} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[11px] text-muted-foreground">Photo or video appears here</span>
      )}
    </div>
  );
}

function Avatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-[10px] font-medium inline-flex items-center justify-center shrink-0">
      NB
    </div>
  );
}

export function OrganicPostPreview({ channel, post }: { channel: SocialChannel; post: SocialPost }) {
  const caption = post.content?.trim();
  const captionNode = caption ? (
    <span className="whitespace-pre-wrap">{caption}</span>
  ) : (
    <span className="italic text-muted-foreground">Your caption will show here…</span>
  );

  if (channel === "instagram") {
    return (
      <div className="border-hairline rounded-lg bg-background overflow-hidden">
        <div className="flex items-center gap-2 p-2.5">
          <Avatar />
          <div className="text-xs font-medium flex-1">{handle}</div>
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>
        <Media url={post.mediaUrl} alt={post.altText} />
        <div className="p-2.5 space-y-1.5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Heart className="w-4 h-4" />
            <MessageCircle className="w-4 h-4" />
            <Send className="w-4 h-4" />
            <Bookmark className="w-4 h-4 ml-auto" />
          </div>
          <div className="text-xs leading-snug">
            <span className="font-medium">{handle}</span> {captionNode}
          </div>
          {post.firstComment && (
            <div className="text-[11px] text-muted-foreground leading-snug">
              <span className="font-medium text-foreground">{handle}</span> {post.firstComment}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (channel === "facebook") {
    return (
      <div className="border-hairline rounded-lg bg-background overflow-hidden">
        <div className="flex items-center gap-2 p-2.5">
          <Avatar />
          <div className="flex-1">
            <div className="text-xs font-medium">{brand}</div>
            <div className="text-[10px] text-muted-foreground">Sponsored-free · Public</div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="px-2.5 pb-2 text-xs leading-snug">{captionNode}</div>
        <Media url={post.mediaUrl} alt={post.altText} ratio="aspect-[4/3]" />
        {post.link && (
          <div className="px-2.5 py-2 bg-surface text-[11px] text-muted-foreground truncate">{post.link}</div>
        )}
        <div className="flex items-center justify-around p-2 text-[11px] text-muted-foreground border-t-hairline">
          <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> Like</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> Comment</span>
          <span className="inline-flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Share</span>
        </div>
      </div>
    );
  }

  if (channel === "linkedin") {
    return (
      <div className="border-hairline rounded-lg bg-background overflow-hidden">
        <div className="flex items-center gap-2 p-2.5">
          <Avatar />
          <div className="flex-1">
            <div className="text-xs font-medium">{brand}</div>
            <div className="text-[10px] text-muted-foreground">1,204 followers · Just now</div>
          </div>
        </div>
        <div className="px-2.5 pb-2 text-xs leading-snug">{captionNode}</div>
        {(post.mediaUrl || post.link) && <Media url={post.mediaUrl} alt={post.altText} ratio="aspect-[16/9]" />}
        {post.link && (
          <div className="px-2.5 py-2 bg-surface text-[11px] text-muted-foreground truncate">{post.link}</div>
        )}
        <div className="flex items-center gap-4 p-2 text-[11px] text-muted-foreground border-t-hairline">
          <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> Like</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> Comment</span>
          <span className="inline-flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" /> Repost</span>
        </div>
      </div>
    );
  }

  if (channel === "x") {
    return (
      <div className="border-hairline rounded-lg bg-background p-2.5">
        <div className="flex gap-2">
          <Avatar />
          <div className="flex-1 min-w-0">
            <div className="text-xs">
              <span className="font-medium">{brand}</span>{" "}
              <span className="text-muted-foreground">@{handle} · now</span>
            </div>
            <div className="text-xs leading-snug mt-0.5">{captionNode}</div>
            {post.mediaUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border-hairline">
                <Media url={post.mediaUrl} alt={post.altText} ratio="aspect-[16/9]" />
              </div>
            )}
            <div className="flex items-center gap-6 mt-2 text-muted-foreground">
              <MessageCircle className="w-3.5 h-3.5" />
              <Repeat2 className="w-3.5 h-3.5" />
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // tiktok — vertical
  return (
    <div className="border-hairline rounded-lg bg-background overflow-hidden mx-auto max-w-[220px]">
      <div className="aspect-[9/16] bg-surface relative flex items-center justify-center overflow-hidden">
        {post.mediaUrl ? (
          <img src={post.mediaUrl} alt={post.altText || ""} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[11px] text-muted-foreground px-4 text-center">Vertical video appears here</span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
          <div className="text-[11px] font-medium">@{handle}</div>
          <div className="text-[11px] leading-snug line-clamp-3">{captionNode}</div>
          <div className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-1">
            <Music2 className="w-3 h-3" /> Original sound
          </div>
        </div>
      </div>
    </div>
  );
}
