import { useEffect, useState } from "react";

export interface GbpHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface GbpProfile {
  name: string;
  category: string;
  phone: string;
  website: string;
  address: string;
  description: string;
  serviceArea: string;
  hours: GbpHours[];
  services: string[];
}

export interface GbpReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  daysAgo: number;
  reply?: string;
}

export type GbpPostType = "update" | "offer" | "event";

export interface GbpPost {
  id: string;
  type: GbpPostType;
  title: string;
  body: string;
  cta: string;
  ctaUrl: string;
  status: "draft" | "scheduled" | "published";
  date: string; // ISO date (yyyy-mm-dd)
  imageUrl?: string;
}

export interface GbpState {
  profile: GbpProfile;
  reviews: GbpReview[];
  posts: GbpPost[];
}

const KEY = "gbp-state-v1";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const today = () => new Date().toISOString().slice(0, 10);
const dayOffset = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const defaultState: GbpState = {
  profile: {
    name: "Bright & Clear Exterior Cleaning",
    category: "Window cleaning service",
    phone: "0117 496 0123",
    website: "https://brightandclear.co.uk",
    address: "12 Kingsdown Parade, Bristol BS6 5UD",
    description:
      "Family-run exterior cleaning team covering Bristol and the surrounding villages. Window cleaning, gutters, conservatory roofs and artificial grass installs — fully insured, same-week bookings.",
    serviceArea: "Bristol, Bath, Portishead, Clevedon (25 mile radius)",
    hours: DAYS.map((day, i) => ({
      day,
      open: "08:00",
      close: i === 5 ? "13:00" : "17:30",
      closed: i === 6,
    })),
    services: ["Window cleaning", "Gutter clearing", "Conservatory roof cleaning", "Artificial grass"],
  },
  reviews: [
    {
      id: "r1",
      author: "Hannah W.",
      rating: 5,
      text: "Turned up when they said they would and the windows have never looked better. Really tidy job.",
      daysAgo: 2,
    },
    {
      id: "r2",
      author: "Dev P.",
      rating: 5,
      text: "Booked gutters and a roof clean. Sent photos before and after — great communication.",
      daysAgo: 5,
      reply: "Thanks Dev, glad the photos helped. See you next autumn!",
    },
    {
      id: "r3",
      author: "Marie L.",
      rating: 4,
      text: "Good work overall, arrived a little later than the slot I was given.",
      daysAgo: 9,
    },
    {
      id: "r4",
      author: "Tom B.",
      rating: 3,
      text: "Windows fine but a couple of frames were missed on the back of the house.",
      daysAgo: 14,
    },
  ],
  posts: [
    {
      id: "p1",
      type: "offer",
      title: "£10 off your first gutter clean",
      body: "Book before the end of the month and we will take £10 off any gutter clearing job in Bristol.",
      cta: "Book now",
      ctaUrl: "https://brightandclear.co.uk/book",
      status: "published",
      date: dayOffset(-6),
    },
    {
      id: "p2",
      type: "update",
      title: "New conservatory roof service",
      body: "We now clean conservatory roofs inside and out — ask for a quote when you book your windows.",
      cta: "Learn more",
      ctaUrl: "https://brightandclear.co.uk/services",
      status: "scheduled",
      date: dayOffset(3),
    },
  ],
};

function load(): GbpState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultState;
}

let state: GbpState = load();
const listeners = new Set<(s: GbpState) => void>();

function commit(next: GbpState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(state));
}

export function useGbp() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}

export function saveProfile(profile: GbpProfile) {
  commit({ ...state, profile });
}

export function replyToReview(id: string, reply: string) {
  commit({
    ...state,
    reviews: state.reviews.map((r) => (r.id === id ? { ...r, reply: reply.trim() || undefined } : r)),
  });
}

export function upsertPost(post: GbpPost) {
  const exists = state.posts.some((p) => p.id === post.id);
  commit({
    ...state,
    posts: exists ? state.posts.map((p) => (p.id === post.id ? post : p)) : [post, ...state.posts],
  });
}

export function deletePost(id: string) {
  commit({ ...state, posts: state.posts.filter((p) => p.id !== id) });
}

export function newPost(): GbpPost {
  return {
    id: `p${Date.now()}`,
    type: "update",
    title: "",
    body: "",
    cta: "Book now",
    ctaUrl: state.profile.website,
    status: "draft",
    date: today(),
  };
}

export function suggestedReply(review: GbpReview, businessName: string) {
  const first = review.author.split(" ")[0];
  if (review.rating >= 4) {
    return `Thanks so much for the kind words, ${first} — really glad you are happy with the job. We will see you next time!\n\n${businessName}`;
  }
  return `Thanks for the honest feedback, ${first}. Sorry we missed the mark — we would like to put it right. Give us a call and we will come back out at no charge.\n\n${businessName}`;
}

export const DAY_NAMES = DAYS;
