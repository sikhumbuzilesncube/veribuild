'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('EC');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const plan = searchParams.get('plan') || 'monthly';
  const userType = searchParams.get('type') || 'hardware';
  const amount = searchParams.get('amount') || '15';
  
  const testEmail = 'test@example.com';
  const testName = 'Test User';

  // Payment methods from ContiPay documentation
  const paymentMethods = [
    { id: 'EC', name: 'EcoCash', testNumbers: ['071234567 (Success)', '071234568 (Failed)'] },
    { id: 'TC', name: 'TeleCash', testNumbers: ['0731234567 (Success)', '0731234568 (Failed)'] },
    { id: 'OM', name: 'OneMoney', testNumbers: ['0711234567 (Success)', '0711234568 (Failed)'] },
    { id: 'MN', name: 'MTN Mobile', testNumbers: ['0761234567 (Success)', '0761234568 (Failed)'] },
    { id: 'AT', name: 'Airtel Money', testNumbers: ['0751234567 (Success)', '0751234568 (Failed)'] },
    { id: 'MP', name: 'M-Pesa', testNumbers: ['0721234567 (Success)', '0721234568 (Failed)'] },
    { id: 'IB', name: 'InnBucks', testNumbers: ['Ends with 7 (Success)', 'Ends with 8 (Failed)'] },
  ];

  const planDetails = {
    hardware: { name: 'Hardware Store', price: 15, duration: 'monthly' },
    construction: { name: 'Construction Company', price: 15, duration: 'monthly' },
    worker: { name: 'Skilled Worker', price: 5, duration: 'monthly' }
  };

  const selectedPlan = planDetails[userType] || planDetails.hardware;

  const handlePayment = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        amount: parseFloat(amount),
        currency: 'USD',
        customerEmail: testEmail,
        customerFirstName: testName.split(' ')[0] || 'Test',
        customerLastName: testName.split(' ')[1] || 'User',
        customerPhone: phoneNumber,
        nationalId: '00 1234567 A 00',
        planType: userType,
        planName: selectedPlan.name,
        planDuration: selectedPlan.duration,
        userId: 'test-user-123',
        paymentMethod: selectedMethod // Include the selected payment method
      };

      console.log('Initiating payment with data:', paymentData);

      const response = await fetch('/api/contipay', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred while processing your payment');
      setLoading(false);
    }
  };

  // Get test numbers for selected method
  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-5" style={{ backgroundColor: '#E65A00' }}>
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold tracking-tight">VeriBuild</h1>
            <p className="text-orange-100 text-xs font-medium tracking-wider mt-1">
              A PRODUCT OF GATEKEEPERAI
            </p>
            <p className="text-white/80 text-sm mt-2">Complete Your Payment</p>
          </div>
        </div>

        <div className="px-6 py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h2>
            <p className="text-sm text-gray-600">{selectedPlan.duration} subscription</p>
          </div>

          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#FFF3E8' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Plan</span>
              <span className="text-sm font-semibold text-gray-900">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-gray-700">Duration</span>
              <span className="text-sm font-semibold text-gray-900">{selectedPlan.duration}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t" style={{ borderColor: '#FFD4B8' }}>
              <span className="text-sm font-medium text-gray-700">Amount</span>
              <span className="text-2xl font-bold" style={{ color: '#E65A00' }}>${amount}.00 USD</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    selectedMethod === method.id
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {method.name}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 071234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {selectedMethodData && (
              <p className="text-xs text-gray-500 mt-1">
                Test numbers: {selectedMethodData.testNumbers.join(', ')}
              </p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <span className="text-yellow-600 text-sm font-medium mr-2">ⓘ</span>
              <p className="text-xs text-yellow-700">
                <strong>Test Mode:</strong> Enter test phone numbers from the list above.
                <br />
                <span className="text-xs">You will be redirected to ContiPay for verification.</span>
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
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#E65A00' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#CC4F00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E65A00'}
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

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-green-500 text-sm">✓</span>
                <span className="text-xs text-gray-500">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm" style={{ color: '#E65A00' }}>◆</span>
                <span className="text-xs text-gray-500">ContiPay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
    }
