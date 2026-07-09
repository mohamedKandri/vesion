import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number | string, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  );
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unitSeconds, unit] of units) {
    if (Math.abs(seconds) >= unitSeconds) {
      return rtf.format(-Math.round(seconds / unitSeconds), unit);
    }
  }
  return 'just now';
}

export function initials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/** Human label for SCREAMING_SNAKE enum values. */
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
