import type { Metadata } from 'next';
import { DashboardShell, type NavItem } from '@/components/dashboard/shell';

export const metadata: Metadata = {
  title: 'Client Dashboard',
  robots: { index: false, follow: false },
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: '◈', exact: true },
  { href: '/dashboard/projects', label: 'Projects', icon: '▤' },
  { href: '/dashboard/invoices', label: 'Invoices', icon: '⬚' },
  { href: '/dashboard/payments', label: 'Payments', icon: '◇' },
  { href: '/dashboard/quotes', label: 'Quotes', icon: '✎' },
  { href: '/dashboard/contracts', label: 'Contracts', icon: '§' },
  { href: '/dashboard/messages', label: 'Messages', icon: '✉' },
  { href: '/dashboard/support', label: 'Support', icon: '☎' },
  { href: '/dashboard/knowledge-base', label: 'Knowledge base', icon: '❏' },
  { href: '/dashboard/assistant', label: 'AI Assistant', icon: '✦' },
  { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/dashboard/activity', label: 'Activity', icon: '↻' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
];

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={NAV} allowedRoles={['CLIENT', 'ADMIN', 'MANAGER', 'DEVELOPER']} title="Client">
      {children}
    </DashboardShell>
  );
}
