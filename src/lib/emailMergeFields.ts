import { contacts as sampleContacts, employees } from '@/data/mockData';
import { applyExtrasTo, mergeWithMock, getContactRecords } from '@/lib/contactsStore';
import { getJobs } from '@/lib/jobsStore';
import { getQuotes } from '@/lib/quotesStore';
import { getInvoices } from '@/lib/invoicesStore';
import { readBusinessSettings } from '@/lib/businessSettings';
import { effectiveItems, totals } from '@/lib/quoteUtils';
import { quoteLink } from '@/lib/shareLinks';

export const mergeFieldGroups = {
  Customer: ['first_name','last_name','full_name','company','email','phone','postcode','city','customer_since','customer_portal_link'],
  Booking: ['booking_date','booking_time','booking_datetime','arrival_window','booking_end_time','job_address','service_type','technician_name','technician_phone','job_notes','booking_link','reschedule_link','cancel_link'],
  'Job history': ['last_job_date','last_service_type','last_job_amount','days_since_last_job','total_jobs','next_service_due'],
  Quote: ['quote_number','quote_amount','quote_link','quote_expiry_date'],
  Invoice: ['invoice_number','invoice_amount','invoice_due_date','days_overdue','outstanding_balance','payment_link','rut_rot_amount','price_after_rut'],
  'Post-job': ['review_link','feedback_link'],
  Promo: ['promo_code','promo_expiry','referral_link'],
  Business: ['business_name','business_name_ws','business_phone','business_email','business_address','business_website','business_logo','org_number','sender_name','unsubscribe_link'],
};
export type MergeGroup = keyof typeof mergeFieldGroups;
export interface MergeContext { booking_id?: string; job_id?: string; quote_id?: string; invoice_id?: string; trigger?: string; values?: Record<string, string>; now?: Date }
export function availableMergeGroups(trigger = 'broadcast'): MergeGroup[] {
  const groups: MergeGroup[] = ['Customer','Job history','Promo','Business'];
  if (/^(visit_|booking_|job_booked)/.test(trigger)) groups.push('Booking');
  if (/^invoice_|^job_paid$/.test(trigger)) groups.push('Invoice');
  if (/^quote_/.test(trigger)) groups.push('Quote');
  if (/^(visit_completed|job_sheet_completed|job_paid|invoice_paid|review_received|low_rating_review)$/.test(trigger)) groups.push('Post-job');
  return groups;
}
export function unavailableGroupReason(group: MergeGroup) {
  return `Only available in ${group === 'Post-job' ? 'post-job' : group.toLowerCase()}-triggered emails`;
}
export function unavailableFields(text: string, trigger = 'broadcast') {
  const allowed = availableMergeGroups(trigger);
  const aliases: Record<string,string> = { company_name: 'business_name', booking_url: 'booking_link' };
  return [...new Set(Array.from(text.matchAll(/\{\{([a-z_]+)(?:\|[^{}]*)?\}\}/g), m => m[1]))].filter(key => {
    const group = (Object.keys(mergeFieldGroups) as MergeGroup[]).find(g => mergeFieldGroups[g].includes(aliases[key] ?? key));
    return !group || !allowed.includes(group);
  });
}
export function mergeText(text: string, values: Record<string,string>, preserveTokens = false): string {
  return text.replace(/\{\{([a-z_]+)(?:\|([^{}]*))?\}\}/g, (token, key, fallback) => {
    if (preserveTokens) return token;
    return values[key] || fallback || '';
  });
}
export function formatMergeDate(value: string | Date, locale: string, timeZone: string, kind: 'date'|'time'|'datetime' = 'date') {
  const date = value instanceof Date ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value);
  if (!Number.isFinite(date.getTime())) return '';
  const dateOptions: Intl.DateTimeFormatOptions = { timeZone, weekday: locale.startsWith('sv') ? 'long' : 'short', day: 'numeric', month: 'short' };
  const time = new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  const day = new Intl.DateTimeFormat(locale, dateOptions).format(date);
  return kind === 'time' ? time : kind === 'datetime' ? `${day}${locale.startsWith('sv') ? ' kl ' : ', '}${time}` : day;
}
// Assignments are business-local wall times, not browser-local instants.
export function bookingInstant(date: string, time: string, timeZone: string) {
  const target = Date.parse(`${date}T${time}:00Z`);
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' }).formatToParts(new Date(instant));
    const part = (key: string) => p.find(x => x.type === key)?.value ?? '';
    const wall = Date.parse(`${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}Z`);
    instant += target - wall;
  }
  return new Date(instant);
}
export function resolveMergeFields(contact_id: string, context: MergeContext = {}): Record<string,string> {
  const business = readBusinessSettings();
  const { imported, extras } = getContactRecords();
  const contact = applyExtrasTo(mergeWithMock(sampleContacts, imported), extras).find(c => c.id === contact_id);
  const values: Record<string,string> = Object.fromEntries(Object.values(mergeFieldGroups).flat().map(key => [key, '']));
  const locale = business.locale || 'en-GB', zone = business.timezone || 'Europe/London';
  const currency = (amount: number) => new Intl.NumberFormat(locale, { style:'currency', currency: business.currency || 'GBP' }).format(amount);
  const date = (s: string) => formatMergeDate(s, locale, zone);
  Object.assign(values, { business_name:business.name, business_name_ws:business.name, company_name:business.name, business_phone:business.phone, business_email:business.email || '', business_address:business.address, business_website:business.website || '', business_logo:business.logo, org_number:business.orgNumber || '', sender_name:business.senderName || '' });
  if (!contact) return values;
  Object.assign(values, { first_name:contact.name.split(' ')[0], last_name:contact.name.split(' ').slice(1).join(' '), full_name:contact.name, company:contact.type === 'Commercial' ? contact.name : '', email:contact.email, phone:contact.phone, postcode:contact.postcode });
  const jobs = getJobs().filter(j => j.contactId === contact.id);
  const quote = context.quote_id ? getQuotes().find(q => q.id === context.quote_id && q.contactId === contact.id) : undefined;
  const invoice = context.invoice_id ? getInvoices().find(i => i.id === context.invoice_id && i.contactId === contact.id) : undefined;
  const jobId = context.job_id || quote?.jobId || invoice?.jobId;
  const job = jobs.find(j => j.id === jobId || j.assignments?.some(a => `${j.id}:${a.date}:${a.start}` === context.booking_id));
  const assignment = context.booking_id ? job?.assignments?.find(a => `${job.id}:${a.date}:${a.start}` === context.booking_id) : job?.assignments?.[0];
  values.total_jobs = String(jobs.length);
  // History is based on dated, paid jobs, never array order or a future visit.
  const paid = getInvoices().filter(i => i.contactId === contact.id && i.status === 'Paid' && i.paidDate).sort((a,b) => (b.paidDate || '').localeCompare(a.paidDate || ''));
  const last = paid[0];
  values.last_job_date = last?.paidDate ? date(last.paidDate) : date(contact.lastJob);
  if (last) { values.last_job_amount = currency(totals(last.items).total); values.last_service_type = jobs.find(j => j.id === last.jobId)?.service || ''; }
  const now = context.now || new Date();
  const lastDate = last?.paidDate || contact.lastJob;
  if (Number.isFinite(Date.parse(lastDate))) values.days_since_last_job = String(Math.max(0, Math.floor((now.getTime()-Date.parse(lastDate))/86400000)));
  const open = getInvoices().filter(i => i.contactId === contact.id && ['Sent','Overdue'].includes(i.status));
  values.outstanding_balance = currency(open.reduce((sum,i) => sum + totals(i.items).total,0));
  if (job) Object.assign(values,{ job_address:job.address, service_type:job.service, job_notes:job.notes });
  if (assignment) {
    const start = bookingInstant(assignment.date,assignment.start,zone);
    const end = new Date(start.getTime()+assignment.duration*3600000);
    const crew = job?.assignments?.filter(a => a.date === assignment.date && a.start === assignment.start).map(a => employees.find(e => e.id === a.employeeId)).filter(e => e !== undefined) || [];
    Object.assign(values,{ booking_date:date(start.toISOString()), booking_time:formatMergeDate(start,locale,zone,'time'), booking_datetime:formatMergeDate(start,locale,zone,'datetime'), booking_end_time:formatMergeDate(end,locale,zone,'time'), technician_name:crew.map(e=>e.name).join(', '), technician_phone:crew.map(e=>e.phone).filter(Boolean).join(', '), booking_link:business.bookingLink });
  }
  if (quote) Object.assign(values,{quote_number:quote.number,quote_amount:currency(totals(effectiveItems(quote)).total),quote_link:quoteLink(quote.id),quote_expiry_date:date(quote.validUntil)});
  if (invoice) Object.assign(values,{invoice_number:invoice.number,invoice_amount:currency(totals(invoice.items).total),invoice_due_date:date(invoice.dueDate),days_overdue:String(invoice.status === 'Paid' ? 0 : Math.max(0,Math.floor((now.getTime()-Date.parse(invoice.dueDate))/86400000)))});
  // Only explicit event values fill fields with no existing source (secure links, promos, RUT/ROT, arrival windows).
  for (const [key,value] of Object.entries(context.values || {})) if (key in values) values[key] = value;
  if (context.trigger) {
    const allowed = availableMergeGroups(context.trigger);
    for (const group of Object.keys(mergeFieldGroups) as MergeGroup[]) if (!allowed.includes(group)) for (const key of mergeFieldGroups[group]) values[key] = '';
  }
  return values;
}
