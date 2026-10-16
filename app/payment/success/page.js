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
  const [retryUrl, setRetryUrl] = useState(null);

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

      // Step 1: call verify to check the true status
      let verifiedStatus = null;
      try {
        const res = await fetch(`/api/paynow/verify?reference=${encodeURIComponent(ref)}`);
        const data = await res.json();
        console.log('Verify result:', data);
        if (data.status) {
          verifiedStatus = String(data.status).toLowerCase();
          setStatus(verifiedStatus);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }

      // Step 2: look up the payment row to find purpose, project_id, method, amount
      let paymentRow = null;
      try {
        const { data } = await supabase
          .from('payments')
          .select('payment_purpose, project_id, payment_method, amount, payment_status')
          .eq('transaction_reference', ref)
          .maybeSingle();

        if (data) {
          paymentRow = data;
          setPaymentInfo(data);

          // Prefer the DB status if the verify response did not include one
          if (!verifiedStatus && data.payment_status) {
            verifiedStatus = String(data.payment_status).toLowerCase();
            setStatus(verifiedStatus);
          }
        }
      } catch (err) {
        console.error('Payment lookup error:', err);
      }

      // Step 3: fall back to localStorage for project_id
      let projectId = paymentRow?.project_id || null;
      if (!projectId && typeof window !== 'undefined') {
        const stored = localStorage.getItem('paynow_project_id');
        if (stored) projectId = parseInt(stored, 10);
      }

      // Step 4: decide the redirect target
      let target = '/dashboard';
      const purpose = paymentRow?.payment_purpose;
      if (purpose === 'boq' && projectId) {
        target = `/dashboard/boq/${projectId}`;
      }
      setRedirectTarget(target);

      // Step 5: build a retry URL for cancelled or pending payments
      if (paymentRow?.payment_method) {
        const params = new URLSearchParams();
        params.set('type', paymentRow.payment_method);
        if (paymentRow.amount) params.set('amount', String(paymentRow.amount));
        if (projectId) params.set('project_id', String(projectId));
        setRetryUrl(`/payment?${params.toString()}`);
      }

      setLoading(false);
    }

    run();
  }, [searchParams]);

  // Auto-redirect only when the payment is actually completed and there is a
  // specific destination (e.g. a BOQ page).
  useEffect(() => {
    if (loading) return;
    if (status !== 'completed') return;
    if (redirectTarget === '/dashboard') return;

    setCountingDown(true);
    const t = setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('paynow_reference');
        localStorage.removeItem('paynow_pollUrl');
        localStorage.removeItem('paynow_project_id');
      }
      router.push(redirectTarget);
    }, 3000);

    return () => clearTimeout(t);
  }, [loading, status, redirectTarget, router]);

  const isCompleted = status === 'completed' || status === 'paid';
  const isCancelled = status === 'cancelled' || status === 'failed' || status === 'declined';
  const isPending = !isCompleted && !isCancelled && !loading;
  const isBoqPayment = paymentInfo?.payment_purpose === 'boq';

  // Presentation per state
  let iconBg = '#F47B20';
  let iconGlyph = '✓';
  let heading = 'Payment Successful';
  let subheading = 'Your payment has been received.';

  if (loading) {
    iconBg = '#94a3b8';
    iconGlyph = '…';
    heading = 'Verifying your payment';
    subheading = 'Please wait a moment while we confirm the payment with Paynow.';
  } else if (isCancelled) {
    iconBg = '#f59e0b';
    iconGlyph = '!';
    heading = 'Payment Cancelled';
    subheading = 'Your payment was not completed. No charge was made.';
  } else if (isPending) {
    iconBg = '#3b82f6';
    iconGlyph = '…';
    heading = 'Payment Pending';
    subheading = 'We are still confirming this payment. You will be notified once it clears.';
  } else if (isCompleted && isBoqPayment) {
    heading = 'Payment Successful';
    subheading = 'Your payment has been received. Your BOQ is ready to view.';
  } else if (isCompleted) {
    heading = 'Payment Successful';
    subheading = 'Your payment has been received. Your subscription is now active.';
  }

  const primaryLabel = isCompleted
    ? (isBoqPayment ? 'View Your BOQ' : 'Go to Dashboard')
    : 'Try Again';

  const primaryHref = isCompleted
    ? redirectTarget
    : (retryUrl || '/dashboard');

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
          <div
            className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4"
            style={{ backgroundColor: iconBg }}
          >
            <span className="text-white text-3xl">{iconGlyph}</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">{heading}</h3>
          <p className="text-sm text-gray-600 mb-6">{subheading}</p>

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
              <span className="text-sm font-medium" style={{ color: isCompleted ? '#16a34a' : '#F47B20' }}>
                {loading ? 'Verifying...' : (status || 'Unknown')}
              </span>
            </div>
          </div>

          {countingDown && redirectTarget !== '/dashboard' && (
            <p className="text-xs text-gray-500 mb-4">
              Redirecting you to your BOQ...
            </p>
          )}

          <Link
            href={primaryHref}
            className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white w-full justify-center transition-colors"
            style={{ backgroundColor: '#F47B20' }}
          >
            {primaryLabel}
          </Link>

          {/* Secondary button — only for non-completed states */}
          {!isCompleted && !loading && (
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 w-full justify-center mt-2"
            >
              Back to Dashboard
            </Link>
          )}

          {/* Secondary button — for completed payments, offer Cancel-free cleanup path */}
          {isCompleted && redirectTarget !== '/dashboard' && (
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 w-full justify-center mt-2"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
    }
