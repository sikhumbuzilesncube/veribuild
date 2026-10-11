'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PAYMENT_METHODS = [
  { id: 'ecocash', name: 'EcoCash', icon: '📱' },
  { id: 'innbucks', name: 'InnBucks', icon: '🏦' },
  { id: 'onemoney', name: 'OneMoney', icon: '📲' },
  { id: 'card', name: 'Visa / Mastercard', icon: '💳' },
];

const PLAN_DETAILS = {
  hardware: { name: 'Hardware Store', price: 15, duration: 'monthly' },
  construction: { name: 'Construction Company', price: 15, duration: 'monthly' },
  worker: { name: 'Skilled Worker', price: 5, duration: 'monthly' },
};

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');

  const userType = searchParams.get('type') || 'hardware';
  const amount = searchParams.get('amount') || '15';
  const selectedPlan = PLAN_DETAILS[userType] || PLAN_DETAILS.hardware;

  // Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user?.user_metadata?.phone) {
          setPhoneNumber(user.user_metadata.phone);
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    loadUser();
  }, []);

  const handlePayment = async () => {
    setError(null);

    if (!user) {
      setError('Please log in to continue with payment');
      return;
    }

    setLoading(true);

    try {
      // Generate unique reference
      const reference = `VB-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

      // Save pending record to database
      const { error: dbError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          currency: 'USD',
          payment_method: userType,
          payment_status: 'pending',
          transaction_reference: reference,
          provider: 'paynow',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Could not save payment record');
      }

      // Build Paynow Custom Form URL
      const payload = `id=27343&amount=${amount}&amount_quantity=0.00&l=1&reference=${reference}`;
      const encoded = btoa(payload);
      const paynowUrl = `https://www.paynow.co.zw/Payment/BillPaymentLink/?q=${encoded}`;

      // Redirect to Paynow
      window.location.href = paynowUrl;

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#F47B20' }}></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Please Log In</h2>
          <p className="text-sm text-gray-600 mb-6">
            You need to be logged in to complete payment.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#F47B20' }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-5" style={{ backgroundColor: '#F47B20' }}>
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold">VeriBuild</h1>
            <p className="text-orange-100 text-xs font-medium tracking-wider mt-1">
              A PRODUCT OF GATEKEEPERAI
            </p>
            <p className="text-white/80 text-sm mt-2">Complete Your Payment</p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">{selectedPlan.name}</h2>
            <p className="text-sm text-gray-600">{selectedPlan.duration} subscription</p>
          </div>

          <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: '#FFF3E8' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Amount</span>
              <span className="text-2xl font-bold" style={{ color: '#F47B20' }}>${amount}.00 USD</span>
            </div>
          </div>

          <div className="rounded-lg p-3 mb-5 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Paying as</p>
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-700">
              You'll be redirected to <strong>Paynow</strong> to complete your payment.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#F47B20' }}
          >
            {loading ? 'Processing...' : `Pay $${amount} Now`}
          </button>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-green-500 text-sm">✓</span>
                <span className="text-xs text-gray-500">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm" style={{ color: '#F47B20' }}>◆</span>
                <span className="text-xs text-gray-500">Paynow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
    }
