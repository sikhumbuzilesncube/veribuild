'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <span className="text-yellow-600 text-xl">⚠</span>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Cancelled</h3>
        <p className="text-sm text-gray-600 mb-4">
          You cancelled the payment. No charges were made.
          {reference && (
            <span className="block mt-1 text-xs text-gray-500">
              Reference: {reference}
            </span>
          )}
        </p>

        <Link
          href="/payment"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white w-full justify-center"
          style={{ backgroundColor: '#E65A00' }}
        >
          Try Again
        </Link>

        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 w-full justify-center mt-2"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
    }
