# AI help for social posts (preview, no live AI)

Two AI helpers inside the post composer, built as smart canned suggestions so nothing needs to be connected yet.

## 1. Caption writer

A "Write it for me" button at the top of step 2 (What are you posting?) opens a small inline panel:

- Pick what the post is about: finished job, customer review, offer/promotion, hiring, seasonal tip, before & after.
- Pick a tone: friendly, professional, short & punchy, chatty.
- Optional one-line note ("new bathroom in Headingley, oak worktops").

Pressing "Suggest captions" shows 3 caption options as cards. Each card shows the caption, a character count against the tightest selected channel, and buttons to **Use this** (drops it into the caption box) or **Shuffle** (regenerate).

Also on each generated caption:
- Suggested hashtags for the trade, added as the first comment with one tap.
- A "Make it shorter" / "Make it longer" toggle for the picked caption.
- If the post is aimed at X (280 chars), the shorter variant is offered automatically.

Captions are built from templates that mix in the chosen topic, tone, the note, and the location tag if one is set — so they read differently every time instead of being 3 fixed strings.

## 2. Photo-to-post

Next to the "Photo or video link" field, a "Describe this photo" button:

- With a media link present, it produces a plain-English description of the photo (drawn from the topic and note the user gave), fills **alt text**, and offers a matching caption opener.
- If no note is given, it asks one short question first ("What's in the photo?") so the output is grounded rather than generic.
- Clearly labelled as a suggestion the user can edit.

## Small extras that make it faster

- A "Best time" chip in step 3 gets a short reason line ("Most of your customers check Facebook after work").
- Once a caption is picked, the pre-flight checklist updates live as it already does — no change to the blocking rules.

## Technical notes

- New file `src/lib/socialAiSuggest.ts` — pure functions: `suggestCaptions(input)`, `suggestHashtags(topic)`, `describePhoto(input)`, `resizeCaption(text, target)`. Deterministic-with-variation template engine, no network calls.
- New file `src/components/social/AiCaptionPanel.tsx` — the collapsible helper UI, driven by props and calling back into the composer's `set()`.
- Edit `src/components/social/ComposePostDialog.tsx` — mount the panel in step 2, add the "Describe this photo" action next to the media/alt-text fields.
- No backend, no store schema changes, no AI credits used. Copy stays plain-English for non-technical trade businesses.

Later, swapping `socialAiSuggest.ts` for a real Lovable AI call is a single-file change if you want live generation.
