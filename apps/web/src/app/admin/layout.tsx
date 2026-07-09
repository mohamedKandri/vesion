import type { Metadata } from 'next';
import { DashboardShell, type NavItem } from '@/components/dashboard/shell';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

const NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: '◈', exact: true },
  { href: '/admin/crm', label: 'CRM Inbox', icon: '📥' },
  { href: '/admin/clients', label: 'Clients', icon: '◉' },
  { href: '/admin/projects', label: 'Projects', icon: '▤' },
  { href: '/admin/users', label: 'Team & users', icon: '⚉' },
  { href: '/admin/invoices', label: 'Invoices', icon: '⬚' },
  { href: '/admin/payments', label: 'Payments', icon: '◇' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: '↻' },
  { href: '/admin/quotes', label: 'Quotes', icon: '✎' },
  { href: '/admin/contracts', label: 'Contracts', icon: '§' },
  { href: '/admin/support', label: 'Support', icon: '☎' },
  { href: '/admin/messages', label: 'Messages', icon: '✉' },
  { href: '/admin/content', label: 'Content CMS', icon: '❏' },
  { href: '/admin/careers', label: 'Careers', icon: '⚑' },
  { href: '/admin/audit-logs', label: 'Audit logs', icon: '𝍌' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell nav={NAV} allowedRoles={['ADMIN', 'MANAGER', 'DEVELOPER']} title="Admin">
      {children}
    </DashboardShell>
  );
}
