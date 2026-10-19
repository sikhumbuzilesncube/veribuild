'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reference, setReference] = useState(null);
  const [retryUrl, setRetryUrl] = useState('/dashboard');

  useEffect(() => {
    async function loadPaymentInfo() {
      const ref = searchParams.get('reference') || localStorage.getItem('paynow_reference');
      setReference(ref);

      if (ref) {
        // Look up the payment to rebuild the exact retry URL
        const { data } = await supabase
          .from('payments')
          .select('payment_method, amount, project_id')
          .eq('transaction_reference', ref)
          .maybeSingle();

        if (data) {
          const params = new URLSearchParams();
          params.set('type', data.payment_method);
          if (data.amount) params.set('amount', String(data.amount));
          if (data.project_id) params.set('project_id', String(data.project_id));
          setRetryUrl(`/payment?${params.toString()}`);
        }
      }
    }
    loadPaymentInfo();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 text-center" style={{ backgroundColor: '#E65A00' }}>
          <h1 className="text-white text-2xl font-bold tracking-tight">VeriBuild</h1>
          <p className="text-orange-100 text-xs font-medium tracking-wider mt-1">
            A PRODUCT OF GATEKEEPERAI
          </p>
        </div>

        <div className="px-6 py-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <span className="text-yellow-600 text-3xl">!</span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Cancelled</h3>
          <p className="text-sm text-gray-600 mb-4">
            You cancelled the payment. No charges were made.
          </p>

          {reference && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reference</span>
                <span className="text-sm font-medium text-gray-900 break-all">{reference}</span>
              </div>
            </div>
          )}

          <Link
            href={retryUrl}
            className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white w-full justify-center transition-colors"
            style={{ backgroundColor: '#E65A00' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#CC4F00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E65A00'}
          >
            Try Again
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 w-full justify-center mt-2"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
