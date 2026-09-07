'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reference, setReference] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ref = searchParams.get('reference');
    if (ref) {
      setReference(ref);
      setLoading(false);
    } else {
      setError('No transaction reference found');
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#E65A00' }}></div>
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <span className="text-red-600 text-xl">✕</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Verification Failed</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
            style={{ backgroundColor: '#E65A00' }}
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4" style={{ backgroundColor: '#E65A00' }}>
            <span className="text-white text-3xl">✓</span>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
          <p className="text-sm text-gray-600 mb-6">Your payment has been confirmed and your account is now active.</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Reference</span>
              <span className="text-sm font-medium text-gray-900">{reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium" style={{ color: '#E65A00' }}>Completed</span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white w-full justify-center transition-colors"
            style={{ backgroundColor: '#E65A00' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#CC4F00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E65A00'}
          >
            Go to Dashboard
          </Link>

          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 w-full justify-center mt-2"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
      }
