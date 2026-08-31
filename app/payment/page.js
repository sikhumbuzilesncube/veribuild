'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    email: '',
    phone: '',
    description: '',
    projectId: '',
    paymentType: 'boq', // 'boq', 'hardware', 'construction'
  });

  useEffect(() => {
    // Check if there's a payment type from URL
    const type = searchParams.get('type');
    const amount = searchParams.get('amount');
    const projectId = searchParams.get('projectId');

    if (type) {
      setPaymentData(prev => ({ ...prev, paymentType: type }));
    }
    if (amount) {
      setPaymentData(prev => ({ ...prev, amount: amount }));
    }
    if (projectId) {
      setPaymentData(prev => ({ ...prev, projectId: projectId }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!paymentData.amount || !paymentData.email) {
      setError('Please fill in amount and email');
      setLoading(false);
      return;
    }

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/paynow/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentData.amount),
          email: paymentData.email,
          phone: paymentData.phone,
          description: paymentData.description || `VeriBuild - ${paymentData.paymentType} Payment`,
          projectId: paymentData.projectId || null,
          paymentType: paymentData.paymentType,
          userId: session?.user?.id || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Payment initiated! Redirecting to PayNow...');
        setRedirectUrl(result.redirectUrl);
        
        // Open PayNow in new window
        window.open(result.redirectUrl, '_blank');
        
        // Redirect to success page after 3 seconds
        setTimeout(() => {
          router.push(`/payment/success?reference=${result.reference}`);
        }, 3000);
      } else {
        setError(result.error || 'Payment initiation failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <h1 className="text-2xl font-bold text-[#2C3E50]">VeriBuild</h1>
          </div>
          <p className="text-gray-500 text-sm">💳 Pay with PayNow</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
            {redirectUrl && (
              <a 
                href={redirectUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block mt-2 text-[#F47B20] font-semibold hover:underline"
              >
                Click here if PayNow doesn't open automatically
              </a>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type
            </label>
            <select
              name="paymentType"
              value={paymentData.paymentType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
            >
              <option value="boq">BOQ Generation</option>
              <option value="hardware">Hardware Store Subscription ($15/month)</option>
              <option value="construction">Construction Company Subscription ($15/month)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={paymentData.amount}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              {paymentData.paymentType === 'boq' && 'Residential: $10 | Commercial: $30'}
              {(paymentData.paymentType === 'hardware' || paymentData.paymentType === 'construction') && 'Standard subscription: $15/month'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={paymentData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={paymentData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="+263 78 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              name="description"
              value={paymentData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="What is this payment for?"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Pay with PayNow →'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Secured by PayNow
          </p>
          <p className="text-xs text-gray-400 mt-1">
            You will be redirected to PayNow to complete your payment
          </p>
          <Link href="/dashboard" className="text-sm text-[#F47B20] hover:underline mt-2 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
            }
