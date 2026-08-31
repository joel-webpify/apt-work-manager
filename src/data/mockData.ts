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
  timeline: { type: "email" | "note"; text: string; date: string }[];
  /** Values for user-defined fields, keyed by field id. */
  customFields?: Record<string, string | number | boolean>;
  /** Per-job checklist of milestones. */
  milestones?: { id: string; label: string; done: boolean }[];
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

// Week of Mon 2026-05-04 used for sample assignments
export const jobs: Job[] = [
  { id: "j1", contactId: "c3", customer: "James Okafor", service: "Plumbing — leak repair", trade: "Plumbing", value: 180, stage: "New enquiry", daysInStage: 1, address: "14 Elm Grove, Bristol BS9 2DE", postcode: "BS9", notes: "Slow leak under kitchen sink.", quoteValue: 180, estimatedHours: 2, assignments: [], timeline: [{ type: "email", text: "Enquiry received via website form", date: "19 Apr" }] },
  { id: "j2", contactId: "c6", customer: "Riverside Cafe Ltd", service: "Window cleaning — monthly", trade: "Window cleaning", value: 240, stage: "New enquiry", daysInStage: 2, address: "8 Welsh Back, Bristol BS1 6XN", postcode: "BS1", notes: "Large frontage, 12 panels.", quoteValue: 240, estimatedHours: 3, assignments: [], timeline: [] },
  { id: "j3", contactId: "c1", customer: "Sarah Whitcombe", service: "Artificial grass install", trade: "Landscaping", value: 2850, stage: "Quote sent", daysInStage: 3, address: "22 Whiteladies Rd, Bristol BS8 4QE", postcode: "BS8", notes: "45 sqm rear garden. Wants premium grade.", quoteValue: 2850, estimatedHours: 16, assignments: [], timeline: [{ type: "email", text: "Quote sent", date: "16 Apr" }] },
  { id: "j4", contactId: "c5", customer: "Dawn Hartley", service: "Electrical — consumer unit", trade: "Electrical", value: 620, stage: "Quote sent", daysInStage: 5, address: "3 Lyncombe Hill, Bath BA2 6QH", postcode: "BA2", notes: "Replace old fuse box.", quoteValue: 620, estimatedHours: 5, assignments: [], timeline: [{ type: "email", text: "Quote follow-up sent", date: "17 Apr" }] },
  { id: "j5", contactId: "c4", customer: "Highfield Primary School", service: "Window cleaning — termly", trade: "Window cleaning", value: 480, stage: "Job booked", daysInStage: 1, address: "Highfield Rd, Bristol BS4 3HP", postcode: "BS4", notes: "Half term week. Access via reception.", quoteValue: 480, estimatedHours: 5, assignments: [
    { employeeId: "e3", date: "2026-05-05", start: "08:00", duration: 5 },
    { employeeId: "e4", date: "2026-05-05", start: "08:00", duration: 5 },
  ], timeline: [] },
  { id: "j6", contactId: "c2", customer: "Marlow & Pierce Solicitors", service: "Window cleaning — quarterly", trade: "Window cleaning", value: 320, stage: "Job booked", daysInStage: 2, address: "44 Queen Sq, Bristol BS1 5UH", postcode: "BS1", notes: "", quoteValue: 320, estimatedHours: 4, assignments: [
    { employeeId: "e3", date: "2026-05-06", start: "08:00", duration: 4 },
  ], timeline: [] },
  { id: "j7", contactId: "c1", customer: "Sarah Whitcombe", service: "Plumbing — bathroom tap", trade: "Plumbing", value: 145, stage: "In progress", daysInStage: 1, address: "22 Whiteladies Rd, Bristol BS8 4QE", postcode: "BS8", notes: "On site now.", quoteValue: 145, estimatedHours: 2, assignments: [
    { employeeId: "e1", date: "2026-05-04", start: "09:00", duration: 2 },
  ], timeline: [] },
  { id: "j8", contactId: "c4", customer: "Highfield Primary School", service: "Electrical — PAT testing", trade: "Electrical", value: 380, stage: "In progress", daysInStage: 1, address: "Highfield Rd, Bristol BS4 3HP", postcode: "BS4", notes: "32 items.", quoteValue: 380, estimatedHours: 4, assignments: [
    { employeeId: "e2", date: "2026-05-04", start: "08:30", duration: 4 },
    { employeeId: "e6", date: "2026-05-04", start: "08:30", duration: 4 },
  ], timeline: [] },
  { id: "j9", contactId: "c2", customer: "Marlow & Pierce Solicitors", service: "Window cleaning — quarterly", trade: "Window cleaning", value: 320, stage: "Completed", daysInStage: 2, address: "44 Queen Sq, Bristol BS1 5UH", postcode: "BS1", notes: "Job done. Awaiting invoice.", quoteValue: 320, estimatedHours: 4, assignments: [], timeline: [] },
  { id: "j10", contactId: "c1", customer: "Sarah Whitcombe", service: "Window cleaning — bi-monthly", trade: "Window cleaning", value: 65, stage: "Invoiced", daysInStage: 4, address: "22 Whiteladies Rd, Bristol BS8 4QE", postcode: "BS8", notes: "", quoteValue: 65, estimatedHours: 1, invoiceId: "INV-1042", assignments: [], timeline: [{ type: "email", text: "Invoice INV-1042 sent", date: "15 Apr" }] },
  { id: "j11", contactId: "c4", customer: "Highfield Primary School", service: "Plumbing — drainage", trade: "Plumbing", value: 1090, stage: "Invoiced", daysInStage: 8, address: "Highfield Rd, Bristol BS4 3HP", postcode: "BS4", notes: "30-day terms.", quoteValue: 1090, estimatedHours: 6, invoiceId: "INV-1041", assignments: [], timeline: [] },
  { id: "j12", contactId: "c2", customer: "Marlow & Pierce Solicitors", service: "Artificial grass — courtyard", trade: "Landscaping", value: 1840, stage: "Paid", daysInStage: 3, address: "44 Queen Sq, Bristol BS1 5UH", postcode: "BS1", notes: "Paid by bank transfer.", quoteValue: 1840, estimatedHours: 12, invoiceId: "INV-1038", assignments: [], timeline: [{ type: "email", text: "Payment received", date: "16 Apr" }] },
  { id: "j13", contactId: "c1", customer: "Sarah Whitcombe", service: "Plumbing — radiator swap", trade: "Plumbing", value: 320, stage: "Job booked", daysInStage: 0, address: "22 Whiteladies Rd, Bristol BS8 4QE", postcode: "BS8", notes: "Bring 2 new TRVs.", quoteValue: 320, estimatedHours: 3, assignments: [
    { employeeId: "e1", date: "2026-05-06", start: "09:00", duration: 3 },
    { employeeId: "e6", date: "2026-05-06", start: "09:00", duration: 3 },
  ], timeline: [] },
  { id: "j14", contactId: "c5", customer: "Dawn Hartley", service: "Garden tidy & turf top-up", trade: "Landscaping", value: 540, stage: "Job booked", daysInStage: 0, address: "3 Lyncombe Hill, Bath BA2 6QH", postcode: "BA2", notes: "", quoteValue: 540, estimatedHours: 6, assignments: [
    { employeeId: "e5", date: "2026-05-07", start: "08:30", duration: 6 },
  ], timeline: [] },
  { id: "j15", contactId: "c4", customer: "Highfield Primary School", service: "Window clean — staff block", trade: "Window cleaning", value: 180, stage: "Job booked", daysInStage: 0, address: "Highfield Rd, Bristol BS4 3HP", postcode: "BS4", notes: "After 15:30 only.", quoteValue: 180, estimatedHours: 2, assignments: [
    { employeeId: "e4", date: "2026-05-08", start: "15:30", duration: 2 },
  ], timeline: [] },
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

export type ProductUnit = "each" | "hour" | "day" | "sqm" | "m" | "visit";

export interface Product {
  id: string;
  name: string;
  description?: string;
  trade: Trade;
  unit: ProductUnit;
  price: number; // unit price excl. VAT
  taxRate: number; // % e.g. 20
  sku?: string;
  active: boolean;
}

export const products: Product[] = [
  {
    id: "p1",
    name: "Window cleaning — standard visit",
    description: "Exterior pure-water clean, up to 12 panels.",
    trade: "Window cleaning",
    unit: "visit",
    price: 35,
    taxRate: 20,
    sku: "WC-STD",
    active: true,
  },
  {
    id: "p2",
    name: "Window cleaning — commercial frontage",
    description: "Per panel, ground floor commercial.",
    trade: "Window cleaning",
    unit: "each",
    price: 4.5,
    taxRate: 20,
    sku: "WC-COM",
    active: true,
  },
  {
    id: "p3",
    name: "Plumbing labour",
    description: "Standard hourly labour, parts billed separately.",
    trade: "Plumbing",
    unit: "hour",
    price: 65,
    taxRate: 20,
    sku: "PL-LAB",
    active: true,
  },
  {
    id: "p4",
    name: "Emergency callout",
    description: "Out-of-hours callout, first hour included.",
    trade: "Plumbing",
    unit: "each",
    price: 120,
    taxRate: 20,
    sku: "PL-EMG",
    active: true,
  },
  {
    id: "p5",
    name: "Electrical labour",
    trade: "Electrical",
    unit: "hour",
    price: 70,
    taxRate: 20,
    sku: "EL-LAB",
    active: true,
  },
  {
    id: "p6",
    name: "Consumer unit replacement",
    description: "Supply & install 10-way RCBO unit.",
    trade: "Electrical",
    unit: "each",
    price: 520,
    taxRate: 20,
    sku: "EL-CU10",
    active: true,
  },
  {
    id: "p7",
    name: "Artificial grass — premium",
    description: "Supply & install per sqm, includes prep.",
    trade: "Landscaping",
    unit: "sqm",
    price: 58,
    taxRate: 20,
    sku: "LS-AGP",
    active: true,
  },
  {
    id: "p8",
    name: "Garden tidy",
    description: "Per labour day, two operatives.",
    trade: "Landscaping",
    unit: "day",
    price: 280,
    taxRate: 20,
    sku: "LS-TDY",
    active: true,
  },
];

export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Declined" | "Expired";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue" | "Void";

/** How a line behaves on the customer-facing quote. Undefined = "included". */
export type QuoteLineKind = "included" | "choice" | "optional";

export interface QuoteLineItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  qty: number;
  unit: ProductUnit;
  unitPrice: number;
  taxRate: number;
  discount?: number; // %
  kind?: QuoteLineKind;
  groupId?: string; // choice lines only — alternatives share a group
  groupLabel?: string; // e.g. "Boiler"
  defaultSelected?: boolean; // default choice, or pre-ticked extra
}

export interface QuoteSelection {
  /** groupId -> chosen line item id */
  chosen: Record<string, string>;
  /** ids of ticked optional extras */
  extras: string[];
  acceptedBy?: string;
  acceptedAt?: string; // ISO datetime
}

export interface Quote {
  id: string; // e.g. Q-2041
  number: string;
  contactId?: string;
  customer: string;
  jobId?: string;
  status: QuoteStatus;
  issueDate: string; // ISO
  validUntil: string; // ISO
  items: QuoteLineItem[];
  notes?: string;
  terms?: string;
  selection?: QuoteSelection;
}

export interface Invoice {
  id: string; // e.g. INV-1042
  number: string;
  quoteId?: string;
  jobId?: string;
  contactId?: string;
  customer: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: QuoteLineItem[];
  notes?: string;
}

export const quoteStatusTones: Record<QuoteStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  Draft: "neutral",
  Sent: "info",
  Accepted: "success",
  Declined: "danger",
  Expired: "warning",
};

export const invoiceStatusTones: Record<InvoiceStatus, "neutral" | "info" | "warning" | "success" | "danger"> = {
  Draft: "neutral",
  Sent: "info",
  Paid: "success",
  Overdue: "danger",
  Void: "neutral",
};

export const quotes: Quote[] = [
  {
    id: "Q-2043",
    number: "Q-2043",
    contactId: "c1",
    customer: "Sarah Whitcombe",
    jobId: "j3",
    status: "Sent",
    issueDate: "2026-04-16",
    validUntil: "2026-05-16",
    items: [
      { id: "li1", productId: "p7", name: "Artificial grass — premium", qty: 45, unit: "sqm", unitPrice: 58, taxRate: 20 },
      { id: "li2", productId: "p8", name: "Garden tidy", qty: 1, unit: "day", unitPrice: 280, taxRate: 20 },
    ],
    notes: "Premium grade selected. 12-year guarantee included.",
    terms: "50% deposit on acceptance. Balance on completion.",
  },
  {
    id: "Q-2042",
    number: "Q-2042",
    contactId: "c5",
    customer: "Dawn Hartley",
    jobId: "j4",
    status: "Sent",
    issueDate: "2026-04-14",
    validUntil: "2026-05-14",
    items: [
      { id: "li3", productId: "p6", name: "Consumer unit replacement", qty: 1, unit: "each", unitPrice: 520, taxRate: 20 },
      { id: "li4", productId: "p5", name: "Electrical labour", qty: 2, unit: "hour", unitPrice: 70, taxRate: 20 },
    ],
  },
  {
    id: "Q-2041",
    number: "Q-2041",
    contactId: "c4",
    customer: "Highfield Primary School",
    status: "Accepted",
    issueDate: "2026-04-08",
    validUntil: "2026-05-08",
    items: [
      { id: "li5", productId: "p1", name: "Window cleaning — standard visit", qty: 12, unit: "visit", unitPrice: 35, taxRate: 20 },
    ],
    notes: "Termly contract, 12 visits per year.",
  },
  {
    id: "Q-2040",
    number: "Q-2040",
    contactId: "c6",
    customer: "Riverside Cafe Ltd",
    status: "Draft",
    issueDate: "2026-04-19",
    validUntil: "2026-05-19",
    items: [
      { id: "li6", productId: "p2", name: "Window cleaning — commercial frontage", qty: 12, unit: "each", unitPrice: 4.5, taxRate: 20 },
    ],
  },
  {
    id: "Q-2039",
    number: "Q-2039",
    contactId: "c5",
    customer: "Dawn Hartley",
    status: "Declined",
    issueDate: "2026-03-28",
    validUntil: "2026-04-28",
    items: [
      { id: "li7", productId: "p3", name: "Plumbing labour", qty: 4, unit: "hour", unitPrice: 65, taxRate: 20 },
    ],
  },
];

export const invoices: Invoice[] = [
  {
    id: "INV-1042",
    number: "INV-1042",
    jobId: "j10",
    contactId: "c1",
    customer: "Sarah Whitcombe",
    status: "Sent",
    issueDate: "2026-04-15",
    dueDate: "2026-05-15",
    items: [
      { id: "il1", productId: "p1", name: "Window cleaning — standard visit", qty: 1, unit: "visit", unitPrice: 65, taxRate: 0 },
    ],
  },
  {
    id: "INV-1041",
    number: "INV-1041",
    jobId: "j11",
    contactId: "c4",
    customer: "Highfield Primary School",
    status: "Overdue",
    issueDate: "2026-03-20",
    dueDate: "2026-04-19",
    items: [
      { id: "il2", productId: "p3", name: "Plumbing labour", qty: 6, unit: "hour", unitPrice: 65, taxRate: 20 },
      { id: "il3", name: "Drainage parts", qty: 1, unit: "each", unitPrice: 700, taxRate: 20 },
    ],
  },
  {
    id: "INV-1040",
    number: "INV-1040",
    contactId: "c2",
    customer: "Marlow & Pierce Solicitors",
    status: "Paid",
    issueDate: "2026-04-02",
    dueDate: "2026-05-02",
    paidDate: "2026-04-12",
    items: [
      { id: "il4", productId: "p1", name: "Window cleaning — standard visit", qty: 1, unit: "visit", unitPrice: 320, taxRate: 20 },
    ],
  },
  {
    id: "INV-1039",
    number: "INV-1039",
    contactId: "c4",
    customer: "Highfield Primary School",
    status: "Paid",
    issueDate: "2026-03-15",
    dueDate: "2026-04-14",
    paidDate: "2026-04-10",
    items: [
      { id: "il5", productId: "p1", name: "Window cleaning — standard visit", qty: 1, unit: "visit", unitPrice: 480, taxRate: 20 },
    ],
  },
  {
    id: "INV-1038",
    number: "INV-1038",
    jobId: "j12",
    contactId: "c2",
    customer: "Marlow & Pierce Solicitors",
    status: "Paid",
    issueDate: "2026-04-01",
    dueDate: "2026-05-01",
    paidDate: "2026-04-16",
    items: [
      { id: "il6", productId: "p7", name: "Artificial grass — courtyard", qty: 1, unit: "each", unitPrice: 1840, taxRate: 0 },
    ],
  },
  {
    id: "INV-1037",
    number: "INV-1037",
    contactId: "c3",
    customer: "James Okafor",
    status: "Draft",
    issueDate: "2026-04-19",
    dueDate: "2026-05-19",
    items: [
      { id: "il7", productId: "p3", name: "Plumbing labour", qty: 2, unit: "hour", unitPrice: 65, taxRate: 20 },
    ],
  },
];

export const forms = [
  { id: "f1", name: "Window cleaning quote", trade: "Window cleaning", submissions: 38, conversionRate: 31.6 },
  { id: "f2", name: "Artificial grass enquiry", trade: "Landscaping", submissions: 22, conversionRate: 45.5 },
  { id: "f3", name: "Emergency plumbing callout", trade: "Plumbing", submissions: 14, conversionRate: 78.6 },
];

export interface FormSubmission {
  id: string;
  formId: string;
  contact: string;
  service: string;
  postcode: string;
  date: string;
  /** Field-label → value, used by the field-mapping engine when converting to a job. */
  values: Record<string, string | number>;
}

export const formSubmissions: FormSubmission[] = [
  {
    id: "fs1",
    formId: "f3",
    contact: "James Okafor",
    service: "Plumbing",
    postcode: "BS9 2DE",
    date: "19 Apr 14:22",
    values: {
      "Full name": "James Okafor",
      Email: "james@okafor.co.uk",
      Phone: "07700 900201",
      Service: "Emergency plumbing — burst pipe",
      Trade: "Plumbing",
      Postcode: "BS9 2DE",
      Address: "14 Henleaze Road",
      Priority: "Urgent",
      "Lead source": "Google Ads",
      "Preferred time": "Morning",
      "How can we help?": "Pipe burst under the sink, water shut off at the mains.",
      Budget: 320,
    },
  },
  {
    id: "fs2",
    formId: "f1",
    contact: "Riverside Cafe Ltd",
    service: "Window cleaning",
    postcode: "BS1 6XN",
    date: "18 Apr 09:14",
    values: {
      "Full name": "Riverside Cafe Ltd",
      Email: "ops@riversidecafe.uk",
      Phone: "07700 900512",
      Service: "Fortnightly window clean",
      Trade: "Window cleaning",
      Postcode: "BS1 6XN",
      Address: "8 Welsh Back",
      Priority: "Normal",
      "Lead source": "Referral",
      "Access notes": "Side gate, key safe code in email.",
    },
  },
  {
    id: "fs3",
    formId: "f2",
    contact: "Helen Marsh",
    service: "Artificial grass",
    postcode: "BS7 8AA",
    date: "17 Apr 19:48",
    values: {
      "Full name": "Helen Marsh",
      Email: "helen.marsh@gmail.com",
      Phone: "07700 900417",
      Service: "Artificial grass — back garden ~35m²",
      Trade: "Landscaping",
      Postcode: "BS7 8AA",
      Address: "22 Bishop Road",
      Priority: "Low",
      "Lead source": "Facebook",
      Budget: 1800,
      "Customer deadline": "2026-05-30",
    },
  },
  {
    id: "fs4",
    formId: "f3",
    contact: "Tom Bradbury",
    service: "Electrical",
    postcode: "BA1 2QH",
    date: "17 Apr 11:02",
    values: {
      "Full name": "Tom Bradbury",
      Email: "tom@bradbury.io",
      Phone: "07700 900833",
      Service: "EV charger install",
      Trade: "Electrical",
      Postcode: "BA1 2QH",
      Address: "5 Lansdown Crescent",
      Priority: "High",
      "Lead source": "Google Ads",
      Budget: 950,
    },
  },
];

export const trackingEvents = [
  { id: "t1", event: "form_submit", page: "/quote/window-cleaning", utm: "google / cpc", time: "14:22" },
  { id: "t2", event: "form_start", page: "/quote/window-cleaning", utm: "google / cpc", time: "14:21" },
  { id: "t3", event: "form_view", page: "/quote/artificial-grass", utm: "facebook / social", time: "13:48" },
  { id: "t4", event: "form_submit", page: "/quote/plumbing", utm: "google / lsa", time: "11:02" },
  { id: "t5", event: "form_view", page: "/quote/plumbing", utm: "direct / none", time: "10:55" },
];
