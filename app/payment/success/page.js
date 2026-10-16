'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [reference, setReference] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [redirectTarget, setRedirectTarget] = useState('/dashboard');
  const [countingDown, setCountingDown] = useState(false);

  useEffect(() => {
    async function run() {
      const ref =
        searchParams.get('reference') ||
        (typeof window !== 'undefined' ? localStorage.getItem('paynow_reference') : null);

      setReference(ref);

      if (!ref) {
        setLoading(false);
        return;
      }

      // Step 1: call verify to make sure the payment is completed
      let verifiedStatus = null;
      try {
        const res = await fetch(`/api/paynow/verify?reference=${encodeURIComponent(ref)}`);
        const data = await res.json();
        console.log('Verify result:', data);
        if (data.success || data.status) {
          verifiedStatus = data.status;
          setStatus(data.status);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }

      // Step 2: look up the payment row to find purpose and project_id
      let purpose = null;
      let projectId = null;
      try {
        const { data } = await supabase
          .from('payments')
          .select('payment_purpose, project_id, payment_method, amount, payment_status')
          .eq('transaction_reference', ref)
          .maybeSingle();

        if (data) {
          purpose = data.payment_purpose;
          projectId = data.project_id;
          setPaymentInfo(data);
        }
      } catch (err) {
        console.error('Payment lookup error:', err);
      }

      // Step 3: fall back to localStorage for project_id if the DB did not have it
      if (!projectId && typeof window !== 'undefined') {
        const stored = localStorage.getItem('paynow_project_id');
        if (stored) projectId = parseInt(stored, 10);
      }

      // Step 4: decide where to send the user
      let target = '/dashboard';
      if (purpose === 'boq' && projectId) {
        target = `/dashboard/boq/${projectId}`;
      }
      setRedirectTarget(target);

      setLoading(false);
    }

    run();
  }, [searchParams]);

  // Auto-redirect after 3 seconds if we have a specific target
  useEffect(() => {
    if (loading) return;
    if (redirectTarget === '/dashboard') return; // do not auto-redirect for generic case

    setCountingDown(true);
    const t = setTimeout(() => {
      // Clean up localStorage keys
      if (typeof window !== 'undefined') {
        localStorage.removeItem('paynow_reference');
        localStorage.removeItem('paynow_pollUrl');
        localStorage.removeItem('paynow_project_id');
      }
      router.push(redirectTarget);
    }, 3000);

    return () => clearTimeout(t);
  }, [loading, redirectTarget, router]);

  const isBoqPayment = paymentInfo?.payment_purpose === 'boq';
  const isSubscription = paymentInfo?.payment_purpose === 'subscription';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 text-center" style={{ backgroundColor: '#F47B20' }}>
          <h1 className="text-white text-2xl font-bold tracking-tight">VeriBuild</h1>
          <p className="text-orange-100 text-xs font-medium tracking-wider mt-1">
            A PRODUCT OF GATEKEEPERAI
          </p>
        </div>

        <div className="px-6 py-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4" style={{ backgroundColor: '#F47B20' }}>
            <span className="text-white text-3xl">✓</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful</h3>
          <p className="text-sm text-gray-600 mb-6">
            {isBoqPayment
              ? 'Your payment has been received. Your BOQ is ready to view.'
              : isSubscription
              ? 'Your payment has been received. Your subscription is now active.'
              : 'Your payment has been received.'}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            {reference && (
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Reference</span>
                <span className="text-sm font-medium text-gray-900 break-all">
                  {reference}
                </span>
              </div>
            )}
            {paymentInfo?.amount != null && (
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-sm font-medium text-gray-900">
                  ${Number(paymentInfo.amount).toFixed(2)} USD
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium" style={{ color: '#F47B20' }}>
                {loading ? 'Verifying...' : (status || 'Completed')}
              </span>
            </div>
          </div>

          {countingDown && redirectTarget !== '/dashboard' && (
            <p className="text-xs text-gray-500 mb-4">
              Redirecting you to your BOQ...
            </p>
          )}

          <Link
            href={redirectTarget}
            className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white w-full justify-center transition-colors"
            style={{ backgroundColor: '#F47B20' }}
          >
            {isBoqPayment ? 'View Your BOQ' : 'Go to Dashboard'}
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 w-full justify-center mt-2"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
  }
