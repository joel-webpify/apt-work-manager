# WhatsApp messaging: survey booking updates and marketing campaigns

## Goal
Send WhatsApp messages from the platform in two ways:
1. **Booking updates (utility)**: automatic messages when a survey or work visit is booked, coming up, moved or cancelled.
2. **Marketing campaigns**: bulk WhatsApp sends to a segment, next to email campaigns.

## What you need first
- A WhatsApp Business account and a phone number that is not used on personal WhatsApp.
- Meta's approval steps: verify your email and phone and get your display name approved. Connecting can take a few minutes.
- **Templates**: messages you start yourself, such as reminders and campaigns, must use templates Meta has approved. Approval can take up to 48 hours. You can reply freely within 24 hours after a customer messages you.
- **Cost**: Meta charges for marketing messages. Booking updates are usually cheap or free inside the 24-hour window.
- **Limit**: replies from customers won't show up in the platform yet. This project can't receive incoming messages until it moves to the newer app setup, which can be done as a later step. Until then, customers reply to your WhatsApp Business phone app.

## Phase 1: Connect and templates
- Connect WhatsApp in Settings, in a new **WhatsApp** tab that shows the connected number and its quality rating.
- A template manager lists templates with their status (Approved, Pending, Rejected). It also lets you create templates from ready-made starters, for example:
  - `survey_booked`: "Hi {{1}}, your site survey is booked for {{2}} at {{3}}. Reply here if you need to change it."
  - `visit_reminder`, `visit_moved`, `visit_cancelled`
  - A marketing starter, such as a seasonal offer
- Template variables connect to the merge fields you already use (first_name, booking_datetime, job_address, technician_name). Sample values are filled in automatically so Meta accepts the template.

## Phase 2: Booking updates in automations
- Add a **Send WhatsApp** action to automations, next to Send email. In it you pick an approved template and match each variable to a merge field.
- It works with the visit triggers you already have: booked, upcoming, moved, cancelled. You can limit it to survey or work visits.
- New recipe: **"Confirm survey booking on WhatsApp + reminder 24h before"**.
- Before sending, it checks that the contact has a valid mobile number and has agreed to WhatsApp messages. If not, the send is skipped and the automation run shows why.
- The contact card gets a "WhatsApp" row showing consent and the last message sent.

## Phase 3: Marketing campaigns
- In Email marketing, a campaign can be either **Email** or **WhatsApp**.
- WhatsApp campaign steps: choose a segment, choose an approved marketing template, map the variables, then preview it on a phone mock-up for a selected contact.
- Only contacts who opted in to WhatsApp marketing are included. The send screen shows "X will receive, Y skipped (no consent / no mobile)" and an estimated cost.
- You can send now or schedule. Results show sent, delivered and failed per contact; delivered and read counts need receiving to be set up.

## Phase 4 (later, optional)
- Move to the newer setup so the platform can receive replies and delivery updates, with a shared WhatsApp inbox on the contact card.
- Import past chats from the WhatsApp Business app. This only works within 24 hours of connecting the number.

## How to test
Use your WhatsApp Business phone app for the first messages. Then send a template to your own number from the platform and confirm it arrives.

## Technical details
- WhatsApp connector via Lovable connectors. All sends go through a backend function (`whatsapp-send`) that calls the connector gateway `/messages` and `/message_templates`. No credentials in the browser.
- Database tables: `whatsapp_messages` (contact, template, params, status, Meta message id, error), plus consent fields per contact (`whatsapp_utility_optin`, `whatsapp_marketing_optin`, timestamp). RLS is scoped to signed-in users.
- Template parameter mapping reuses `resolveMergeFields` and `availableMergeGroups`, so booking fields only appear for visit triggers. Phone numbers are normalised to E.164 digits, with the business country as the default.
- Automation action `send_whatsapp` with `{ templateName, language, paramMap }` is added to the workflow action union. Email schemas stay unchanged.
- Campaign records gain a `channel: 'email' | 'whatsapp'` field. Existing email campaigns default to email.
- Tests: consent gating, E.164 normalisation, parameter count matching the template body, and trigger-based field availability.
