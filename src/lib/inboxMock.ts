export type InboundChannel = "whatsapp" | "email" | "webform" | "facebook" | "call" | "sms";
export type ReplyChannel = "whatsapp" | "sms" | "email";
export type ConvStatus = "open" | "replied" | "lead" | "booked" | "done";

export interface Conversation { id: string; contactId: string; channel: InboundChannel; lastMessageAt: string; firstResponseAt: string | null; status: ConvStatus; unread: boolean }
export interface Message { id: string; conversationId: string; channel: InboundChannel; direction: "in" | "out" | "system"; body: string; createdAt: string; subject?: string; durationSec?: number }
export interface InboxContact { id: string; name: string; phone: string; email: string; address: string; postcode: string; estValue: number; source: { channel: string; campaign: string; adOrKeyword: string; landingPage: string; firstSeen: string } }

export type Sla = "fast" | "slow" | "overdue" | null;

/** SLA chip for conversations awaiting a first reply. Measured from the first inbound message. */
export function slaState(conv: Conversation, firstInboundAt: string, now: number): Sla {
  if (conv.firstResponseAt || conv.status === "done") return null;
  const mins = (now - new Date(firstInboundAt).getTime()) / 60000;
  if (mins > 60) return "overdue";
  if (mins >= 15) return "slow";
  if (mins < 5) return "fast";
  return "slow";
}

export type StatusFilter = "needs" | "all" | "done";
export function filterConversations(list: Conversation[], status: StatusFilter, channel: InboundChannel | "all") {
  return list.filter((c) => {
    if (channel !== "all" && c.channel !== channel) return false;
    if (status === "needs") return c.status !== "done" && !c.firstResponseAt;
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
    { id: "c8", name: "Mohammed Ali", phone: "07700 900617", email: "m.ali@gmail.com", address: "40 Moseley Road, Birmingham", postcode: "B12 0HP", estValue: 380, source: { channel: "Phone", campaign: "Google Business Profile", adOrKeyword: "Call button", landingPage: "—", firstSeen: ago(18, now) } },
    { id: "c9", name: "Grace Thompson", phone: "07700 900952", email: "grace.t@outlook.com", address: "6 Sharrow Vale Road, Sheffield", postcode: "S11 8ZA", estValue: 4100, source: { channel: "Facebook", campaign: "Organic page", adOrKeyword: "Post: before/after loft", landingPage: "—", firstSeen: ago(60 * 2, now) } },
    { id: "c10", name: "Oliver Bennett", phone: "07700 900183", email: "oliver.bennett@gmail.com", address: "12 Mill Road, Cambridge", postcode: "CB1 2AD", estValue: 950, source: { channel: "Google Ads", campaign: "Boiler Service", adOrKeyword: "annual boiler service cambridge", landingPage: "/servicing", firstSeen: ago(60 * 24 * 6, now) } },
    { id: "c11", name: "Chloe Evans", phone: "07700 900406", email: "chloe.evans@gmail.com", address: "27 Allerton Road, Liverpool", postcode: "L18 1LG", estValue: 6900, source: { channel: "Website", campaign: "Quote form", adOrKeyword: "solar panels liverpool", landingPage: "/solar", firstSeen: ago(3, now) } },
    { id: "c12", name: "Ben Robinson", phone: "07700 900799", email: "ben.r@btinternet.com", address: "9 Forest Road, Nottingham", postcode: "NG7 4EQ", estValue: 720, source: { channel: "Phone", campaign: "Van signage", adOrKeyword: "Tracking number 0115", landingPage: "—", firstSeen: ago(40, now) } },
  ];
  const M: Message[] = [];
  const C: Conversation[] = [];
  let n = 0;
  const conv = (id: string, contactId: string, channel: InboundChannel, status: ConvStatus, unread: boolean, msgs: [Message["direction"], number, string, InboundChannel?, Partial<Message>?][]) => {
    msgs.forEach(([direction, m, body, ch, extra]) => M.push({ id: `m${++n}`, conversationId: id, channel: ch ?? channel, direction, body, createdAt: ago(m, now), ...extra }));
    const out = msgs.filter((x) => x[0] === "out").map((x) => x[1]);
    C.push({ id, contactId, channel, status, unread, lastMessageAt: ago(Math.min(...msgs.map((x) => x[1])), now), firstResponseAt: out.length ? ago(Math.max(...out), now) : null });
  };
  conv("v1", "c1", "email", "replied", false, [["in", 60 * 24 * 3, "Hi, our Worcester boiler is 15 years old and keeps losing pressure. Could you quote for a combi replacement?", "email", { subject: "Boiler replacement quote" }], ["out", 60 * 24 * 3 - 12, "Hi Sarah, thanks for getting in touch. A new combi is typically £2,400–£3,200 fitted. Can we pop round for a free survey?", "email"]]);
  conv("v1b", "c1", "whatsapp", "open", true, [["in", 35, "Hi it's Sarah from Wilmslow Rd – is Thursday morning still possible for the survey?"], ["in", 33, "Also the pressure dropped to 0.5 bar again this morning 😩"]]);
  conv("v2", "c2", "facebook", "open", true, [["in", 60 * 5, "Saw your bathroom ad – does the £6,995 include tiling and a walk-in shower?"]]);
  conv("v3", "c3", "webform", "open", true, [["in", 2, "Form: Emergency electrician\nIssue: Half the sockets have tripped and won't reset\nPostcode: BS7 8AE\nBest time: ASAP"]]);
  conv("v4", "c4", "call", "open", true, [["in", 25, "Missed call – voicemail: \"Hi, we've got a leak through the ceiling after last night's rain, slate roof, need someone this week.\"", "call", { durationSec: 42 }]]);
  conv("v5", "c5", "whatsapp", "open", true, [["in", 9, "Hello! Interested in an air source heat pump. 3-bed semi, currently gas. Is the £7,500 grant still available?"]]);
  conv("v6", "c6", "email", "done", false, [["in", 60 * 26, "Alistair Grant recommended you. Need an EICR for a flat I'm letting out.", "email", { subject: "EICR for rental flat" }], ["out", 60 * 25, "Hi David, an EICR for a 2-bed flat is £165. We can do Tuesday 10am.", "email"], ["in", 60 * 24, "Perfect, book it in.", "email"], ["system", 60 * 24 - 5, "Survey booked · Tue 10:00 · Craig M."]]);
  conv("v7", "c7", "webform", "open", false, [["in", 95, "Form: Quote request\nService: Kitchen rewire\nDetails: Extension being built, need new circuits + under-cabinet lights\nBudget: £4,000–£6,000"]]);
  conv("v8", "c8", "call", "replied", false, [["in", 18, "Inbound call – dripping kitchen tap and a loose toilet seat, wants a handyman visit.", "call", { durationSec: 186 }], ["out", 15, "Thanks Mohammed, as discussed we'll send someone Friday between 1–3pm. Call-out is £75.", "sms"]]);
  conv("v9", "c9", "facebook", "open", false, [["in", 60 * 2, "Love the loft conversion you posted! Roughly what would a dormer cost on a terrace in S11?"]]);
  conv("v10", "c10", "email", "done", false, [["in", 60 * 24 * 6, "Can I book my annual boiler service?", "email", { subject: "Annual service" }], ["out", 60 * 24 * 6 - 4, "Of course – £89, next Monday 9am?", "email"], ["system", 60 * 24 * 5, "Job created · Boiler service · £89"]]);
  conv("v11", "c11", "webform", "open", true, [["in", 3, "Form: Solar quote\nRoof: South facing, approx 20m²\nMonthly bill: £180\nInterested in battery: Yes"]]);
  conv("v12", "c12", "call", "open", false, [["in", 40, "Missed call from 0115 tracking number – no voicemail.", "call", { durationSec: 0 }]]);
  return { contacts, conversations: C, messages: M };
}
