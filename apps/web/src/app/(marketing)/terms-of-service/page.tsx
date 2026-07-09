import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/legal-page';

export const metadata: Metadata = { title: 'Terms of Service' };

const CONTENT = `These Terms of Service ("Terms") govern your use of the VESION website and client platform, and form the framework for services we deliver. Project-specific terms are set out in individual statements of work and contracts signed through the platform.

## 1. Definitions

"VESION", "we" — VESION B.V., Keizersgracht 520, 1017 EK Amsterdam, Netherlands. "Client", "you" — the person or company using our services. "Platform" — the vesion.dev website, client dashboard, and admin systems. "Deliverables" — software, designs, and documentation produced under a statement of work.

## 2. Accounts

You must provide accurate information when creating an account and keep credentials confidential. You are responsible for activity under your account. We may suspend accounts that violate these Terms or threaten platform security. Accounts are for business use; you confirm you are acting in a professional capacity.

## 3. Services and deliverables

The scope, timeline, and price of each engagement are defined in a written quote or contract. Changes to scope are agreed in writing and may affect price and timeline. We warrant that Deliverables will materially conform to the agreed specification for 30 days after acceptance; we will correct non-conformities at no charge during this period.

## 4. Payment

Invoices are payable within 14 days by bank transfer unless otherwise agreed. Late payments may accrue statutory commercial interest and may suspend ongoing work after written notice. Subscription plans renew automatically each billing period until cancelled; cancellation takes effect at the end of the current period.

## 5. Intellectual property

Upon full payment, all intellectual property rights in the Deliverables transfer to you, including source code and design files. We retain rights to pre-existing tools, libraries, and generic know-how, which we license to you perpetually and royalty-free to the extent embedded in the Deliverables. Open-source components remain governed by their respective licenses, which we document.

## 6. Confidentiality

Each party will keep the other's non-public information confidential and use it only for the engagement. This obligation survives termination for 5 years. We are happy to sign a mutual NDA on request.

## 7. Acceptable use

You may not use the Platform to store or distribute unlawful content, attempt to breach its security, reverse engineer non-open components, or interfere with service for other clients.

## 8. Liability

To the maximum extent permitted by law, each party's aggregate liability arising from an engagement is limited to the fees paid for that engagement in the 12 months preceding the claim. Neither party is liable for indirect or consequential damages. Nothing limits liability for willful misconduct, gross negligence, or death or personal injury.

## 9. Termination

Either party may terminate an engagement for material breach not cured within 14 days of written notice. You may close your platform account at any time; clauses on payment, IP, confidentiality, and liability survive.

## 10. Governing law

These Terms are governed by Dutch law. Disputes are submitted to the competent court of Amsterdam, after a good-faith attempt to resolve them amicably.

## 11. Changes

We may revise these Terms; material changes are announced 30 days in advance. Continued use after the effective date constitutes acceptance.`;

export default function TermsPage() {
  return <LegalPage title="Terms of Service" updated="July 1, 2026" content={CONTENT} />;
}
