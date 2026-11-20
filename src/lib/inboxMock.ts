export type InboundChannel = "whatsapp" | "email" | "facebook" | "instagram" | "comment" | "review" | "sms";
/** facebook/instagram = private DM, comment = public reply under the post, review = public owner reply on Google Business Profile. */
export type ReplyChannel = "whatsapp" | "sms" | "email" | "facebook" | "instagram" | "comment" | "review";
/** List filters: Facebook and Instagram each cover both DMs and comments. */
export type ChannelFilter = "all" | "whatsapp" | "email" | "facebook" | "instagram" | "review";
export type SocialNetwork = "facebook" | "instagram";
export type ConvStatus = "open" | "replied" | "lead" | "booked" | "done";

export interface Conversation { id: string; contactId: string; channel: InboundChannel; lastMessageAt: string; firstResponseAt: string | null; status: ConvStatus; unread: boolean; network?: SocialNetwork }
export interface Message { id: string; conversationId: string; channel: InboundChannel; direction: "in" | "out" | "system"; body: string; createdAt: string; subject?: string; network?: SocialNetwork; post?: string; rating?: number }
export interface InboxContact { id: string; name: string; phone: string; email: string; address: string; postcode: string; estValue: number; source: { channel: string; campaign: string; adOrKeyword: string; landingPage: string; firstSeen: string } }

/** Reply options for a thread: the usual channels, plus a DM for each social network the contact used and a public reply when they commented. */
export function replyChannelsFor(thread: Message[]): ReplyChannel[] {
  const out: ReplyChannel[] = ["whatsapp", "sms", "email"];
  const add = (c: ReplyChannel) => { if (!out.includes(c)) out.push(c); };
  for (const m of thread) {
    if (m.channel === "facebook" || m.channel === "instagram") add(m.channel);
    if (m.channel === "comment") { add("comment"); if (m.network) add(m.network); }
    if (m.channel === "review") add("review");
  }
  return out;
}

/** Default reply channel: answer where the customer last wrote (comments and reviews get a public reply). */
export function defaultReplyChannel(thread: Message[]): ReplyChannel {
  const last = [...thread].reverse().find((m) => m.direction === "in")?.channel;
  if (last === "email" || last === "sms") return last;
  if (last === "facebook" || last === "instagram" || last === "comment" || last === "review") return last;
  return "whatsapp";
}

export type Sla = "fast" | "slow" | "overdue" | null;

/** SLA chip for conversations awaiting a first reply. Measured from the first inbound message. */
export function slaState(conv: Conversation, firstInboundAt: string, now: number): Sla {
  if (conv.firstResponseAt || conv.status !== "open") return null;
  const mins = (now - new Date(firstInboundAt).getTime()) / 60000;
  if (mins > 60) return "overdue";
  if (mins >= 15) return "slow";
  if (mins < 5) return "fast";
  return "slow";
}

export type StatusFilter = "needs" | "all" | "done";
/** Which filter a conversation belongs to: comments count under their network. */
export function filterKey(c: Conversation): Exclude<ChannelFilter, "all"> {
  if (c.channel === "comment") return c.network ?? "facebook";
  if (c.channel === "sms") return "whatsapp";
  return c.channel;
}

export function filterConversations(list: Conversation[], status: StatusFilter, channel: ChannelFilter) {
  return list.filter((c) => {
    if (channel !== "all" && filterKey(c) !== channel) return false;
    if (status === "needs") return c.status === "open" && !c.firstResponseAt;
    if (status === "done") return c.status === "done";
    return true;
  });
}

export function threadForContact(contactId: string, convs: Conversation[], msgs: Message[]) {
  const ids = new Set(convs.filter((c) => c.contactId === contactId).map((c) => c.id));
  return msgs.filter((m) => ids.has(m.conversationId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

const ago = (mins: number, now: number) => new Date(now - mins * 60000).toISOString();

export function buildMock(now = Date.now()) {
  const contacts: InboxContact[] = [
    { id: "c1", name: "Sarah Whitfield", phone: "07700 900412", email: "sarah.whitfield@gmail.com", address: "14 Wilmslow Road, Manchester", postcode: "M14 5TQ", estValue: 3200, source: { channel: "Google Ads", campaign: "Boiler Replacement – Manchester", adOrKeyword: "combi boiler replacement near me", landingPage: "/boiler-quote", firstSeen: ago(60 * 24 * 3, now) } },
    { id: "c2", name: "James O'Connor", phone: "07700 900128", email: "james.oconnor@outlook.com", address: "7 Headingley Lane, Leeds", postcode: "LS6 1BN", estValue: 8500, source: { channel: "Facebook Ads", campaign: "Bathroom Refit Spring", adOrKeyword: "Ad: 'Dream bathroom from £6,995'", landingPage: "/bathrooms", firstSeen: ago(60 * 5, now) } },
    { id: "c3", name: "Priya Shah", phone: "07700 900733", email: "priya.shah@btinternet.com", address: "22 Gloucester Road, Bristol", postcode: "BS7 8AE", estValue: 450, source: { channel: "Website", campaign: "Organic search", adOrKeyword: "electrician bristol emergency", landingPage: "/emergency-electrician", firstSeen: ago(2, now) } },
    { id: "c4", name: "Tom Hargreaves", phone: "07700 900561", email: "tom.h@yahoo.co.uk", address: "51 Lavender Hill, London", postcode: "SW11 5QN", estValue: 12400, source: { channel: "Google LSA", campaign: "Local Services – Roofing", adOrKeyword: "roofer battersea", landingPage: "—", firstSeen: ago(25, now) } },
    { id: "c5", name: "Emily Carter", phone: "07700 900874", email: "emily.carter@gmail.com", address: "3 Jesmond Road, Newcastle", postcode: "NE2 1NL", estValue: 2800, source: { channel: "WhatsApp", campaign: "Click-to-WhatsApp – Heat pumps", adOrKeyword: "Ad: 'Cut heating bills 40%'", landingPage: "—", firstSeen: ago(9, now) } },
    { id: "c6", name: "David Murray", phone: "07700 900245", email: "d.murray@icloud.com", address: "88 Bruntsfield Place, Edinburgh", postcode: "EH10 4HG", estValue: 1650, source: { channel: "Referral", campaign: "Customer referral", adOrKeyword: "Referred by A. Grant", landingPage: "/refer", firstSeen: ago(60 * 26, now) } },
    { id: "c7", name: "Hannah Lewis", phone: "07700 900390", email: "hannah.lewis@hotmail.co.uk", address: "19 Cathedral Road, Cardiff", postcode: "CF11 9HA", estValue: 5200, source: { channel: "Website", campaign: "Quote form", adOrKeyword: "kitchen rewire cost", landingPage: "/rewiring", firstSeen: ago(95, now) } },
    { id: "c8", name: "Mohammed Ali", phone: "07700 900617", email: "m.ali@gmail.com", address: "40 Moseley Road, Birmingham", postcode: "B12 0HP", estValue: 380, source: { channel: "Google review", campaign: "Google Business Profile", adOrKeyword: "★★★★★ review", landingPage: "—", firstSeen: ago(18, now) } },
    { id: "c9", name: "Grace Thompson", phone: "07700 900952", email: "grace.t@outlook.com", address: "6 Sharrow Vale Road, Sheffield", postcode: "S11 8ZA", estValue: 4100, source: { channel: "Facebook comment", campaign: "Organic page", adOrKeyword: "Post: before/after loft", landingPage: "—", firstSeen: ago(60 * 2, now) } },
    { id: "c10", name: "Oliver Bennett", phone: "07700 900183", email: "oliver.bennett@gmail.com", address: "12 Mill Road, Cambridge", postcode: "CB1 2AD", estValue: 950, source: { channel: "Google Ads", campaign: "Boiler Service", adOrKeyword: "annual boiler service cambridge", landingPage: "/servicing", firstSeen: ago(60 * 24 * 6, now) } },
    { id: "c11", name: "Chloe Evans", phone: "07700 900406", email: "chloe.evans@gmail.com", address: "27 Allerton Road, Liverpool", postcode: "L18 1LG", estValue: 6900, source: { channel: "Website", campaign: "Quote form", adOrKeyword: "solar panels liverpool", landingPage: "/solar", firstSeen: ago(3, now) } },
    { id: "c13", name: "Lucy Walsh", phone: "07700 900318", email: "lucy.walsh@gmail.com", address: "31 Ditchling Road, Brighton", postcode: "BN1 4SB", estValue: 2300, source: { channel: "Instagram DM", campaign: "Organic profile", adOrKeyword: "Reel: 'Kitchen splashback in 1 day'", landingPage: "—", firstSeen: ago(12, now) } },
    { id: "c14", name: "Ryan Patel", phone: "07700 900664", email: "ryan.patel@outlook.com", address: "15 Queens Road, Leicester", postcode: "LE2 1WP", estValue: 9800, source: { channel: "Instagram comment", campaign: "Instagram Ads – Garden rooms", adOrKeyword: "Ad: 'Garden office from £9,500'", landingPage: "—", firstSeen: ago(70, now) } },
    { id: "c15", name: "Fiona Clarke", phone: "07700 900507", email: "fiona.clarke@yahoo.co.uk", address: "4 Westgate, Chichester", postcode: "PO19 3EU", estValue: 1200, source: { channel: "Facebook comment", campaign: "Facebook Ads – Gutter clearing", adOrKeyword: "Ad: 'Gutters cleared from £95'", landingPage: "—", firstSeen: ago(4, now) } },
    { id: "c12", name: "Ben Robinson", phone: "07700 900799", email: "ben.r@btinternet.com", address: "9 Forest Road, Nottingham", postcode: "NG7 4EQ", estValue: 720, source: { channel: "Google review", campaign: "Google Business Profile", adOrKeyword: "★★ review", landingPage: "—", firstSeen: ago(40, now) } },
  ];
  const M: Message[] = [];
  const C: Conversation[] = [];
  let n = 0;
  const conv = (id: string, contactId: string, channel: InboundChannel, status: ConvStatus, unread: boolean, msgs: [Message["direction"], number, string, InboundChannel?, Partial<Message>?][]) => {
    msgs.forEach(([direction, m, body, ch, extra]) => M.push({ id: `m${++n}`, conversationId: id, channel: ch ?? channel, direction, body, createdAt: ago(m, now), ...extra }));
    const out = msgs.filter((x) => x[0] === "out").map((x) => x[1]);
    C.push({ id, contactId, channel, status, unread, network: msgs.find((x) => x[4]?.network)?.[4]?.network, lastMessageAt: ago(Math.min(...msgs.map((x) => x[1])), now), firstResponseAt: out.length ? ago(Math.max(...out), now) : null });
  };
  conv("v1", "c1", "email", "replied", false, [["in", 60 * 24 * 3, "Hi, our Worcester boiler is 15 years old and keeps losing pressure. Could you quote for a combi replacement?", "email", { subject: "Boiler replacement quote" }], ["out", 60 * 24 * 3 - 12, "Hi Sarah, thanks for getting in touch. A new combi is typically £2,400–£3,200 fitted. Can we pop round for a free survey?", "email"]]);
  conv("v1b", "c1", "whatsapp", "open", true, [["in", 35, "Hi it's Sarah from Wilmslow Rd – is Thursday morning still possible for the survey?"], ["in", 33, "Also the pressure dropped to 0.5 bar again this morning 😩"]]);
  conv("v2", "c2", "facebook", "open", true, [["in", 60 * 5, "Saw your bathroom ad – does the £6,995 include tiling and a walk-in shower?"]]);
  conv("v3", "c3", "email", "open", true, [["in", 2, "Hi, half the sockets in the house have tripped and won't reset. BS7 8AE – can someone come ASAP?", "email", { subject: "Emergency electrician" }]]);
  conv("v4", "c4", "whatsapp", "open", true, [["in", 25, "Hi, we've got a leak through the ceiling after last night's rain. Slate roof – need someone this week please."]]);
  conv("v5", "c5", "whatsapp", "open", true, [["in", 9, "Hello! Interested in an air source heat pump. 3-bed semi, currently gas. Is the £7,500 grant still available?"]]);
  conv("v6", "c6", "email", "done", false, [["in", 60 * 26, "Alistair Grant recommended you. Need an EICR for a flat I'm letting out.", "email", { subject: "EICR for rental flat" }], ["out", 60 * 25, "Hi David, an EICR for a 2-bed flat is £165. We can do Tuesday 10am.", "email"], ["in", 60 * 24, "Perfect, book it in.", "email"], ["system", 60 * 24 - 5, "Survey booked · Tue 10:00 · Craig M."]]);
  conv("v7", "c7", "email", "open", false, [["in", 95, "We're building an extension and need new circuits plus under-cabinet lights in the kitchen. Budget is around £4,000–£6,000.", "email", { subject: "Kitchen rewire quote" }]]);
  conv("v8", "c8", "review", "open", true, [["in", 18, "Craig fixed our dripping tap and a loose toilet seat in under an hour. Tidy, friendly and fairly priced. Will use again!", "review", { rating: 5 }]]);
  const loftPost = { network: "facebook" as const, post: "Before & after: dormer loft conversion in Sheffield" };
  conv("v9", "c9", "comment", "open", false, [["in", 60 * 2, "Love this! Roughly what would a dormer cost on a terrace in S11?", "comment", loftPost]]);
  conv("v13", "c13", "instagram", "open", true, [["in", 12, "Hiya! Saw your splashback reel 😍 do you cover Brighton? Kitchen is about 3m of worktop."]]);
  const gardenPost = { network: "instagram" as const, post: "Garden office from £9,500 – fitted in 5 days" };
  conv("v14", "c14", "comment", "replied", false, [["in", 70, "Does that price include electrics and planning?", "comment", gardenPost], ["out", 62, "Hi Ryan! Electrics are included, and most garden rooms don't need planning. Sent you a DM with details 👍", "comment", gardenPost], ["out", 61, "Hi Ryan, here's our garden room brochure. Happy to do a free site visit in LE2 – what day suits?", "instagram"]]);
  conv("v15", "c15", "comment", "open", true, [["in", 4, "How much for a 3-bed semi? Gutters overflowing every time it rains", "comment", { network: "facebook", post: "Gutters cleared from £95 – book this week" }]]);
  conv("v10", "c10", "email", "done", false, [["in", 60 * 24 * 6, "Can I book my annual boiler service?", "email", { subject: "Annual service" }], ["out", 60 * 24 * 6 - 4, "Of course – £89, next Monday 9am?", "email"], ["system", 60 * 24 * 5, "Job created · Boiler service · £89"]]);
  conv("v11", "c11", "email", "open", true, [["in", 3, "Hi, looking at solar for a south-facing roof, about 20m². Our bill is around £180 a month and we'd like a battery too.", "email", { subject: "Solar panel quote" }]]);
  conv("v12", "c12", "review", "open", false, [["in", 40, "Waited in all morning and nobody turned up or called. Rebooked for the afternoon and the work itself was fine, but the communication wasn't.", "review", { rating: 2 }]]);
  return { contacts, conversations: C, messages: M };
}
