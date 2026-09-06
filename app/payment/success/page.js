'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const reference = searchParams.get('reference');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setError('No transaction reference provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/contipay/verify?reference=${reference}`);
        const data = await response.json();

        if (response.ok) {
          setStatus(data);
        } else {
          setError(data.error || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('An error occurred while verifying payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [reference]);

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
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
            style={{ backgroundColor: '#E65A00' }}
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4" style={{ backgroundColor: '#E65A00' }}>
            <span className="text-white text-xl">✓</span>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white w-full justify-center"
            style={{ backgroundColor: '#E65A00' }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
            }
