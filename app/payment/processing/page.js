'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentProcessingPage() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState('waiting');
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const ref = searchParams.get('reference');
    const inst = searchParams.get('instructions');
    setReference(ref);
    setInstructions(inst ? decodeURIComponent(inst) : 'Check your phone for the payment prompt.');

    if (!ref) return;

    // Poll status every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/paynow/status?reference=${ref}`);
        const data = await res.json();

        if (data.success && data.paid) {
          setStatus('paid');
          clearInterval(pollInterval);
          setTimeout(() => {
            window.location.href = `/payment/success?reference=${ref}`;
          }, 1500);
        } else if (data.status === 'cancelled' || data.status === 'failed') {
          setStatus('failed');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
      setPollCount(c => c + 1);
    }, 5000);

    // Stop after 10 minutes (120 polls)
    setTimeout(() => clearInterval(pollInterval), 600000);

    return () => clearInterval(pollInterval);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 text-center" style={{ backgroundColor: '#F47B20' }}>
          <h1 className="text-white text-2xl font-bold">VeriBuild</h1>
          <p className="text-orange-100 text-xs font-medium tracking-wider mt-1">
            A PRODUCT OF GATEKEEPERAI
          </p>
        </div>

        <div className="px-6 py-8 text-center">
          {status === 'waiting' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-4" style={{ backgroundColor: '#FFF3E8' }}>
                <span className="text-4xl">📱</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Phone</h3>
              <p className="text-sm text-gray-600 mb-4">
                {instructions}
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-5 text-left">
                <p className="text-xs text-yellow-700">
                  <strong>Reference:</strong> {reference}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Enter your PIN on your phone to complete the payment. This page will update automatically.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#F47B20' }}></div>
                <span className="text-sm text-gray-500">
                  Waiting for confirmation{pollCount > 0 ? ` (${pollCount * 5}s)` : ''}...
                </span>
              </div>
            </>
          )}

          {status === 'paid' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4" style={{ backgroundColor: '#F47B20' }}>
                <span className="text-white text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-sm text-gray-600">Redirecting...</p>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <span className="text-red-600 text-3xl">✕</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-sm text-gray-600 mb-5">
                The payment was not completed. Please try again.
              </p>
              <Link
                href="/payment"
                className="inline-flex items-center px-4 py-3 rounded-lg text-white font-medium"
                style={{ backgroundColor: '#F47B20' }}
              >
                Try Again
              </Link>
            </>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link href="/" className="text-xs text-gray-500">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
      }
