export type LifecycleState = "Lead" | "Customer" | "Lapsed";
export type ContactType = "Residential" | "Commercial";
export type PipelineStage =
  | "New enquiry"
  | "Quote sent"
  | "Job booked"
  | "In progress"
  | "Completed"
  | "Invoiced"
  | "Paid";

export const stages: PipelineStage[] = [
  "New enquiry",
  "Quote sent",
  "Job booked",
  "In progress",
  "Completed",
  "Invoiced",
  "Paid",
];

export const stageColors: Record<PipelineStage, string> = {
  "New enquiry": "hsl(var(--info))",
  "Quote sent": "hsl(var(--warning))",
  "Job booked": "hsl(var(--info))",
  "In progress": "hsl(var(--warning))",
  Completed: "hsl(var(--success))",
  Invoiced: "hsl(var(--warning))",
  Paid: "hsl(var(--success))",
};

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  phone: string;
  email: string;
  source: string;
  lifecycle: LifecycleState;
  lastJob: string;
  totalSpend: number;
  postcode: string;
  notes?: string;
}

export type Trade =
  | "Plumbing"
  | "Electrical"
  | "Window cleaning"
  | "Landscaping"
  | "General";

export interface Employee {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string; // hsl token reference
  trades: Trade[];
  postcodes: string[]; // service area prefixes e.g. "BS", "BA"
  workingDays: number[]; // 0=Sun..6=Sat
  workStart: string; // "08:00"
  workEnd: string; // "17:00"
  daysOff: string[]; // ISO dates "2026-04-22"
  capacityHoursPerDay: number;
  phone: string;
}

export interface JobAssignment {
  employeeId: string;
  /** ISO date "2026-04-22" */
  date: string;
  /** "08:30" */
  start: string;
  /** hours */
  duration: number;
}

export interface Job {
  id: string;
  contactId: string;
  customer: string;
  service: string;
  trade?: Trade;
  value: number;
  stage: PipelineStage;
  daysInStage: number;
  address: string;
  postcode?: string;
  notes: string;
  quoteValue: number;
  invoiceId?: string;
  estimatedHours?: number;
  assignments?: JobAssignment[];
  timeline: { type: "sms" | "email" | "note"; text: string; date: string }[];
}

export const employees: Employee[] = [
  {
    id: "e1",
    name: "Daniel Pearce",
    initials: "DP",
    role: "Lead plumber",
    color: "199 89% 48%",
    trades: ["Plumbing", "General"],
    postcodes: ["BS", "BA"],
    workingDays: [1, 2, 3, 4, 5, 6],
    workStart: "07:30",
    workEnd: "17:30",
    daysOff: [],
    capacityHoursPerDay: 9,
    phone: "07700 900201",
  },
  {
    id: "e2",
    name: "Aisha Khan",
    initials: "AK",
    role: "Electrician",
    color: "262 83% 58%",
    trades: ["Electrical"],
    postcodes: ["BS", "BA"],
    workingDays: [1, 2, 3, 4, 5],
    workStart: "08:00",
    workEnd: "17:00",
    daysOff: [],
    capacityHoursPerDay: 8,
    phone: "07700 900202",
  },
  {
    id: "e3",
    name: "Marcus Reed",
    initials: "MR",
    role: "Window cleaner",
    color: "142 71% 45%",
    trades: ["Window cleaning"],
    postcodes: ["BS"],
    workingDays: [1, 2, 3, 4, 5, 6],
    workStart: "07:00",
    workEnd: "16:00",
    daysOff: [],
    capacityHoursPerDay: 8,
    phone: "07700 900203",
  },
  {
    id: "e4",
    name: "Liam O'Connor",
    initials: "LO",
    role: "Window cleaner",
    color: "32 95% 55%",
    trades: ["Window cleaning", "General"],
    postcodes: ["BS", "BA"],
    workingDays: [1, 2, 3, 4, 5],
    workStart: "07:00",
    workEnd: "16:00",
    daysOff: [],
    capacityHoursPerDay: 8,
    phone: "07700 900204",
  },
  {
    id: "e5",
    name: "Priya Shah",
    initials: "PS",
    role: "Landscaper",
    color: "340 82% 55%",
    trades: ["Landscaping", "General"],
    postcodes: ["BS", "BA"],
    workingDays: [2, 3, 4, 5, 6],
    workStart: "08:00",
    workEnd: "17:00",
    daysOff: [],
    capacityHoursPerDay: 8,
    phone: "07700 900205",
  },
  {
    id: "e6",
    name: "Tom Bradley",
    initials: "TB",
    role: "Apprentice",
    color: "172 66% 45%",
    trades: ["Plumbing", "Electrical", "General"],
    postcodes: ["BS", "BA"],
    workingDays: [1, 2, 3, 4, 5],
    workStart: "08:00",
    workEnd: "17:00",
    daysOff: [],
    capacityHoursPerDay: 8,
    phone: "07700 900206",
  },
];

export const contacts: Contact[] = [
  {
    id: "c1",
    name: "Sarah Whitcombe",
    type: "Residential",
    phone: "07700 900123",
    email: "sarah.w@gmail.com",
    source: "Google Ads",
    lifecycle: "Customer",
    lastJob: "12 Apr 2026",
    totalSpend: 840,
    postcode: "BS8 4QE",
    notes: "Prefers afternoon appointments. Has two Labradors.",
  },
  {
    id: "c2",
    name: "Marlow & Pierce Solicitors",
    type: "Commercial",
    phone: "0117 946 2200",
    email: "facilities@marlowpierce.co.uk",
    source: "Referral",
    lifecycle: "Customer",
    lastJob: "08 Apr 2026",
    totalSpend: 4280,
    postcode: "BS1 5UH",
    notes: "Quarterly window cleaning contract. Invoice via PO.",
  },
  {
    id: "c3",
    name: "James Okafor",
    type: "Residential",
    phone: "07700 900456",
    email: "j.okafor@outlook.com",
    source: "Website form",
    lifecycle: "Lead",
    lastJob: "—",
    totalSpend: 0,
    postcode: "BS9 2DE",
  },
  {
    id: "c4",
    name: "Highfield Primary School",
    type: "Commercial",
    phone: "0117 903 8800",
    email: "office@highfieldprimary.org.uk",
    source: "Local Service Ads",
    lifecycle: "Customer",
    lastJob: "02 Apr 2026",
    totalSpend: 1950,
    postcode: "BS4 3HP",
  },
  {
    id: "c5",
    name: "Dawn Hartley",
    type: "Residential",
    phone: "07700 900789",
    email: "dawn.hartley@yahoo.co.uk",
    source: "Facebook",
    lifecycle: "Lapsed",
    lastJob: "14 Sep 2024",
    totalSpend: 320,
    postcode: "BA2 6QH",
  },
  {
    id: "c6",
    name: "Riverside Cafe Ltd",
    type: "Commercial",
    phone: "0117 924 1100",
    email: "ben@riversidecafe.co.uk",
    source: "Google Ads",
    lifecycle: "Lead",
    lastJob: "—",
    totalSpend: 0,
    postcode: "BS1 6XN",
  },
];

export const jobs: Job[] = [
  { id: "j1", contactId: "c3", customer: "James Okafor", service: "Plumbing — leak repair", value: 180, stage: "New enquiry", daysInStage: 1, address: "14 Elm Grove, Bristol BS9 2DE", notes: "Slow leak under kitchen sink.", quoteValue: 180, timeline: [{ type: "email", text: "Enquiry received via website form", date: "19 Apr" }] },
  { id: "j2", contactId: "c6", customer: "Riverside Cafe Ltd", service: "Window cleaning — monthly", value: 240, stage: "New enquiry", daysInStage: 2, address: "8 Welsh Back, Bristol BS1 6XN", notes: "Large frontage, 12 panels.", quoteValue: 240, timeline: [] },
  { id: "j3", contactId: "c1", customer: "Sarah Whitcombe", service: "Artificial grass install", value: 2850, stage: "Quote sent", daysInStage: 3, address: "22 Whiteladies Rd, Bristol BS8 4QE", notes: "45 sqm rear garden. Wants premium grade.", quoteValue: 2850, timeline: [{ type: "email", text: "Quote sent", date: "16 Apr" }] },
  { id: "j4", contactId: "c5", customer: "Dawn Hartley", service: "Electrical — consumer unit", value: 620, stage: "Quote sent", daysInStage: 5, address: "3 Lyncombe Hill, Bath BA2 6QH", notes: "Replace old fuse box.", quoteValue: 620, timeline: [{ type: "sms", text: "Quote follow-up sent", date: "17 Apr" }] },
  { id: "j5", contactId: "c4", customer: "Highfield Primary School", service: "Window cleaning — termly", value: 480, stage: "Job booked", daysInStage: 1, address: "Highfield Rd, Bristol BS4 3HP", notes: "Half term week. Access via reception.", quoteValue: 480, timeline: [] },
  { id: "j6", contactId: "c2", customer: "Marlow & Pierce Solicitors", service: "Window cleaning — quarterly", value: 320, stage: "Job booked", daysInStage: 2, address: "44 Queen Sq, Bristol BS1 5UH", notes: "", quoteValue: 320, timeline: [] },
  { id: "j7", contactId: "c1", customer: "Sarah Whitcombe", service: "Plumbing — bathroom tap", value: 145, stage: "In progress", daysInStage: 1, address: "22 Whiteladies Rd, Bristol BS8 4QE", notes: "On site now.", quoteValue: 145, timeline: [] },
  { id: "j8", contactId: "c4", customer: "Highfield Primary School", service: "Electrical — PAT testing", value: 380, stage: "In progress", daysInStage: 1, address: "Highfield Rd, Bristol BS4 3HP", notes: "32 items.", quoteValue: 380, timeline: [] },
  { id: "j9", contactId: "c2", customer: "Marlow & Pierce Solicitors", service: "Window cleaning — quarterly", value: 320, stage: "Completed", daysInStage: 2, address: "44 Queen Sq, Bristol BS1 5UH", notes: "Job done. Awaiting invoice.", quoteValue: 320, timeline: [] },
  { id: "j10", contactId: "c1", customer: "Sarah Whitcombe", service: "Window cleaning — bi-monthly", value: 65, stage: "Invoiced", daysInStage: 4, address: "22 Whiteladies Rd, Bristol BS8 4QE", notes: "", quoteValue: 65, invoiceId: "INV-1042", timeline: [{ type: "email", text: "Invoice INV-1042 sent", date: "15 Apr" }] },
  { id: "j11", contactId: "c4", customer: "Highfield Primary School", service: "Plumbing — drainage", value: 1090, stage: "Invoiced", daysInStage: 8, address: "Highfield Rd, Bristol BS4 3HP", notes: "30-day terms.", quoteValue: 1090, invoiceId: "INV-1041", timeline: [] },
  { id: "j12", contactId: "c2", customer: "Marlow & Pierce Solicitors", service: "Artificial grass — courtyard", value: 1840, stage: "Paid", daysInStage: 3, address: "44 Queen Sq, Bristol BS1 5UH", notes: "Paid by bank transfer.", quoteValue: 1840, invoiceId: "INV-1038", timeline: [{ type: "email", text: "Payment received", date: "16 Apr" }] },
];

export const campaigns = [
  { id: "ca1", name: "Spring window cleaning offer", segment: "Residential — Bristol BS", status: "Sent" as const, sendDate: "08 Apr 2026", openRate: 42.3, clickRate: 6.8, jobs: 14 },
  { id: "ca2", name: "Artificial grass — early summer", segment: "Past quote, no booking", status: "Scheduled" as const, sendDate: "24 Apr 2026", openRate: 0, clickRate: 0, jobs: 0 },
  { id: "ca3", name: "Annual electrical safety check", segment: "Customers — last 24 months", status: "Draft" as const, sendDate: "—", openRate: 0, clickRate: 0, jobs: 0 },
];

export const automations = [
  { id: "au1", name: "Post-job review request", active: true, trigger: "Job marked Paid", steps: 3 },
  { id: "au2", name: "Lapsed customer win-back", active: true, trigger: "No job in 12 months", steps: 4 },
  { id: "au3", name: "Annual service reminder", active: false, trigger: "1 year since last job", steps: 2 },
];

export type BiddingStrategy =
  | "Maximize conversions"
  | "Maximize conversion value"
  | "Target CPA"
  | "Target ROAS";

export interface AssetGroupSitelink {
  text: string;
  url: string;
}

export interface AssetGroup {
  id: string;
  name: string;
  status: "Enabled" | "Paused" | "Removed";
  finalUrl: string;
  finalMobileUrl?: string;
  // Text assets — Google Ads PMax limits
  headlines: string[]; // 3–15, max 30 chars
  longHeadlines: string[]; // 1–5, max 90 chars
  descriptions: string[]; // 2–5, max 90 chars (1 short ≤60)
  businessName: string;
  callToAction?: string;
  // Media assets — referenced by URL/path
  marketingImages: string[]; // 1.91:1, 1+
  squareImages: string[]; // 1:1, 1+
  portraitImages?: string[]; // 4:5, optional
  logos: string[]; // 1:1, 1+
  landscapeLogos?: string[]; // 4:1, optional
  videos?: string[]; // YouTube URLs
  // Audience & extensions per asset group
  audienceSignal?: string;
  callouts: string[];
  sitelinks: AssetGroupSitelink[];
}

export interface PMaxSettings {
  dailyBudget: number;
  bidding: BiddingStrategy;
  targetCpa?: number;
  targetRoas?: number;
  conversionGoals: string[];
  locations: string[];
  languages: string[];
  startDate: string;
  endDate?: string;
  finalUrl: string;
  finalUrlExpansion: boolean;
  adSchedule: string;
  audienceSignals: string[];
  searchThemes: string[];
  assetGroups: AssetGroup[];
  brandExclusions: string[];
}

export interface LSASettings {
  weeklyBudget: number;
  serviceAreas: string[];
  servicesOffered: string[];
  businessHours: string;
  leadTypes: ("Phone call" | "Message")[];
  bidMode: "Maximize leads" | "Set max per lead";
  maxPerLead?: number;
}

export interface AdsCampaign {
  id: string;
  name: string;
  type: "LSA" | "PMax";
  status: "Active" | "Paused" | "Removed";
  weeklySpend: number;
  leads: number;
  costPerLead: number;
  jobsAttributed: number;
  pmax?: PMaxSettings;
  lsa?: LSASettings;
}

export const adsCampaigns: AdsCampaign[] = [
  {
    id: "ad1",
    name: "Bristol plumbing — LSA",
    type: "LSA",
    status: "Active",
    weeklySpend: 340,
    leads: 18,
    costPerLead: 18.9,
    jobsAttributed: 7,
    lsa: {
      weeklyBudget: 400,
      serviceAreas: ["Bristol", "Bath", "Weston-super-Mare"],
      servicesOffered: ["Emergency plumbing", "Leak repair", "Boiler repair"],
      businessHours: "Mon–Sat, 7:00–19:00",
      leadTypes: ["Phone call", "Message"],
      bidMode: "Maximize leads",
    },
  },
  {
    id: "ad2",
    name: "Window cleaning — PMax",
    type: "PMax",
    status: "Active",
    weeklySpend: 280,
    leads: 12,
    costPerLead: 23.3,
    jobsAttributed: 5,
    pmax: {
      dailyBudget: 40,
      bidding: "Maximize conversions",
      targetCpa: 25,
      conversionGoals: ["Quote request", "Phone call", "Form submission"],
      locations: ["Bristol BS postcodes", "Bath BA postcodes"],
      languages: ["English"],
      startDate: "2026-01-15",
      finalUrl: "https://example.co.uk/window-cleaning",
      finalUrlExpansion: true,
      adSchedule: "Mon–Fri 08:00–18:00",
      audienceSignals: ["Past customers", "Homeowners 35–65", "Local business owners"],
      searchThemes: ["window cleaning near me", "commercial window cleaners bristol"],
      assetGroups: [
        {
          id: "ag1",
          name: "Bristol residential",
          status: "Enabled",
          finalUrl: "https://example.co.uk/window-cleaning/bristol",
          headlines: [
            "Bristol Window Cleaners",
            "5★ Local Window Cleaning",
            "Free Quote in 24 Hours",
            "Streak-Free Guaranteed",
            "Reliable Monthly Service",
          ],
          longHeadlines: [
            "Trusted Bristol window cleaners — book online in under a minute",
            "Sparkling windows, every visit — fully insured local team",
          ],
          descriptions: [
            "Friendly local team. Pure water poles. Fully insured.",
            "Get a free no-obligation quote today — most jobs booked within 48 hours.",
            "Residential & commercial. Monthly, bi-monthly or one-off cleans.",
          ],
          businessName: "Tidy Trades Window Cleaning",
          callToAction: "Get quote",
          marketingImages: ["/placeholder.svg", "/placeholder.svg"],
          squareImages: ["/placeholder.svg"],
          logos: ["/placeholder.svg"],
          audienceSignal: "Homeowners 35–65 in BS postcodes",
          callouts: ["Fully insured", "5★ Google reviews", "Same-week booking"],
          sitelinks: [
            { text: "Get a quote", url: "https://example.co.uk/quote" },
            { text: "Our services", url: "https://example.co.uk/services" },
          ],
        },
        {
          id: "ag2",
          name: "Bath commercial",
          status: "Paused",
          finalUrl: "https://example.co.uk/window-cleaning/commercial",
          headlines: [
            "Commercial Window Cleaning",
            "Bath & Bristol Contracts",
            "Out-of-Hours Available",
          ],
          longHeadlines: ["Reliable commercial window cleaning contracts across Bath & Bristol"],
          descriptions: [
            "Scheduled contracts for offices, shops and schools.",
            "Method statements & RAMS provided. Fully insured to £5m.",
          ],
          businessName: "Tidy Trades Commercial",
          callToAction: "Request callback",
          marketingImages: ["/placeholder.svg"],
          squareImages: ["/placeholder.svg"],
          logos: ["/placeholder.svg"],
          callouts: ["Method statements", "£5m insurance"],
          sitelinks: [{ text: "Commercial", url: "https://example.co.uk/commercial" }],
        },
      ],
      brandExclusions: [],
    },
  },
];

export const forms = [
  { id: "f1", name: "Window cleaning quote", trade: "Window cleaning", submissions: 38, conversionRate: 31.6 },
  { id: "f2", name: "Artificial grass enquiry", trade: "Landscaping", submissions: 22, conversionRate: 45.5 },
  { id: "f3", name: "Emergency plumbing callout", trade: "Plumbing", submissions: 14, conversionRate: 78.6 },
];

export const formSubmissions = [
  { id: "fs1", contact: "James Okafor", service: "Plumbing", postcode: "BS9 2DE", date: "19 Apr 14:22" },
  { id: "fs2", contact: "Riverside Cafe Ltd", service: "Window cleaning", postcode: "BS1 6XN", date: "18 Apr 09:14" },
  { id: "fs3", contact: "Helen Marsh", service: "Artificial grass", postcode: "BS7 8AA", date: "17 Apr 19:48" },
  { id: "fs4", contact: "Tom Bradbury", service: "Electrical", postcode: "BA1 2QH", date: "17 Apr 11:02" },
];

export const trackingEvents = [
  { id: "t1", event: "form_submit", page: "/quote/window-cleaning", utm: "google / cpc", time: "14:22" },
  { id: "t2", event: "form_start", page: "/quote/window-cleaning", utm: "google / cpc", time: "14:21" },
  { id: "t3", event: "form_view", page: "/quote/artificial-grass", utm: "facebook / social", time: "13:48" },
  { id: "t4", event: "form_submit", page: "/quote/plumbing", utm: "google / lsa", time: "11:02" },
  { id: "t5", event: "form_view", page: "/quote/plumbing", utm: "direct / none", time: "10:55" },
];
