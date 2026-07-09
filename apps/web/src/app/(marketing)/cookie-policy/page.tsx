import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/legal-page';

export const metadata: Metadata = { title: 'Cookie Policy' };

const CONTENT = `This policy explains how VESION uses cookies and similar technologies on vesion.dev.

## What are cookies?

Cookies are small text files stored on your device by your browser. Similar technologies include localStorage and sessionStorage, which store data in your browser without sending it to a server automatically.

## What we use

We deliberately keep our footprint minimal. We do **not** use advertising cookies, cross-site trackers, or third-party analytics.

- **vesion_refresh** (cookie, httpOnly, up to 30 days) — keeps you signed in to the client dashboard securely. Strictly necessary for authenticated areas.
- **vesion.accessToken** (sessionStorage) — short-lived API token while your tab is open. Strictly necessary.
- **vesion.refreshToken** (localStorage) — allows the dashboard to restore your session. Strictly necessary for staying signed in.
- **theme** (localStorage) — remembers your dark/light mode preference. Functional.
- **vesion.visitorId** (localStorage) — an anonymous random identifier that lets the website AI assistant remember your conversation. Functional; contains no personal data.

## Strictly necessary means no consent banner

Because every item above is either strictly necessary for a service you explicitly request (signing in, chatting with the assistant) or a simple functional preference (theme), no consent pop-up is legally required. If we ever introduce analytics or marketing cookies, we will ask for your consent first.

## Managing cookies

You can clear or block cookies in your browser settings at any time. Blocking the strictly necessary items will prevent you from signing in to the dashboard.

## Contact

Questions about this policy? Email **privacy@vesion.dev**.`;

export default function CookiePolicyPage() {
  return <LegalPage title="Cookie Policy" updated="July 1, 2026" content={CONTENT} />;
}
