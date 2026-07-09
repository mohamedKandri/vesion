import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/legal-page';

export const metadata: Metadata = { title: 'Privacy Policy' };

const CONTENT = `VESION B.V. ("VESION", "we", "us") is committed to protecting your personal data. This policy explains what we collect, why, and the rights you have. It applies to our website, client dashboard, and all related services.

## Who we are

VESION B.V. is a software engineering company registered in the Netherlands, with its office at Keizersgracht 520, 1017 EK Amsterdam. For any privacy matter, contact us at **privacy@vesion.dev**. VESION acts as the data controller for the personal data described in this policy.

## What we collect

- **Account data** — name, email address, company details, and hashed passwords when you create an account.
- **Contact and enquiry data** — the information you submit through our contact, newsletter, or job application forms.
- **Project data** — files, messages, tickets, and other content you share with us while we work together.
- **Usage data** — server logs including IP address, browser type, and pages visited, retained for security and diagnostics.
- **Billing data** — invoicing details such as company name, address, and VAT number. We do not store card numbers; payments are settled by bank transfer.

## Why we process it (legal bases)

- **Performing our contract with you** — delivering projects, operating the client dashboard, invoicing, and support.
- **Legitimate interests** — securing our systems, preventing abuse, and improving our services.
- **Consent** — newsletter subscriptions and optional cookies. You can withdraw consent at any time.
- **Legal obligations** — retaining financial records as required by Dutch tax law (currently 7 years).

## How long we keep data

Account and project data is retained while your account is active and for 12 months after closure, unless a longer statutory period applies. Contact form submissions are kept for 24 months. Server logs are kept for 90 days.

## Sharing

We do not sell personal data. We share data only with: (a) service providers strictly needed to run our infrastructure (hosting and email delivery), bound by data processing agreements; (b) authorities where legally required. Our infrastructure is self-hosted within the European Economic Area.

## Your rights

Under the GDPR you may request access, rectification, erasure, restriction, portability, or object to processing. You may also lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens). To exercise any right, email **privacy@vesion.dev** — we respond within 30 days.

## Security

We protect data with encryption in transit (TLS) and at rest for sensitive fields, role-based access control, two-factor authentication, audit logging, and regular security reviews. Despite these measures, no system is perfectly secure; we will notify you and the relevant authority of any breach as required by law.

## Changes

We may update this policy as our services evolve. Material changes will be announced on this page and, for account holders, by email.`;

export default function PrivacyPolicyPage() {
  return <LegalPage title="Privacy Policy" updated="July 1, 2026" content={CONTENT} />;
}
