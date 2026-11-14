# Formspree Setup

The native Kentara project enquiry form submits to:

`https://formspree.io/f/xvkazbdn`

The endpoint is already connected in `start-project.html`. No private API key or Formspree account credential belongs in the website source.

## Provider configuration

1. Sign in to the Formspree account that owns form ID `xvkazbdn`.
2. Open the form settings and confirm the notification recipient is Kentara's approved business email, such as `info@kentaratech.com`.
3. Verify the recipient email address if Formspree requests verification.
4. Leave autoresponder or confirmation-email features disabled. Kentara does not send automatic acknowledgement emails to clients.
5. Keep Formspree's built-in spam filtering enabled. The form also includes a hidden `_gotcha` honeypot field for basic bot protection.
6. Use the Formspree dashboard's Inbox/Submissions view to review enquiries and export them if needed.

## Fields sent

The form sends these named fields:

- `full_name`
- `email`
- `phone`
- `service_needed`
- `project_challenge`
- `estimated_budget`
- `payment_approach`

The `_gotcha` field is intentionally empty for normal visitors and should remain hidden in the form UI.

## Testing

Use a clearly labelled test enquiry, for example `Kentara Form Test - 2026-11-14`, then confirm:

- Formspree returns a successful response.
- The submission appears in the Formspree dashboard.
- Kentara receives the configured notification.
- No client autoresponder is sent.

Do not repeatedly submit test enquiries to the live endpoint.

## Changing providers or the endpoint

Update the form `action` in `start-project.html` and keep the field names stable where possible. Update this guide whenever the provider, endpoint, or notification configuration changes.

## Privacy notice

The local website now includes `privacy.html`, linked from the form and page footers. It reflects the owner-confirmed Vercel hosting, Formspree submissions, Zoho email, CEO-only access, and a one-month policy for enquiries that do not become projects (measured from last contact).

Apply that retention policy to both the Formspree inbox and Zoho correspondence, including deleted-item folders where applicable. Verify account-specific storage and backup behavior. This website change does not configure automatic deletion or verify Formspree account retention settings. Do not assume that deleting a Formspree record also deletes its Zoho email copy.
