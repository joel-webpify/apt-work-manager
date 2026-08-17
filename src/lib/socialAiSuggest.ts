import type { SocialChannel } from "@/lib/socialPostsStore";

export type PostTopic =
  | "finished-job"
  | "review"
  | "offer"
  | "hiring"
  | "seasonal-tip"
  | "before-after";

export type PostTone = "friendly" | "professional" | "punchy" | "chatty";

export const topicOptions: { id: PostTopic; label: string }[] = [
  { id: "finished-job", label: "Finished job" },
  { id: "review", label: "Customer review" },
  { id: "offer", label: "Offer" },
  { id: "hiring", label: "Hiring" },
  { id: "seasonal-tip", label: "Seasonal tip" },
  { id: "before-after", label: "Before & after" },
];

export const toneOptions: { id: PostTone; label: string }[] = [
  { id: "friendly", label: "Friendly" },
  { id: "professional", label: "Professional" },
  { id: "punchy", label: "Short & punchy" },
  { id: "chatty", label: "Chatty" },
];

export interface SuggestInput {
  topic: PostTopic;
  tone: PostTone;
  note?: string;
  location?: string;
}

const openers: Record<PostTopic, string[]> = {
  "finished-job": [
    "Another one wrapped up",
    "Job done and handed back",
    "Finished this one today",
    "Keys handed back — job complete",
  ],
  review: [
    "This landed in our inbox this week",
    "Lovely words from a customer",
    "Feedback like this makes the early starts worth it",
    "Straight from the customer",
  ],
  offer: [
    "Booking up for the next few weeks",
    "A little something for local customers",
    "Free quote, no pressure",
    "Sorting your quote this month",
  ],
  hiring: [
    "We are growing",
    "Looking for another pair of hands",
    "Join the team",
    "Hiring locally",
  ],
  "seasonal-tip": [
    "Quick tip before the weather turns",
    "One thing worth checking this month",
    "A small job now saves a big one later",
    "Two minutes of checking, months of peace of mind",
  ],
  "before-after": [
    "Same room, two very different days",
    "Before on the left, after on the right",
    "What a difference a week makes",
    "From tired to tidy",
  ],
};

const bodies: Record<PostTopic, string[]> = {
  "finished-job": [
    "Neat, tidy and finished on the day we promised.",
    "Planned properly, done once, cleaned up after.",
    "Straightforward work, no surprises on the invoice.",
  ],
  review: [
    "We turn up when we say we will and leave the place tidy — simple as that.",
    "Nothing fancy, just honest work and a clear price up front.",
    "If you want the same, drop us a message.",
  ],
  offer: [
    "Get in touch and we will come out, take a look and give you a fixed price.",
    "No call-out fee and a written quote you can actually read.",
    "Message us with a couple of photos and we can give you a ballpark today.",
  ],
  hiring: [
    "Reliable, tidy and happy to talk to customers — that matters more to us than a long CV.",
    "Good rates, steady local work and a van you will not be embarrassed by.",
    "Send us a message and we will have a proper chat.",
  ],
  "seasonal-tip": [
    "Give it a check now, and give us a shout if something does not look right.",
    "Most call-outs we get this time of year start as something small.",
    "Happy to talk it through even if it turns out to be nothing.",
  ],
  "before-after": [
    "Same space, properly planned and finished to a standard we are happy to put our name on.",
    "Swipe to see how it started.",
    "This is the sort of change a week of proper work makes.",
  ],
};

const closers: Record<PostTone, string[]> = {
  friendly: ["Give us a shout if you fancy something similar 👋", "Drop us a message any time.", "Always happy to help."],
  professional: ["Contact us for a free, no-obligation quote.", "Get in touch to arrange a site visit.", "Enquiries welcome."],
  punchy: ["Message us.", "Free quote. Fast reply.", "Book now."],
  chatty: [
    "Fancy the same? Pop us a message and we will sort it 😊",
    "Anyone else got one of these on the to-do list?",
    "Tell us what you are thinking and we will take it from there.",
  ],
};

const hashtagsByTopic: Record<PostTopic, string> = {
  "finished-job": "#localtrade #jobdone #homeimprovement",
  review: "#happycustomer #fivestar #localbusiness",
  offer: "#freequote #localoffer #bookingnow",
  hiring: "#hiring #jobsnearme #joinourteam",
  "seasonal-tip": "#hometips #maintenance #localtrade",
  "before-after": "#beforeandafter #transformation #renovation",
};

function pick<T>(list: T[], seed: number) {
  return list[Math.abs(seed) % list.length];
}

function sentenceCase(s: string) {
  const t = s.trim();
  if (!t) return t;
  return t[0].toUpperCase() + t.slice(1);
}

/** Builds one caption. `variant` shifts which fragments are used. */
function buildCaption(input: SuggestInput, variant: number) {
  const { topic, tone, note, location } = input;
  const opener = pick(openers[topic], variant);
  const body = pick(bodies[topic], variant + 1);
  const closer = pick(closers[tone], variant + 2);
  const where = location ? ` in ${location}` : "";
  const detail = note?.trim() ? `${sentenceCase(note.trim())}${/[.!?]$/.test(note.trim()) ? "" : "."}` : "";

  if (tone === "punchy") {
    return [`${opener}${where}.`, detail, closer].filter(Boolean).join(" ");
  }
  if (tone === "professional") {
    return [`${opener}${where}.`, detail, body, closer].filter(Boolean).join(" ");
  }
  return [`${opener}${where}.`, detail, body, "", closer].filter((p) => p !== undefined).join("\n").replace(/\n\n\n+/g, "\n\n").trim();
}

export function suggestCaptions(input: SuggestInput, shuffle = 0): string[] {
  return [0, 1, 2].map((i) => buildCaption(input, i * 3 + shuffle));
}

export function suggestHashtags(topic: PostTopic, location?: string) {
  const local = location ? ` #${location.replace(/[^a-zA-Z]/g, "").toLowerCase()}` : "";
  return `${hashtagsByTopic[topic]}${local}`.trim();
}

export function resizeCaption(text: string, target: "shorter" | "longer", input: SuggestInput) {
  if (target === "shorter") {
    const first = text.split(/\n|(?<=[.!?])\s/).filter(Boolean)[0] ?? text;
    const closer = pick(closers.punchy, 1);
    return `${first.trim()} ${closer}`.trim();
  }
  const extra = pick(bodies[input.topic], 2);
  const closer = pick(closers[input.tone], 0);
  return `${text.trim()}\n\n${extra} ${closer}`.trim();
}

const photoPhrases: Record<PostTopic, string> = {
  "finished-job": "the finished work, photographed after the final clean-up",
  review: "the completed job the customer left their review about",
  offer: "an example of the work included in this offer",
  hiring: "the team on site",
  "seasonal-tip": "the part of the property this tip is about",
  "before-after": "the space before and after the work",
};

export function describePhoto(input: SuggestInput): { altText: string; opener: string } {
  const note = input.note?.trim();
  const where = input.location ? ` at ${input.location}` : "";
  const altText = note
    ? `${sentenceCase(note)}${where}`.replace(/\.$/, "")
    : `Photo of ${photoPhrases[input.topic]}${where}`;
  const opener = note ? `${sentenceCase(note)} —` : `${pick(openers[input.topic], 0)}${where} —`;
  return { altText, opener };
}

export const bestTimeReasons: Record<SocialChannel, string> = {
  facebook: "Most of your customers check Facebook after work.",
  instagram: "Photos do best mid-morning and again in the evening.",
  linkedin: "Weekday mornings, when people are at their desks.",
  tiktok: "Late evening is when scrolling picks up.",
  x: "Short posts land best around commute times.",
};
