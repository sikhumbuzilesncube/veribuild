'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  const transactionId = searchParams.get('transaction_id');
  const status = searchParams.get('status');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!transactionId) {
        setError('No transaction ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/contipay/verify?transaction_id=${transactionId}`);
        const data = await response.json();

        if (response.ok) {
          setPaymentStatus(data);
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
  }, [transactionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Verification Failed</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
          <p className="text-sm text-gray-600 mb-6">Your payment has been confirmed and your account is now active.</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Transaction ID</span>
              <span className="text-sm font-medium text-gray-900">{transactionId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium text-green-600 capitalize">{status || 'completed'}</span>
            </div>
            {paymentStatus?.amount && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-sm font-medium text-gray-900">${paymentStatus.amount} USD</span>
              </div>
            )}
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 w-full justify-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
        }
