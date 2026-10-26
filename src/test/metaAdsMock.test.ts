import { describe, it, expect } from 'vitest';
import { clients, seedCampaigns, seedLeads, toOre, changeBudget, dateWindow, totalMetrics, duplicateMockCampaign, validateCampaign } from '../lib/metaAdsMock';
describe('Meta Ads mockup rules', () => {
 it('uses the three specified Swedish client workspaces', () => {
   expect(clients.map(c => c.name)).toEqual(['Grönt & Fint Trädgård AB', 'Glansig Städ AB', 'Nordvärme VVS AB']);
 });
 it('uses SEK for every client', () => { expect(clients.map(c => c.currency)).toEqual(['SEK', 'SEK', 'SEK']); });
 it('uses Europe/Stockholm for every client', () => { expect(clients.map(c => c.timezone)).toEqual(['Europe/Stockholm', 'Europe/Stockholm', 'Europe/Stockholm']); });
 it('provides six campaigns per client', () => { const rows = seedCampaigns(); clients.forEach(c => expect(rows.filter(r => r.clientId === c.id)).toHaveLength(6)); });
 it('provides 90 days per campaign', () => { seedCampaigns().forEach(c => expect(c.daily).toHaveLength(90)); });
 it('provides 30 Swedish mock leads', () => { const leads = seedLeads(seedCampaigns()); expect(leads).toHaveLength(30); expect(leads.every(l => l.phone.startsWith('+46'))).toBe(true); });
 it('converts kr to integer öre', () => { expect(toOre(350.75)).toBe(35075); });
 it('duplicates campaigns and all children paused without delivery history', () => { const c = seedCampaigns()[0]; const copy = duplicateMockCampaign(c); expect(copy.status).toBe('Paused'); expect(copy.id).not.toBe(c.id); expect(copy.adSets[0].id).not.toBe(c.adSets[0].id); expect(copy.adSets[0].ads[0].status).toBe('Paused'); expect(copy.daily).toEqual([]); });
 it('calculates percentage budget changes', () => { expect(changeBudget(400, 'increase', 15)).toBeCloseTo(460); expect(changeBudget(400, 'decrease', 25)).toBe(300); });
 it('filters daily metrics by the agreed window', () => { const c = seedCampaigns()[0]; const date = c.daily[0].date; expect(totalMetrics(c.daily, [date, date]).spend).toBe(c.daily[0].spend); });
 it('requires an end date for lifetime budgets', () => { const c = seedCampaigns()[0]; c.budgetType = 'lifetime_budget'; c.end = ''; expect(validateCampaign(c)).toContain('An end date is required for a lifetime budget.'); });
 it('Last 7 days includes exactly seven calendar dates', () => { expect(dateWindow('Last 7 days', new Date('2026-10-26T12:00:00Z'))).toEqual(['2026-10-20', '2026-10-26']); });
});