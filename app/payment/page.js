'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Get payment details from URL params
  const plan = searchParams.get('plan') || 'monthly';
  const userType = searchParams.get('type') || 'hardware';
  const amount = searchParams.get('amount') || '15';
  
  // Use a test email if no user is logged in
  const testEmail = 'test@example.com';
  const testName = 'Test User';

  const planDetails = {
    hardware: { name: 'Hardware Store', price: 15, duration: 'monthly', emoji: '🏪' },
    construction: { name: 'Construction Company', price: 15, duration: 'monthly', emoji: '🏗️' },
    worker: { name: 'Skilled Worker', price: 5, duration: 'monthly', emoji: '🔧' }
  };

  const selectedPlan = planDetails[userType] || planDetails.hardware;

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        amount: parseFloat(amount),
        currency: 'USD',
        customerEmail: testEmail,
        customerFirstName: testName.split(' ')[0] || 'Test',
        customerLastName: testName.split(' ')[1] || 'User',
        planType: userType,
        planName: selectedPlan.name,
        planDuration: selectedPlan.duration,
        // Use a test user ID - you can replace this with actual user ID later
        userId: 'test-user-123'
      };

      console.log('Initiating payment with data:', paymentData);

      const response = await fetch('/api/contipay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      console.log('Payment response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Redirect to ContiPay payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred while processing your payment');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with logo */}
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-white text-xl font-bold text-center">VeriBuild</h1>
          <p className="text-blue-100 text-sm text-center">Complete Your Payment</p>
        </div>

        <div className="px-6 py-8">
          {/* Plan details */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{selectedPlan.emoji}</div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h2>
            <p className="text-sm text-gray-600">{selectedPlan.duration} subscription</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Plan</span>
              <span className="text-sm font-semibold text-gray-900">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-gray-700">Duration</span>
              <span className="text-sm font-semibold text-gray-900">{selectedPlan.duration}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
              <span className="text-sm font-medium text-gray-700">Amount</span>
              <span className="text-2xl font-bold text-blue-600">${amount}.00 USD</span>
            </div>
          </div>

          {/* Test mode notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-yellow-700">
                <strong>Test Mode:</strong> Using test customer details. Log in for your actual account.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              `Pay $${amount} Now`
            )}
          </button>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>

          {/* Security badges */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-500">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-500">ContiPay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
