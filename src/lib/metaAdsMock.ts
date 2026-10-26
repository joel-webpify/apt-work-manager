export const clients = [
  { id: 'garden', name: 'Grönt & Fint Trädgård AB', industry: 'Landscaping', city: 'Stockholm', account: 'act_100420001', page: 'Grönt & Fint Trädgård', instagram: '@grontochfint', pixel: 'px_1001', currency: 'SEK', timezone: 'Europe/Stockholm' },
  { id: 'clean', name: 'Glansig Städ AB', industry: 'Cleaning', city: 'Solna', account: 'act_100420002', page: 'Glansig Städ', instagram: '@glansigstad', pixel: 'px_1002', currency: 'SEK', timezone: 'Europe/Stockholm' },
  { id: 'heat', name: 'Nordvärme VVS AB', industry: 'HVAC', city: 'Nacka', account: 'act_100420003', page: 'Nordvärme VVS', instagram: '@nordvarme', pixel: 'px_1003', currency: 'SEK', timezone: 'Europe/Stockholm' },
];
export type Client = typeof clients[number];
export const objectives = [['Leads', 'OUTCOME_LEADS'], ['Sales', 'OUTCOME_SALES'], ['Traffic', 'OUTCOME_TRAFFIC'], ['Engagement', 'OUTCOME_ENGAGEMENT'], ['Awareness', 'OUTCOME_AWARENESS'], ['App promotion', 'OUTCOME_APP_PROMOTION']] as const;
export const statuses = ['Active', 'Paused', 'In review', 'Disapproved', 'Learning', 'Learning limited', 'With issues', 'Pending billing', 'Completed', 'Archived', 'Draft'] as const;
export type Status = typeof statuses[number];
export const statusApi: Record<Status, string> = { Active: 'ACTIVE', Paused: 'PAUSED', 'In review': 'PENDING_REVIEW', Disapproved: 'DISAPPROVED', Learning: 'LEARNING', 'Learning limited': 'LEARNING_LIMITED', 'With issues': 'WITH_ISSUES', 'Pending billing': 'PENDING_BILLING', Completed: 'COMPLETED', Archived: 'ARCHIVED', Draft: 'DRAFT' };
export interface DailyMetric { date: string; spend: number; impressions: number; reach: number; linkClicks: number; leads: number; purchases: number; value: number }
export interface MockAd { id: string; name: string; status: Status; headline: string; text: string; cta: string; media: string; format: string; form: string; url: string }
export interface MockAdSet { id: string; name: string; status: Status; budget: number; goal: string; destination: string; pixel: string; event: string; location: string; radius: number; ageMin: number; ageMax: number; gender: string; advantage: boolean; interests: string[]; excluded: string[]; placements: string[]; ads: MockAd[] }
export interface MockCampaign { id: string; clientId: string; name: string; status: Status; objective: string; budgetMode: string; budgetType: string; budget: number; bid: string; start: string; end: string; categories: string[]; labels: string[]; adSets: MockAdSet[]; daily: DailyMetric[] }
export interface MockLead { id: string; clientId: string; name: string; phone: string; email: string; postcode: string; form: string; campaignId: string; campaign: string; adSet: string; ad: string; platform: string; status: string; owner: string; received: string; duplicate: boolean; synced: boolean; answers: Record<string, string> }
export interface MockActivity { id: string; clientId: string; time: string; user: string; object: string; action: string; field: string; old: string; value: string; endpoint: string; method: string; code: number; duration: number }
export const datePresets = ['Today', 'Yesterday', 'Last 7 days', 'Last 14 days', 'Last 28 days', 'Last 30 days', 'Last 90 days', 'This month', 'Last month', 'This quarter', 'Maximum', 'Custom'];
export function money(value: number) { return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(value) + ' kr'; }
export function toOre(value: number) { return Math.round(value * 100); }
export function localTime(value: string) { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Stockholm', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
export function uid(prefix = 'mock') { return `${prefix}_${crypto.randomUUID().slice(0, 8)}`; }
export function dateWindow(preset: string, now = new Date(), custom?: { start: string; end: string }): [string, string] {
  const day = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Stockholm' })); day.setHours(0, 0, 0, 0);
  let start = new Date(day); let end = new Date(day);
  if (preset === 'Custom' && custom) return [custom.start, custom.end];
  if (preset === 'Yesterday') { start.setDate(start.getDate() - 1); end = new Date(start); }
  else if (preset.startsWith('Last ') && preset.endsWith('days')) start.setDate(start.getDate() - Number(preset.split(' ')[1]) + 1);
  else if (preset === 'This month') start.setDate(1);
  else if (preset === 'Last month') { start.setMonth(start.getMonth() - 1, 1); end.setDate(0); }
  else if (preset === 'This quarter') { start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1); }
  else if (preset === 'Maximum') start = new Date(2000, 0, 1);
  const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return [format(start), format(end)];
}
export function totalMetrics(daily: DailyMetric[], window?: [string, string]) {
  const rows = window ? daily.filter(d => d.date >= window[0] && d.date <= window[1]) : daily;
  const m = rows.reduce((a, d) => ({ spend: a.spend + d.spend, impressions: a.impressions + d.impressions, reach: a.reach + d.reach, linkClicks: a.linkClicks + d.linkClicks, leads: a.leads + d.leads, purchases: a.purchases + d.purchases, value: a.value + d.value }), { spend: 0, impressions: 0, reach: 0, linkClicks: 0, leads: 0, purchases: 0, value: 0 });
  return { ...m, frequency: m.reach ? m.impressions / m.reach : 0, ctr: m.impressions ? m.linkClicks / m.impressions * 100 : 0, cpc: m.linkClicks ? m.spend / m.linkClicks : 0, cpm: m.impressions ? m.spend / m.impressions * 1000 : 0, cpl: m.leads ? m.spend / m.leads : 0, roas: m.spend ? m.value / m.spend : 0 };
}
export function changeBudget(amount: number, mode: string, value: number) { return Math.max(0, mode === 'set' ? value : amount * (1 + (mode === 'decrease' ? -1 : 1) * value / 100)); }
export function duplicateMockCampaign(c: MockCampaign, includeChildren = true, suffix = ' – Copy', clientId = c.clientId): MockCampaign {
  return { ...structuredClone(c), id: uid('campaign'), clientId, name: c.name + suffix, status: 'Paused', daily: [], adSets: includeChildren ? c.adSets.map(s => ({ ...structuredClone(s), id: uid('adset'), status: 'Paused', ads: s.ads.map(a => ({ ...a, id: uid('ad'), status: 'Paused' })) })) : [] };
}
export function newMockCampaign(client: Client): MockCampaign {
  return { id: uid('campaign'), clientId: client.id, name: `${client.name} – Leads – ${new Date().toISOString().slice(0, 7)}`, status: 'Draft', objective: 'OUTCOME_LEADS', budgetMode: 'CBO', budgetType: 'daily_budget', budget: 350, bid: 'LOWEST_COST_WITHOUT_CAP', start: new Date().toISOString().slice(0, 16), end: '', categories: [], labels: [], daily: [], adSets: [{ id: uid('adset'), name: `${client.city} – Homeowners – Leads`, status: 'Paused', budget: 200, goal: 'LEAD_GENERATION', destination: 'ON_AD', pixel: client.pixel, event: 'LEAD', location: client.city, radius: 25, ageMin: 30, ageMax: 65, gender: 'All', advantage: true, interests: [], excluded: [], placements: ['Facebook feed', 'Instagram feed', 'Instagram Stories', 'Facebook Reels'], ads: [{ id: uid('ad'), name: 'Single image – Kostnadsfri offert – v1', status: 'Paused', headline: 'Få en kostnadsfri offert', text: 'Dags att ta hand om ditt hem? Vi hjälper dig hela vägen. Boka en kostnadsfri offert idag.', cta: 'GET_QUOTE', media: client.id, format: 'Single image or video', form: 'Free quote', url: '' }] }] };
}
export function seedCampaigns(): MockCampaign[] {
  return clients.flatMap((client, ci) => Array.from({ length: 6 }, (_, i) => {
    const c = newMockCampaign(client); const status: Status = ['Active', 'Paused', 'In review', 'Disapproved', 'Learning limited', 'Completed'][i] as Status;
    c.id = `campaign_${ci}_${i}`; c.name = [`${client.city} · Free quote`, 'Spring service · Retargeting', 'Local homeowners · Book a visit', 'Seasonal offer · New customers', 'Website visitors · Follow-up', 'Summer campaign · Completed'][i]; c.status = status; c.objective = objectives[i % 3][1]; c.budget = 250 + i * 100;
    c.adSets = Array.from({ length: 1 + i % 3 }, (_, si) => ({ ...structuredClone(c.adSets[0]), id: `set_${ci}_${i}_${si}`, name: `${si ? 'Solna' : client.city} · ${si ? 'Website visitors' : 'Homeowners'} · ${c.objective === 'OUTCOME_TRAFFIC' ? 'Visits' : 'Leads'}`, status, destination: c.objective === 'OUTCOME_LEADS' ? 'ON_AD' : 'WEBSITE', goal: c.objective === 'OUTCOME_LEADS' ? 'LEAD_GENERATION' : c.objective === 'OUTCOME_SALES' ? 'OFFSITE_CONVERSIONS' : 'LANDING_PAGE_VIEWS', ads: Array.from({ length: 1 + (i + si) % 4 }, (_, ai) => ({ ...c.adSets[0].ads[0], id: `ad_${ci}_${i}_${si}_${ai}`, name: `${ai % 2 ? 'Service visit' : 'Free quote'} · ${ai + 1}`, status })) }));
    c.daily = Array.from({ length: 90 }, (_, d) => { const date = new Date(); date.setDate(date.getDate() - 89 + d); const impressions = 1300 + ((d * 71 + i * 413 + ci * 197) % 2400); const spend = 150 + ((d * 23 + i * 47) % 250); return { date: dateWindow('Today', date)[0], spend, impressions, reach: Math.round(impressions / 1.7), linkClicks: Math.round(impressions * (0.012 + i * 0.002)), leads: 1 + (d + i) % 6, purchases: c.objective === 'OUTCOME_SALES' ? 1 + d % 3 : 0, value: c.objective === 'OUTCOME_SALES' ? (1 + d % 3) * 1900 : 0 }; });
    return c;
  }));
}
export function seedLeads(campaigns: MockCampaign[]): MockLead[] {
  const names = ['Anna Andersson', 'Erik Johansson', 'Maria Karlsson', 'Johan Nilsson', 'Sofia Lindberg', 'Lars Svensson', 'Emma Persson', 'Oskar Berg', 'Karin Lund', 'Anders Holm'];
  return clients.flatMap((client, ci) => names.map((name, i) => { const campaign = campaigns.find(c => c.clientId === client.id); return { id: `lead_${ci}_${i}`, clientId: client.id, name, phone: `+4670000${ci}${String(i).padStart(3, '0')}`, email: `${name.toLowerCase().replace(' ', '.')}@example.com`, postcode: ['112 24', '171 45', '131 40'][ci], form: i % 2 ? 'Book a visit' : 'Free quote', campaignId: campaign?.id ?? '', campaign: campaign?.name ?? '', adSet: campaign?.adSets[0]?.name ?? '', ad: campaign?.adSets[0]?.ads[0]?.name ?? '', platform: i % 2 ? 'Instagram' : 'Facebook', status: ['New', 'Contacted', 'Quote sent', 'Won', 'Lost'][i % 5], owner: i % 2 ? 'Elin' : 'Marcus', received: new Date(Date.now() - i * 3600000).toISOString(), duplicate: i === 3, synced: i % 3 !== 0, answers: { 'Service needed': client.industry === 'Landscaping' ? 'Garden maintenance' : client.industry === 'Cleaning' ? 'Home cleaning' : 'Heat pump service', 'Preferred time': 'Weekday morning', 'Property type': 'Villa', 'Postcode': ['112 24', '171 45', '131 40'][ci] } }; }));
}
export function validateCampaign(c: MockCampaign) {
  const errors: string[] = [];
  if (!c.name.trim()) errors.push('Campaign name is required.');
  if (c.budgetMode === 'CBO' && c.budget <= 0) errors.push('Campaign budget must be greater than 0 kr.');
  if (!c.adSets.length) errors.push('Add at least one ad set.');
  if (c.budgetType === 'lifetime_budget' && !c.end) errors.push('An end date is required for a lifetime budget.');
  if (c.end && c.end <= c.start) errors.push('End date must be after start date.');
  c.adSets.forEach(s => { if (!s.location.trim()) errors.push('Add a service area.'); if (c.budgetMode !== 'CBO' && s.budget <= 0) errors.push('Ad set budget must be greater than 0 kr.'); if (!s.ads.length) errors.push('Add at least one ad.'); s.ads.forEach(a => { if (!a.text.trim()) errors.push('Primary text is required.'); if (s.destination === 'WEBSITE' && !/^https?:\/\/\S+\.\S+/.test(a.url)) errors.push('Enter a valid website URL.'); if (s.destination === 'ON_AD' && !a.form) errors.push('Choose a published lead form.'); }); });
  return [...new Set(errors)];
}
export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]); const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const content = '\uFEFF' + keys.map(cell).join(',') + '\n' + rows.map(row => keys.map(k => cell(row[k])).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = name + '.csv'; link.click(); URL.revokeObjectURL(url);
}
