'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('checking');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    async function checkPayment() {
      if (!reference) {
        setStatus('error');
        setLoading(false);
        return;
      }

      try {
        // Check payment status from database
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('transaction_reference', reference)
          .single();

        if (error) {
          console.error('Error fetching payment:', error);
          setStatus('error');
        } else if (data) {
          setPaymentDetails(data);
          setStatus(data.payment_status === 'completed' ? 'success' : 'pending');
          
          // If payment is for a project, update project status
          if (data.project_id && data.payment_status === 'completed') {
            await supabase
              .from('projects')
              .update({ status: 'paid' })
              .eq('id', data.project_id);
          }
          
          // If payment is for hardware subscription, update hardware store
          if (data.payment_type === 'hardware' && data.payment_status === 'completed') {
            // Update hardware store subscription
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            
            await supabase
              .from('hardware_stores')
              .update({
                subscription_status: 'active',
                subscription_expiry: expiryDate.toISOString().split('T')[0],
              })
              .eq('user_id', data.user_id);
          }
          
          // If payment is for construction subscription, update construction company
          if (data.payment_type === 'construction' && data.payment_status === 'completed') {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            
            await supabase
              .from('construction_companies')
              .update({
                subscription_status: 'active',
                subscription_expiry: expiryDate.toISOString().split('T')[0],
              })
              .eq('user_id', data.user_id);
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setStatus('error');
      }

      setLoading(false);
    }

    checkPayment();
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-xl">
            V
          </div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">VeriBuild</h1>
        </div>

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your payment has been processed successfully.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
              <p><strong>Reference:</strong> {reference}</p>
              <p><strong>Amount:</strong> ${paymentDetails?.amount}</p>
              <p><strong>Status:</strong> Completed</p>
              <p><strong>Date:</strong> {new Date(paymentDetails?.created_at).toLocaleString()}</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-block mt-4 bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">Payment Pending</h2>
            <p className="text-gray-600 mb-4">
              Your payment is being processed. Please check back later.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
              <p><strong>Reference:</strong> {reference}</p>
              <p><strong>Amount:</strong> ${paymentDetails?.amount}</p>
              <p><strong>Status:</strong> Pending</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-block mt-4 bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">
              There was an issue with your payment. Please try again.
            </p>
            <Link
              href="/payment"
              className="inline-block mt-4 bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
            >
              Try Again
            </Link>
          </>
        )}

        <div className="mt-6">
          <p className="text-sm text-gray-400">
            Reference: {reference || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
      }
