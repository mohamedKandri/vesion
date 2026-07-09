'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { PageHeader } from '@/components/dashboard/page-header';
import { Tabs } from '@/components/ui/tabs';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatMoney } from '@/lib/utils';

export default function AdminSettingsPage() {
  const [tab, setTab] = useState('site');
  return (
    <>
      <PageHeader title="Settings" description="Platform configuration and billing catalog." />
      <Tabs
        tabs={[
          { id: 'site', label: 'Site settings' },
          { id: 'tax', label: 'Tax rates' },
          { id: 'discounts', label: 'Discount codes' },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />
      {tab === 'site' && <SiteSettings />}
      {tab === 'tax' && <TaxRates />}
      {tab === 'discounts' && <DiscountCodes />}
    </>
  );
}

interface Setting {
  key: string;
  value: unknown;
  updatedAt: string;
}

function SiteSettings() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { data: settings, isLoading } = useApiQuery<Setting[]>(['settings'], '/settings');
  const form = useForm<{ key: string; value: string }>();

  async function onUpsert(values: { key: string; value: string }) {
    try {
      let parsed: unknown = values.value;
      try {
        parsed = JSON.parse(values.value);
      } catch {
        // treat as plain string
      }
      await api.put('/settings', { key: values.key, value: parsed });
      success('Setting saved');
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err) {
      error('Save failed', (err as Error).message);
    }
  }

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Current settings" />
        <ul className="divide-y divide-[rgb(var(--card-border))]">
          {(settings ?? []).map((setting) => (
            <li key={setting.key} className="flex items-center gap-3 py-2.5 text-sm">
              <code className="rounded bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">{setting.key}</code>
              <span className="flex-1 truncate font-medium">{JSON.stringify(setting.value)}</span>
              <span className="text-xs text-[rgb(var(--muted))]">{formatDate(setting.updatedAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader
          title="Add or update"
          description="Values are stored as JSON — plain text is saved as a string."
        />
        <form onSubmit={form.handleSubmit(onUpsert)} className="space-y-4">
          <Input label="Key" placeholder="billing.defaultDueDays" {...form.register('key', { required: true })} />
          <Input label="Value" placeholder='14 or "text" or {"a":1}' {...form.register('value', { required: true })} />
          <Button type="submit" loading={form.formState.isSubmitting}>
            Save setting
          </Button>
        </form>
      </Card>
    </div>
  );
}

interface TaxRate {
  id: string;
  name: string;
  ratePercent: string;
  isDefault: boolean;
}

function TaxRates() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { data: rates, isLoading } = useApiQuery<TaxRate[]>(['tax-rates'], '/tax-rates');
  const form = useForm<{ name: string; ratePercent: string; isDefault: boolean }>();

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/tax-rates/${id}`),
    onSuccess: () => {
      success('Tax rate deactivated');
      void queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
    },
  });

  async function onCreate(values: { name: string; ratePercent: string; isDefault: boolean }) {
    try {
      await api.post('/tax-rates', {
        name: values.name,
        ratePercent: Number(values.ratePercent),
        isDefault: values.isDefault,
      });
      success('Tax rate created');
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Active tax rates" />
        <ul className="space-y-2">
          {(rates ?? []).map((rate) => (
            <li
              key={rate.id}
              className="flex items-center justify-between rounded-xl border border-[rgb(var(--card-border))] p-3 text-sm"
            >
              <span className="font-medium">
                {rate.name} — {Number(rate.ratePercent)}%
                {rate.isDefault && <Badge tone="brand" className="ml-2">Default</Badge>}
              </span>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deactivate.mutate(rate.id)}>
                Deactivate
              </Button>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="New tax rate" />
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
          <Input label="Name" placeholder="VAT 21%" {...form.register('name', { required: true })} />
          <Input
            label="Rate (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...form.register('ratePercent', { required: true })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-brand-500" {...form.register('isDefault')} />
            Set as default
          </label>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Create rate
          </Button>
        </form>
      </Card>
    </div>
  );
}

interface DiscountCode {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: string;
  maxRedemptions?: number | null;
  redeemedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
}

function DiscountCodes() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { data: codes, isLoading } = useApiQuery<DiscountCode[]>(['discount-codes'], '/discount-codes');
  const form = useForm<{ code: string; type: string; value: string; maxRedemptions?: string; expiresAt?: string }>({
    defaultValues: { type: 'PERCENTAGE' },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/discount-codes/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discount-codes'] }),
  });

  async function onCreate(values: {
    code: string;
    type: string;
    value: string;
    maxRedemptions?: string;
    expiresAt?: string;
  }) {
    try {
      await api.post('/discount-codes', {
        code: values.code.toUpperCase(),
        type: values.type,
        value: Number(values.value),
        maxRedemptions: values.maxRedemptions ? Number(values.maxRedemptions) : undefined,
        expiresAt: values.expiresAt || undefined,
      });
      success('Discount code created');
      form.reset({ type: 'PERCENTAGE' });
      void queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Discount codes" />
        <ul className="space-y-2">
          {(codes ?? []).map((code) => (
            <li
              key={code.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--card-border))] p-3 text-sm"
            >
              <div>
                <p className="font-mono font-bold">{code.code}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {code.type === 'PERCENTAGE' ? `${Number(code.value)}% off` : `${formatMoney(code.value)} off`} ·
                  used {code.redeemedCount}
                  {code.maxRedemptions ? `/${code.maxRedemptions}` : ''}
                  {code.expiresAt ? ` · expires ${formatDate(code.expiresAt)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={code.isActive ? 'success' : 'neutral'}>
                  {code.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggle.mutate({ id: code.id, isActive: !code.isActive })}
                >
                  {code.isActive ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="New discount code" />
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
          <Input label="Code" placeholder="LAUNCH20" {...form.register('code', { required: true })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Type" {...form.register('type')}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </Select>
            <Input label="Value" type="number" step="0.01" min="0.01" {...form.register('value', { required: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Max redemptions (optional)" type="number" min="1" {...form.register('maxRedemptions')} />
            <Input label="Expires (optional)" type="date" {...form.register('expiresAt')} />
          </div>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Create code
          </Button>
        </form>
      </Card>
    </div>
  );
}
