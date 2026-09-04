'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  // Get payment details from URL params
  const plan = searchParams.get('plan') || 'monthly';
  const userType = searchParams.get('type') || 'hardware';
  const amount = searchParams.get('amount') || '15';
  
  useEffect(() => {
    // Check if user is logged in using Supabase
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication error. Please try again.');
          setPageLoading(false);
          return;
        }
        
        if (session?.user) {
          // Get user profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Profile error:', profileError);
            // Still set user with basic info
            setUser({
              id: session.user.id,
              email: session.user.email,
              first_name: session.user.user_metadata?.first_name || 'Customer',
              last_name: session.user.user_metadata?.last_name || 'User'
            });
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email,
              first_name: profile.first_name || 'Customer',
              last_name: profile.last_name || 'User'
            });
          }
        } else {
          // Redirect to login
          router.push(`/login?redirect=/payment?type=${userType}&amount=${amount}`);
          return;
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Failed to verify your session. Please try again.');
      } finally {
        setPageLoading(false);
      }
    };
    
    checkAuth();
  }, [router, supabase, userType, amount]);

  const planDetails = {
    hardware: { name: 'Hardware Store', price: 15, duration: 'monthly' },
    construction: { name: 'Construction Company', price: 15, duration: 'monthly' },
    worker: { name: 'Skilled Worker', price: 5, duration: 'monthly' }
  };

  const selectedPlan = planDetails[userType] || planDetails.hardware;

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        amount: parseFloat(amount),
        currency: 'USD',
        customerEmail: user?.email || 'customer@example.com',
        customerFirstName: user?.first_name || 'Customer',
        customerLastName: user?.last_name || 'User',
        planType: userType,
        planName: selectedPlan.name,
        planDuration: selectedPlan.duration,
        userId: user?.id
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

  // Show loading state
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment page...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
            <p className="mt-2 text-sm text-gray-600">Complete your registration payment</p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
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
                <span className="text-lg font-bold text-blue-600">${amount}.00 USD</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900">{user.email}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
                'Pay Now'
              )}
            </button>

            <div className="mt-4 text-center">
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
                Cancel and return to dashboard
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-gray-500">Secured by ContiPay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
               }
