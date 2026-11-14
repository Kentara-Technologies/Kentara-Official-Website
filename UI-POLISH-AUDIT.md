# Kentara Technologies — final UI polish and customer experience audit

Reviewed 14 November 2026. Changes remain local and uncommitted. Nothing was pushed, merged or deployed.

## Workspace and scope

- Working directory and Git root: `/home/odena/Documents/Persy/KENTARA TECHNOLOGIES Archive/Kentara Official Website`.
- Branch: `feature/native-project-intake`.
- Remote: `https://github.com/Kentara-Technologies/Kentara-Official-Website`.
- Starting worktree: modified `about.html`, `assets/css/styles.css`, `assets/images/odosa-enaruero.jpg`, `assets/js/main.js`, `index.html`, `services.html`, and `start-project.html`; untracked `FORMSPREE-SETUP.md`.
- Worked directly in that checkout. Saved a starting baseline under `/tmp/kentara-polish-20261114/baseline`.
- Hash comparisons confirm that `index.html`, `about.html`, `services.html`, the founder portrait, and `FORMSPREE-SETUP.md` retain their starting contents. The Start a Project metadata, field names/order, endpoint and original field attributes were preserved.

This pass changes buttons and enquiry interaction states. The approved page content, typography, imagery, palette, navigation and page hierarchy remain in place. Customer-audit recommendations below have not been implemented.

## Files changed in this pass

| File | Change |
| --- | --- |
| `assets/css/styles.css` | Shared button tokens; removal of conflicting button overrides; loading, validation, error and success styling. |
| `assets/js/main.js` | Removed the earlier enquiry handler after extracting its functionality into the dedicated script. Other shared interactions are unchanged. This file now matches its tracked version, so it does not appear as modified in the final Git status. |
| `assets/js/project-form.js` | New self-contained enquiry controller, with initialization guard and one submission listener. |
| `start-project.html` | Wrapped the original card content, added loading markup and accessible announcements, added the dedicated success section, and loaded the enquiry script. |
| `tests/ui-check.mjs` | New dependency-free headless Chrome regression harness with Formspree fixtures. |
| `UI-POLISH-AUDIT.md` | This implementation and customer-experience report. |

The existing modifications shown by Git in About, Home, Services and the portrait predate this pass.

## Button system

The inconsistencies came from standard buttons using 22px vertical padding, a separate header rule, smaller form-specific typography/padding, and additional hero/final-CTA overrides at responsive breakpoints. Their proportions changed independently.

The shared primary/secondary family now uses 15px text at weight 600, a 22px line height, 14px vertical/26px horizontal padding, a 9px radius, a 9px icon gap and 18px arrow boxes. Single-line standard CTAs measure 52px high in the tested browser.

The header variant uses 14px text, 12px/22px padding and a 48px height. The centered submit variant is at most 260px wide and uses the standard typography and padding. Widths follow labels and available space; long labels wrap on narrow screens. At 320px, the submit button measures 74px high and the long final intake CTA reaches 96px. Both remain within the page and retain their complete labels.

Primary/secondary hover colors and lift are retained. Keyboard focus remains visible. Disabled buttons do not lift on hover. Ordinary navigation and text links are outside the button selectors.

## Enquiry states

- **Loading:** a 17px spinner and “Sending enquiry...” appear inside the button. Overlaid grid layers retain the idle label's space, preventing a button-size change. The button disables immediately, an in-flight guard blocks duplicate submissions, `aria-busy` marks the form, and a separate visually hidden live region announces progress. There is no visible plain-text loading message. Reduced motion leaves a static indicator.
- **Success:** an accepted JSON response reveals the dedicated success section and hides the entire original card content, including its heading, introduction, fields, privacy note, submit button and contact footer. The section contains the requested wording, a 30px checkmark in a 64px Cyan Mist circle, and a homepage link. Focus moves to the confirmation; the card scrolls clear of the sticky header. No navigation to Formspree occurs in the enhanced flow, and no confirmation-email claim is made.
- **Failure:** the original form remains visible with every entered value preserved. A styled alert explains that submission failed, encourages retry, and includes a working `mailto:` alternative. The idle button returns, busy state clears, and focus moves to the alert. A 30-second timeout also restores the form.
- **Validation:** five required fields and email format are checked, including whitespace-only required text. Readable errors appear beside their fields with `aria-invalid` and `aria-describedby`; focus moves to the first invalid field. Corrections update the errors without clearing input. Provider field errors are also mapped to the relevant input using text content, not injected HTML. Native required/email validation remains available if the enhancement script does not load.

The action remains `https://formspree.io/f/xvkazbdn`, with the same seven enquiry fields and `_gotcha` honeypot. No provider, backend, autoresponder or dependency was added. Response handling was checked against [Formspree's official client source](https://github.com/formspree/formspree-js/blob/main/packages/formspree-core/src/submission.ts); both an explicit success flag and its documented success response shape are supported, while errors and unexpected responses retain the form.

## Verification actually completed

The original checkout was served locally, with an HTTP 200 readiness check. The connected Chrome tool failed to open/inspect tabs, so browser QA used a separate headless Google Chrome profile. The regression harness serves the actual repository files from a temporary loopback server and replaces Formspree fetches with fixtures before site scripts execute.

**171 browser assertions passed.** A network observer recorded **zero live Formspree requests**.

| Coverage | Completed checks |
| --- | --- |
| Page layouts | Home, About, Services and Start a Project at 1440, 960, 768, 390 and 320px. No horizontal document overflow, broken local images or form-field overflow; visible CTA targets at least 44px high. |
| Visual review | Desktop and mobile top/full-page screenshots of all four pages; expanded desktop service disclosures; submit, loading, validation, error and success views. Scroll reveals were exercised before full-page captures. |
| Form states | At 1440, 390 and 320px: required/email/whitespace validation, data preservation, disabled loading, duplicate prevention, stable loading dimensions, animated/static spinner, complete success replacement, focus and sticky-header visibility. |
| Service responses | Mocked acceptance, HTTP failure, network rejection, provider field error, invalid JSON, explicit rejection, unexpected JSON and redirected response; retry after each failure. |
| Request contract | Existing endpoint, POST method, JSON Accept header and field names checked against the fixture payload. |
| Keyboard/resilience | Enter submission, repeated script initialization, actual 30-second request timeout, visible submit focus through Tab, mobile dialog opening, Shift+Tab wrap, Escape and focus restoration, service deep-link opening. |
| Source integrity | JavaScript syntax checks, `git diff --check`, local links/assets/fragments, unique IDs, preserved form metadata/field names, and preserved-file hash checks. |

No uncaught JavaScript exceptions were recorded during the browser suite. The first QA runs found and resolved narrow-mobile overflow and success content being obscured after form collapse.

Rerun from the repository with `node tests/ui-check.mjs`; installed Google Chrome and Node with built-in WebSocket support are required. Set `CHROME_BIN` or `KENTARA_QA_OUTPUT` if needed. The harness cleans up its server and browser profile.

Screenshots, rendered text and machine-readable assertions are under `/tmp/kentara-ui-audit/`, including `results.json`, `success-1440.png`, `loading-390.png`, and `error-390.png`. These temporary artifacts can be regenerated with the harness.

### Tests not completed

- Live Formspree acceptance, dashboard receipt, notification delivery and autoresponder configuration. No real enquiry was sent.
- Physical iPhone/Android testing, Safari/Firefox coverage, mobile keyboard/autofill behavior and a full screen-reader test.
- Production hosting behavior, live social/contact destination availability, throttled mobile performance and conversion measurement.

The checks above establish local frontend behavior; mocked acceptance does not establish that Kentara receives live enquiries.

## Customer experience audit

This is a reviewer walkthrough using the requested Nigerian SME-owner persona, based on actual rendered pages and interaction results. It is not customer research. Verified observations are distinguished from judgments about their likely effect. No website changes were made during this audit phase.

**Subjective heuristic score: 7.5/10.** This is a judgment of clarity, confidence and readiness, not a measured conversion score.

### First impression and strengths

The site looks coherent, restrained and professional. The consistent cyan actions make the next step easy to identify. Within the first screen, the supporting copy establishes custom software, web/mobile applications and cloud work for growing businesses. “Work better” and the discovery-first approach connect the offer to operational needs.

The founder photograph and name, business-domain email, Nigerian WhatsApp number and displayed RC number provide useful identity signals. They are visible signals, not an independent verification of credentials. The Discover → Design → Build → Launch → Support sequence and proposal explanation make engagement feel more structured than an open-ended “contact us” promise.

### Journey findings

| Area | Verified observation | Reviewer assessment |
| --- | --- | --- |
| First impression | Consistent layout, typography and cyan CTAs across the four pages. | Strong visual credibility for an initial visit. |
| Clarity | The hero description names the main services; the headline emphasizes premium technology and business fit. | The broad offer is clear, but a spreadsheet/WhatsApp user still has to translate it into their own everyday problem. |
| Services | Web, mobile and cloud categories, with dashboard, workflow and internal-tool examples inside disclosures. | Appropriate breadth. Labels such as API integrations and cloud infrastructure may require explanation for this persona. |
| Differentiation | Business-first work, transparency, quality and flexible payments are explained. | Flex is a concrete distinction; the remaining claims resemble common agency promises without supporting delivery evidence. |
| Credibility | Founder identity, RC number, email, WhatsApp and social links are displayed. No completed-project case studies or client testimonials appear in the reviewed pages. | The main confidence gap is proof that Kentara has delivered work similar to the visitor's needs. “Products coming soon” does not fill that gap. |
| Pricing | Standard explains 30/40/30 milestones; Flex explains 30% upfront and 70% after launch over an agreed period, eligibility and separate third-party costs. | Payment structures are understandable and avoid guaranteed eligibility or an invented fixed instalment term. They do not establish a project price; the budget dropdown should not be read as a quotation. |
| Navigation | Four consistent page links, repeated enquiry CTAs, working local anchors and service deep links. Mobile dialog keyboard checks pass. | Low navigation ambiguity. The visitor can reach an enquiry without understanding the technical categories first. |
| Enquiry | Five required and two optional fields; “Not sure yet” and guidance choices; reassuring introduction and visible contact alternative. | Inviting and reasonably focused. Requiring both email and phone may deter some cautious visitors; that is a hypothesis, not observed abandonment. |
| Payment choice | The form asks for a preferred payment approach before the fuller explanation, which appears below the next-steps section. | A new visitor may need to leave the form or scroll substantially before choosing. The optional guidance choice mitigates this. |
| Next steps | Review, discovery and proposal are described, but no specific response window is stated. | The visitor understands the process but cannot tell when to expect a human reply. |
| Mobile | The tested widths have no document overflow; fields and CTAs remain usable, and long labels wrap. | Comfortable in Chrome's narrow viewports. Pages are long, especially About and Start a Project. Physical-device input behavior remains unverified. |
| Conversion | Clear enquiry actions and a completed confirmation flow; limited evidence of previous delivery. | I would be willing to start a conversation, but would want examples/references before committing money or business operations. This is the reviewer's assessment, not a customer finding. |

### Remaining friction and trust concerns

The form gives a short data-use reassurance but no linked privacy notice explaining processing, retention or third-party handling. That leaves unanswered questions for a visitor submitting personal contact details. A business-approved, accurate notice would strengthen trust.

The reviewed pages do not explain in practical detail how Kentara handles migration from existing spreadsheets, staff onboarding/training or the scope of ongoing support. Those questions matter to an SME replacing manual processes; the current proposal/discovery process can address them, but the visitor has to enquire first.

The existing founder image is approximately 3.2MB. Its size is verified from the local file; a slow-page claim has not been measured. It warrants a separate mobile-performance check for customers on limited data connections. No imagery was changed in this pass.

### Three highest-priority recommendations — not implemented

1. **Show credible delivery evidence.** Add an approved case study connecting a specific business problem to the delivered workflow, real screenshots and an accurately supported outcome. Use client permission for quotations. Clearly label demonstrations if completed client work cannot yet be published.
2. **Help nontechnical owners recognize their problem.** Connect existing capabilities to concrete examples such as stock records, order tracking, invoicing, approvals and replacing disconnected spreadsheets. Briefly explain what discovery, migration and staff onboarding involve, using only services Kentara actually provides.
3. **Reduce uncertainty at the enquiry decision.** Put access to Standard/Flex explanations near the payment selector, state an operationally realistic response expectation, and link an accurate privacy notice. Retain optional budget/payment guidance and eligibility caveats. These are future content decisions, not changes made here.

### Launch readiness and remaining blockers

The scoped frontend polish is ready for review, with no unresolved functional defect found in the completed local checks. The site is visually suitable for an initial business conversation; stronger evidence would improve confidence before a purchase decision.

The remaining operational launch gate is an explicitly authorized live Formspree test confirming acceptance, inbox receipt and the intended business notification, with no client autoresponder. Provider account settings and delivery remain unverified. Physical-mobile checks are also advisable before broad promotion.

Case studies, clearer business examples, privacy detail and mobile performance are recommendations for the next pass. They were not silently added, and their absence is not presented as a measured conversion failure or a legal conclusion.

## Owner-requested follow-up — 14 November 2026

After the original audit, the owner authorized implementing payment guidance, an under-24-hour response expectation and a privacy notice. The earlier recommendations and unchanged-file hashes above describe the original polish pass, before this follow-up.

- Added an expandable Standard/Flex comparison beside the optional payment preference, a link to the existing full terms and reassurance that a preference is not a commitment.
- Added the owner-confirmed under-24-hour reply expectation before submission and in the success view.
- Added `privacy.html`, linked from the form and all five page footers. It uses owner-confirmed Vercel hosting, Formspree processing, Zoho Mail, CEO-only internal access and one-month retention for unsuccessful/inactive enquiries, measured from last contact. It distinguishes operational records from provider backups and does not assert automatic deletion or universal legal compliance.
- Updated `FORMSPREE-SETUP.md` and added `PRIVACY-OPERATIONS.md` to record the operational deletion work. No provider account settings, deletion rules or email settings were changed.
- Home, About and Services received only the requested privacy footer link in this follow-up. No case studies or industry-specific positioning were added.

The updated browser harness includes the privacy page at all five viewport widths, keyboard access to the payment comparison and its terms, reply wording, and the Kentara notice link. External asset requests stalled the normal run; the follow-up was verified in offline-asset mode (`KENTARA_QA_OFFLINE=1 node tests/ui-check.mjs`). This uses the existing system-font fallback and shared CSS with external Google Fonts and Tailwind CDN requests blocked; it does not verify online font rendering. Screenshot output remains in `/tmp/kentara-ui-audit/`.

Follow-up result: **197 browser checks passed**, with zero live Formspree requests. Static link/asset/anchor/ID checks passed across all five pages; `git diff --check` and JavaScript syntax checks passed. Online font rendering, provider retention settings and live notification delivery remain unverified.
