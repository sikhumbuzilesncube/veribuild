'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PAYMENT_TYPES = {
  // Subscriptions
  hardware: {
    name: 'Hardware Store',
    price: 15,
    label: 'monthly subscription',
    duration: 'monthly',
    purpose: 'subscription',
  },
  construction: {
    name: 'Construction Company',
    price: 15,
    label: 'monthly subscription',
    duration: 'monthly',
    purpose: 'subscription',
  },
  worker: {
    name: 'Skilled Worker',
    price: 5,
    label: 'monthly subscription',
    duration: 'monthly',
    purpose: 'subscription',
  },
  // BOQ generation
  boq_with_plan: {
    name: 'BOQ Generation',
    price: 10,
    label: 'with floor plan upload',
    duration: 'one-off',
    purpose: 'boq',
  },
  boq_without_plan: {
    name: 'BOQ Generation',
    price: 5,
    label: 'from a template',
    duration: 'one-off',
    purpose: 'boq',
  },
};

const FALLBACK_TYPE = {
  name: 'Payment',
  price: 0,
  label: 'unknown payment type',
  duration: '',
  purpose: 'subscription',
};

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const type = searchParams.get('type') || 'hardware';
  const amountParam = searchParams.get('amount');
  const projectId = searchParams.get('project_id');

  const typeConfig = PAYMENT_TYPES[type];
  const typeUnknown = !typeConfig;

  const config = typeConfig || FALLBACK_TYPE;
  const amount = amountParam != null ? String(amountParam) : String(config.price);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
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

    if (typeUnknown) {
      setError('Unknown payment type. Please return to the previous page and try again.');
      return;
    }

    if (!user) {
      setError('Please log in to continue with payment');
      return;
    }

    setLoading(true);

    try {
      const reference = `VB-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

      // Step 1: Create payment record via server API
      const createResponse = await fetch('/api/paynow/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          amount: parseFloat(amount),
          planType: type,
          reference: reference,
          projectId: projectId || null,
          paymentPurpose: config.purpose,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.error || 'Could not save payment record');
      }

      console.log('Payment record created:', createData);

      // Step 2: Initiate payment via SDK
      const sdkResponse = await fetch('/api/paynow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          customerEmail: user.email,
          planType: type,
          planName: config.name,
          planDuration: config.label,
          userId: user.id,
          projectId: projectId || null,
          paymentPurpose: config.purpose,
          reference: reference,
        }),
      });

      const sdkData = await sdkResponse.json();

      if (!sdkResponse.ok) {
        throw new Error(sdkData.error || 'Could not initiate payment');
      }

      console.log('SDK response:', sdkData);

      // Store reference and poll URL for the success page to use
      if (sdkData.reference) {
        localStorage.setItem('paynow_reference', sdkData.reference);
      }
      if (sdkData.pollUrl) {
        localStorage.setItem('paynow_pollUrl', sdkData.pollUrl);
      }
      if (projectId) {
        localStorage.setItem('paynow_project_id', String(projectId));
      } else {
        localStorage.removeItem('paynow_project_id');
      }

      // Step 3: Redirect to Paynow
      if (sdkData.redirectUrl) {
        window.location.href = sdkData.redirectUrl;
        return;
      }

      throw new Error('No payment URL received from Paynow');

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
            <h2 className="text-xl font-bold text-gray-900">{config.name}</h2>
            <p className="text-sm text-gray-600">{config.label}</p>
          </div>

          <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: '#FFF3E8' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Amount</span>
              <span className="text-2xl font-bold" style={{ color: '#F47B20' }}>
                ${amount}.00 USD
              </span>
            </div>
          </div>

          <div className="rounded-lg p-3 mb-5 bg-gray-50">
            <p className="text-xs text-gray-500 mb-1">Paying as</p>
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-700">
              You&apos;ll be redirected to <strong>Paynow</strong> to complete your payment securely.
            </p>
          </div>

          {typeUnknown && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600">
                Unknown payment type: <strong>{type}</strong>. Please return to the
                previous page and try again.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handlePayment}
            disabled={loading || typeUnknown}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#F47B20' }}
          >
            {loading ? 'Processing...' : `Pay $${amount} Now`}
          </button>

          <div className="mt-4 flex flex-col items-center gap-2">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg px-4 py-2"
            >
              Cancel payment
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
