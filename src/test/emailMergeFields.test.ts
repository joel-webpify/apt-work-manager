import { describe, it, expect, beforeEach } from 'vitest';
import { availableMergeGroups, bookingInstant, formatMergeDate, mergeText, resolveMergeFields, unavailableFields } from '@/lib/emailMergeFields';
import { saveBusinessSettings } from '@/lib/businessSettings';
import { createContact } from '@/lib/contactsStore';
import { addJob } from '@/lib/jobsStore';
import { addQuote } from '@/lib/quotesStore';
import { addInvoice } from '@/lib/invoicesStore';

describe('merge field rules', () => {
  beforeEach(() => localStorage.clear());
  it('resolves fallbacks and removes missing tokens', () => {
    expect(mergeText('Hi {{first_name|there}} {{unknown}}', {})).toBe('Hi there ');
    expect(mergeText('{{first_name|there}}', {first_name:'Anna'})).toBe('Anna');
    expect(mergeText('{{first_name|there}}', {}, true)).toBe('{{first_name|there}}');
  });
  it('restricts broadcasts to customer, history, promo and business', () => {
    expect(availableMergeGroups('broadcast')).toEqual(['Customer','Job history','Promo','Business']);
    expect(unavailableFields('{{booking_time}} {{invoice_amount|0}} {{quote_link}} {{email}} {{company_name}}','broadcast')).toEqual(['booking_time','invoice_amount','quote_link']);
  });
  it('adds booking fields only for booking triggers', () => {
    expect(unavailableFields('{{booking_time}}','visit_upcoming')).toEqual([]);
    expect(unavailableFields('{{invoice_number}}','visit_upcoming')).toEqual(['invoice_number']);
  });
  it('adds invoice fields only for invoice triggers', () => {
    expect(unavailableFields('{{invoice_number}}','invoice_overdue')).toEqual([]);
    expect(unavailableFields('{{quote_number}}','invoice_overdue')).toEqual(['quote_number']);
  });
  it('adds quote fields only for quote triggers', () => {
    expect(unavailableFields('{{quote_amount}}','quote_sent')).toEqual([]);
    expect(unavailableFields('{{booking_date}}','quote_sent')).toEqual(['booking_date']);
  });
  it('formats local booking wall time in business timezone and locale', () => {
    const instant = bookingInstant('2026-10-21','09:00','Europe/Stockholm');
    expect(instant.toISOString()).toBe('2026-10-21T07:00:00.000Z');
    expect(formatMergeDate(instant,'sv-SE','Europe/Stockholm','datetime')).toBe('onsdag 21 okt. kl 09:00');
    expect(formatMergeDate(instant,'en-GB','Europe/Stockholm','datetime')).toBe('Wed 21 Oct, 09:00');
  });
  it('uses actual records and currency without leaking another customer context', () => {
    saveBusinessSettings({name:'Nordic Services',address:'Stockholm',phone:'123',logo:'',brandColour:'#347ba8',bookingLink:'https://example.com/book',locale:'sv-SE',timezone:'Europe/Stockholm',currency:'SEK'});
    const id = createContact({name:'Anna Example',email:'anna@example.test',phone:'070123',postcode:'11122'});
    addJob({id:'merge-job',contactId:id,customer:'Anna Example',service:'Cleaning',stage:'New enquiry',value:100,quoteValue:100,address:'Test Street',notes:'Bring ladder',daysInStage:0,timeline:[],assignments:[{employeeId:'e1',date:'2026-10-21',start:'09:00',duration:2}]});
    const items = [{id:'line',name:'Work',unit:'each' as const,description:'Work',qty:2,unitPrice:100,taxRate:25}];
    addQuote({id:'merge-quote',number:'Q-1',contactId:id,jobId:'merge-job',customer:'Anna Example',status:'Sent',issueDate:'2026-10-19',validUntil:'2026-11-01',items});
    addInvoice({id:'merge-invoice',number:'I-1',contactId:id,jobId:'merge-job',customer:'Anna Example',status:'Overdue',issueDate:'2026-10-01',dueDate:'2026-10-15',items});
    const values = resolveMergeFields(id,{job_id:'merge-job',booking_id:'merge-job:2026-10-21:09:00',quote_id:'merge-quote',invoice_id:'merge-invoice',now:new Date('2026-10-19T00:00:00Z')});
    expect(values.email).toBe('anna@example.test');
    expect(values.booking_datetime).toBe('onsdag 21 okt. kl 09:00');
    expect(values.booking_end_time).toBe('11:00');
    expect(values.quote_amount).toBe(new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK'}).format(250));
    expect(values.invoice_amount).toBe(values.quote_amount);
    expect(values.days_overdue).toBe('4');
    expect(values.reschedule_link).toBe('');
    expect(values.rut_rot_amount).toBe('');
    expect(resolveMergeFields('other',{job_id:'merge-job',invoice_id:'merge-invoice'}).invoice_number).toBe('');
    expect(resolveMergeFields(id,{invoice_id:'merge-invoice',trigger:'broadcast'}).invoice_amount).toBe('');
  });
});
