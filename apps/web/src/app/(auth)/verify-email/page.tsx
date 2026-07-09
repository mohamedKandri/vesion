'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    api
      .post<{ message: string }>('/auth/verify-email', { token }, { anonymous: true })
      .then((res) => {
        setState('success');
        setMessage(res.message);
      })
      .catch((err: Error) => {
        setState('error');
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div className="text-center">
      {state === 'verifying' && (
        <>
          <Spinner className="mx-auto h-8 w-8 text-brand-500" />
          <h1 className="mt-4 font-display text-2xl font-bold">Verifying your email…</h1>
        </>
      )}
      {state === 'success' && (
        <>
          <p className="text-4xl" aria-hidden="true">
            🎉
          </p>
          <h1 className="mt-4 font-display text-2xl font-bold">Email verified</h1>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{message}</p>
          <Link href="/login" className="mt-6 inline-block">
            <Button>Sign in</Button>
          </Link>
        </>
      )}
      {state === 'error' && (
        <>
          <p className="text-4xl" aria-hidden="true">
            ⚠️
          </p>
          <h1 className="mt-4 font-display text-2xl font-bold">Verification failed</h1>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{message}</p>
          <Link href="/login" className="mt-6 inline-block">
            <Button variant="outline">Back to sign in</Button>
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
