'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-store';
import type { Company } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { Tabs } from '@/components/ui/tabs';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');
  return (
    <>
      <PageHeader title="Settings" description="Your profile, security, and company details." />
      <Tabs
        tabs={[
          { id: 'profile', label: 'Profile' },
          { id: 'security', label: 'Security' },
          { id: 'company', label: 'Company' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="mt-6 max-w-2xl space-y-6">
        {tab === 'profile' && <ProfileSettings />}
        {tab === 'security' && <SecuritySettings />}
        {tab === 'company' && <CompanySettings />}
      </div>
    </>
  );
}

function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      jobTitle: user?.jobTitle ?? '',
    },
  });

  async function onSubmit(values: Record<string, string>) {
    try {
      await api.patch('/users/me/profile', values);
      await refreshUser();
      success('Profile updated');
    } catch (err) {
      error('Update failed', (err as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader title="Profile" description="How you appear across the platform." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" {...register('firstName', { required: true })} />
          <Input label="Last name" {...register('lastName', { required: true })} />
        </div>
        <Input label="Email" value={user?.email ?? ''} disabled hint="Contact support to change your email." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone" type="tel" {...register('phone')} />
          <Input label="Job title" {...register('jobTitle')} />
        </div>
        <Button type="submit" loading={formState.isSubmitting}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}

function SecuritySettings() {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // ── password change ──
  const passwordForm = useForm<{ currentPassword: string; newPassword: string }>();
  async function changePassword(values: { currentPassword: string; newPassword: string }) {
    try {
      await api.post('/auth/change-password', values);
      passwordForm.reset();
      success('Password changed');
    } catch (err) {
      error('Change failed', (err as Error).message);
    }
  }

  // ── two-factor ──
  const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [disableOpen, setDisableOpen] = useState(false);
  const disableForm = useForm<{ password: string; code: string }>();

  async function startSetup() {
    try {
      setSetupData(await api.post('/auth/2fa/setup'));
    } catch (err) {
      error('Setup failed', (err as Error).message);
    }
  }

  async function confirmSetup() {
    try {
      await api.post('/auth/2fa/enable', { code });
      setSetupData(null);
      setCode('');
      await refreshUser();
      success('Two-factor authentication enabled 🎉');
    } catch (err) {
      error('Invalid code', (err as Error).message);
    }
  }

  async function disable2fa(values: { password: string; code: string }) {
    try {
      await api.post('/auth/2fa/disable', values);
      setDisableOpen(false);
      disableForm.reset();
      await refreshUser();
      success('Two-factor authentication disabled');
    } catch (err) {
      error('Disable failed', (err as Error).message);
    }
  }

  // ── sessions ──
  interface Session {
    id: string;
    userAgent?: string | null;
    ip?: string | null;
    createdAt: string;
  }
  const { data: sessions } = useApiQuery<Session[]>(['sessions'], '/auth/sessions');
  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => {
      success('Session revoked');
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  return (
    <>
      <Card>
        <CardHeader title="Password" />
        <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            {...passwordForm.register('currentPassword', { required: true })}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 10 characters with uppercase, lowercase, and a digit."
            {...passwordForm.register('newPassword', {
              required: true,
              minLength: 10,
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
            })}
          />
          <Button type="submit" loading={passwordForm.formState.isSubmitting}>
            Change password
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Two-factor authentication"
          description="Protect your account with an authenticator app (TOTP). Works fully offline."
        />
        {user?.twoFactorEnabled ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-500">✓ Enabled</p>
            <Button variant="outline" onClick={() => setDisableOpen(true)}>
              Disable
            </Button>
          </div>
        ) : setupData ? (
          <div className="space-y-4">
            <p className="text-sm text-[rgb(var(--muted))]">
              Scan this QR code with your authenticator app (1Password, Aegis, Google Authenticator…),
              then enter the 6-digit code to confirm.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setupData.qrCodeDataUrl} alt="TOTP QR code" className="h-44 w-44 rounded-xl bg-white p-2" />
            <div className="flex max-w-xs gap-2">
              <Input
                aria-label="6-digit code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button onClick={confirmSetup} disabled={code.length !== 6}>
                Confirm
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={startSetup}>Enable 2FA</Button>
        )}
      </Card>

      <Card>
        <CardHeader title="Active sessions" description="Devices currently signed in to your account." />
        <ul className="space-y-3">
          {(sessions ?? []).map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--card-border))] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{session.userAgent ?? 'Unknown device'}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {session.ip ?? 'Unknown IP'} · signed in {formatDateTime(session.createdAt)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => revoke.mutate(session.id)}>
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={disableOpen} onClose={() => setDisableOpen(false)} title="Disable two-factor authentication">
        <form onSubmit={disableForm.handleSubmit(disable2fa)} className="space-y-4">
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            {...disableForm.register('password', { required: true })}
          />
          <Input
            label="Current 6-digit code"
            inputMode="numeric"
            maxLength={6}
            {...disableForm.register('code', { required: true, minLength: 6, maxLength: 6 })}
          />
          <Button type="submit" variant="danger" className="w-full" loading={disableForm.formState.isSubmitting}>
            Disable 2FA
          </Button>
        </form>
      </Modal>
    </>
  );
}

function CompanySettings() {
  const user = useAuth((s) => s.user);
  const { success, error } = useToast();
  const { data: company } = useApiQuery<Company>(
    ['company', user?.companyId],
    `/companies/${user?.companyId}`,
    !!user?.companyId,
  );
  const { register, handleSubmit, formState } = useForm({
    values: {
      name: company?.name ?? '',
      website: company?.website ?? '',
      industry: company?.industry ?? '',
      taxId: company?.taxId ?? '',
      address: company?.address ?? '',
      city: company?.city ?? '',
      country: company?.country ?? '',
    },
  });

  if (!user?.companyId) {
    return (
      <Card>
        <CardHeader title="Company" />
        <p className="text-sm text-[rgb(var(--muted))]">
          Your account is not linked to a company yet. Contact your Vesion manager to set this up.
        </p>
      </Card>
    );
  }

  async function onSubmit(values: Record<string, string>) {
    try {
      await api.patch(`/companies/${user!.companyId}`, {
        ...values,
        website: values.website || undefined,
      });
      success('Company profile updated');
    } catch (err) {
      error('Update failed', (err as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader title="Company profile" description="Used on invoices, quotes, and contracts." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Company name" {...register('name', { required: true })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Website" placeholder="https://…" {...register('website')} />
          <Input label="Industry" {...register('industry')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Tax / VAT ID" {...register('taxId')} />
          <Input label="Address" {...register('address')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" {...register('city')} />
          <Input label="Country" {...register('country')} />
        </div>
        <Button type="submit" loading={formState.isSubmitting}>
          Save company
        </Button>
      </form>
    </Card>
  );
}
