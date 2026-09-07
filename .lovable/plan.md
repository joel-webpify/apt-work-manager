# Site surveys you design, and materials you can cost

Two additions: survey question sets you build in settings and fill in on site, and materials tracking that shows what a job really cost.

## 1. Survey builder in settings

New settings tab **Surveys**.

- Build any number of named surveys ("Bathroom site visit", "Fence survey").
- Each survey can be linked to service words (boiler, fence, electric...) so it loads automatically for matching jobs. The office can also attach a survey to a job by hand.
- Inside a survey: sections, and questions you can add, rename, reorder and delete.
- Question answer types: short text, long text, number, yes/no, pick one, pick several, photo, and measurement with a unit (m, m², hours, each...).
- Per question: help text for the worker, required on/off, and "show only if" a previous yes/no or choice answer matches.
- A question can be marked **priceable** with a default price and unit. Answers to those questions become suggested quote lines.
- Duplicate a survey, and a couple of ready-made examples to start from.

## 2. Filling it in on site

In the field app job screen, a **Survey** section above the job sheet:

- Shows the survey matched to the job, questions grouped by section, progress count, hidden questions appear as answers unlock them.
- Photo questions use the existing photo capture; measurement questions show the unit next to the box.
- Answers save as you type, and lock with the rest of the sheet at sign-off.

## 3. Survey answers into the quote

- On wrap-up, if the survey has priceable answers or flagged findings, a **draft quote** is created for the office with those lines, alongside the existing extra-work quote.
- In the quote builder, a new **From the site visit** panel lists survey findings and materials for that job so you can tick which ones become lines — included, a customer choice, or an optional extra.
- The job card and the office site-visit panel show the completed survey answers.

## 4. Materials and job costs

In the field app and on the job card, a **Materials** list:

- Add from the products catalogue or type a one-off.
- Per line: quantity, unit, cost you paid, price you charge, VAT, supplier/note, and "charge to customer" on/off.
- Materials can be pushed onto the quote or invoice as chargeable lines.
- **Job profit** summary on the job card: quote value, materials cost, labour hours × rate, total cost, profit and margin. Labour hours come from the existing on-site time stamps; a default labour rate is set in settings.

## Technical notes

- New `src/lib/surveysStore.ts` (survey definitions, localStorage, same listener pattern as `stagesStore`) and `src/lib/materialsStore.ts` (per job + worker, keyed like `fieldStore`).
- Survey answers stored on the field record (`survey: { surveyId, answers }`) so existing per-worker records and lock behaviour still apply; `fieldTemplates.ts` chip suggestions stay as they are.
- New components: `settings/SurveysTab.tsx`, `settings/SurveyEditor.tsx`, `field/SurveyForm.tsx`, `field/MaterialsList.tsx`, `pipeline/JobCostsCard.tsx`; extend `QuoteBuilderDialog.tsx` with the site-visit import panel and `WrapUpSheet.tsx` with survey-based draft quotes.
- All data stays in localStorage/mock like the rest of the app; no backend changes.

## Not included

- Supplier ordering or stock levels.
- Real photo storage in the cloud (photos stay as they are today).
- Per-worker labour rates (one default rate).
