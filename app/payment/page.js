'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PAYMENT_METHODS = [
  { id: 'ecocash', name: 'EcoCash', type: 'mobile', icon: '📱' },
  { id: 'innbucks', name: 'InnBucks', type: 'mobile', icon: '🏦' },
  { id: 'onemoney', name: 'OneMoney', type: 'mobile', icon: '📲' },
  { id: 'web', name: 'Visa / Mastercard', type: 'card', icon: '💳' },
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

  // Form state
  const [selectedMethod, setSelectedMethod] = useState('ecocash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [receiptEmail, setReceiptEmail] = useState('');

  const userType = searchParams.get('type') || 'hardware';
  const amount = searchParams.get('amount') || '15';
  const selectedPlan = PLAN_DETAILS[userType] || PLAN_DETAILS.hardware;
  const selectedMethodData = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  // Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user?.email) {
          setReceiptEmail(user.email);
        }
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

    // Validate phone for mobile methods
    if (selectedMethodData.type === 'mobile' && !phoneNumber) {
      setError('Phone number is required for mobile money payments');
      return;
    }

    // Use logged-in user email, or the receipt email, or fallback
    const finalEmail = receiptEmail || user?.email || 'noreply@veribuild.co.zw';

    setLoading(true);

    try {
      const paymentData = {
        amount: parseFloat(amount),
        customerEmail: finalEmail,
        customerPhone: phoneNumber,
        planType: userType,
        planName: selectedPlan.name,
        planDuration: selectedPlan.duration,
        userId: user?.id || null,
        paymentMethod: selectedMethod,
      };

      const response = await fetch('/api/paynow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      // Store reference
      if (data.reference) {
        localStorage.setItem('paynow_reference', data.reference);
      }
      if (data.pollUrl) {
        localStorage.setItem('paynow_pollUrl', data.pollUrl);
      }

      // Mobile method → show instructions, no redirect
      if (data.isMobile) {
        // Redirect to processing page showing instructions
        const instructionsParam = encodeURIComponent(data.instructions || 'Check your phone for a payment prompt.');
        window.location.href = `/payment/processing?reference=${data.reference}&instructions=${instructionsParam}`;
        return;
      }

      // Card method → redirect to Paynow
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      throw new Error('No payment action received from server');

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred while processing your payment');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
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
          {/* Plan Summary */}
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

          {/* User Info */}
          {user && (
            <div className="rounded-lg p-3 mb-5 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Paying as</p>
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    selectedMethod === method.id
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-300 text-gray-700'
                  }`}
                  style={selectedMethod === method.id ? { borderColor: '#F47B20', backgroundColor: '#FFF3E8', color: '#F47B20' } : {}}
                >
                  <span>{method.icon}</span>
                  <span>{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number (only for mobile methods) */}
          {selectedMethodData.type === 'mobile' && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0777777777"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
                style={{ '--tw-ring-color': '#F47B20' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                You'll receive a payment prompt on this number.
              </p>
            </div>
          )}

          {/* Optional Receipt Email */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email for Receipt (Optional)
            </label>
            <input
              type="email"
              value={receiptEmail}
              onChange={(e) => setReceiptEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Pay Button */}
          <button
            type="button"
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-semibold rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#F47B20' }}
          >
            {loading ? 'Processing...' : `Pay $${amount} Now`}
          </button>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>

          {/* Security badges */}
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
