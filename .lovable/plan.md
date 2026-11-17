# Unified Inbox (mockup)

A new **Inbox** page at `/inbox`, added near the top of the sidebar. Front-end only with UK demo data (GBP, UK postcodes). Nothing is sent to real channels.

## Layout (three panes)

```text
| Conversations         | Timeline                     | Context            |
| [Needs reply|All|Done]| Contact name - channel icons | Contact + address  |
| [channel icon chips]  | messages, each with an icon  | Source card        |
| rows: name, preview,  |                              | [Convert to lead]  |
| badge, SLA, unread    | Reply: [WA|SMS|Email] [Send] | Book survey / Job  |
```

### 1. Conversation list
- Simple filters: a status toggle (Needs reply / All / Done) and one row of channel icon chips (All, WhatsApp, Email, Web form, Facebook, Call), each with a count.
- Each row shows the contact name, last message preview, relative time, channel icon badge, unread dot and bold text when unread.
- SLA chip: green "<5m", amber "15m+", red "Overdue" (over 60 minutes with no first reply). No chip once someone has replied. The list is sorted with overdue first, then by newest.

### 2. Timeline
- One thread per contact, merging messages from every channel by time, with date dividers.
- Each bubble has its channel icon and label. Incoming messages sit on the left, outgoing on the right. Calls show as a compact entry with duration and notes.
- Reply box with a WhatsApp / SMS / Email selector. It defaults to the last channel the customer used. Email adds a subject line. Sending adds the message to the thread, marks the conversation replied and clears the SLA chip.

### 3. Context panel
- Contact details (phone, email) and address with postcode.
- Source card: channel, campaign name, ad or keyword, landing page, first seen date.
- Primary "Convert to lead" button and secondary "Book survey" / "Create job" buttons. These are demo actions: they show a confirmation, update the conversation status and log it in the thread.
- On smaller screens the context panel opens as a side drawer, and on mobile the list and thread show one at a time.

## Mock data
About 12 conversations with realistic UK contacts (Manchester M14, Leeds LS6, Bristol BS7, London SW11 and others), boiler, bathroom, electrical and roofing enquiries, and £ values. Some conversations span several channels.

## Technical details
- `src/lib/inboxMock.ts`: types `Conversation { id, contactId, channel, lastMessageAt, firstResponseAt, status }`, `Message { id, conversationId, channel, direction, body, createdAt }`, plus contacts/source. Pure helpers `slaState(conv, now)`, `filterConversations`, `threadForContact`. Timestamps are relative to now, so the SLA chips always show a mix.
- One shared `channelMeta` map (icon, label, token colour) is used by the badges, chips and bubbles.
- `src/pages/Inbox.tsx` plus `src/components/inbox/` (ConversationList, Timeline, ReplyBox, ContextPanel), with React session state and semantic tokens only.
- Route in `App.tsx`, sidebar entry with an Inbox icon, a note in `AGENTS.md`, and `src/test/inboxMock.test.ts` covering the SLA thresholds and filters.
