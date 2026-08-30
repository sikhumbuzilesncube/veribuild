'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: storeData } = await supabase
        .from('hardware_stores')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (storeData) {
        setStore(storeData);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    setMessage('');

    try {
      // Simulate payment - in production, this would integrate with EcoCash
      // For now, we'll just update the subscription status
      
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month from now

      const { error } = await supabase
        .from('hardware_stores')
        .update({
          subscription_status: 'active',
          subscription_expiry: expiryDate.toISOString().split('T')[0],
        })
        .eq('id', store.id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: '✅ Subscription activated! Your store will now appear on BOQs.' });
        setStore({ ...store, subscription_status: 'active', subscription_expiry: expiryDate.toISOString().split('T')[0] });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    }
    setSubscribing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">No Store Found</h2>
          <Link href="/hardware/register" className="text-[#F47B20] hover:underline">
            Register Your Store
          </Link>
        </div>
      </div>
    );
  }

  const isActive = store.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">💳 Subscription</h1>
            <p className="text-gray-600">{store.store_name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isActive ? '✅ Active' : '⚠️ Inactive'}
          </span>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Why Subscribe Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">Why Subscribe?</h2>
          <p className="text-gray-600 mb-4">
            Subscribing to VeriBuild puts your hardware store in front of hundreds of potential customers.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-bold text-[#2C3E50]">Get Customer Leads</h3>
              <p className="text-sm text-gray-500">Every BOQ generated shows your prices to builders and contractors.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-bold text-[#2C3E50]">Increase Sales</h3>
              <p className="text-sm text-gray-500">Customers compare prices and choose the best deal — yours.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🏆</div>
              <h3 className="font-bold text-[#2C3E50]">Build Trust</h3>
              <p className="text-sm text-gray-500">Verified hardware stores appear with a badge, building customer confidence.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">📈</div>
              <h3 className="font-bold text-[#2C3E50]">Analytics</h3>
              <p className="text-sm text-gray-500">See how many customers viewed your prices and what they bought.</p>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#2C3E50]">Subscription Plan</h2>
            <p className="text-3xl font-bold text-[#F47B20] mt-2">$15<span className="text-base font-normal text-gray-500">/month</span></p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500 text-xl">✓</span>
              <span>List your prices on every BOQ generated</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500 text-xl">✓</span>
              <span>Get customer leads directly from the platform</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500 text-xl">✓</span>
              <span>Monthly analytics on views and leads</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500 text-xl">✓</span>
              <span>Verified badge on your store profile</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="text-green-500 text-xl">✓</span>
              <span>Priority support</span>
            </div>
          </div>

          {isActive ? (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-700 font-semibold">✅ Your subscription is active!</p>
              {store.subscription_expiry && (
                <p className="text-sm text-green-600 mt-1">
                  Expires: {new Date(store.subscription_expiry).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full mt-6 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50"
            >
              {subscribing ? 'Processing...' : 'Subscribe Now — $15/month'}
            </button>
          )}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[#2C3E50] mb-3">Frequently Asked Questions</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-[#2C3E50]">What happens after I subscribe?</p>
              <p className="text-gray-500">Your prices will appear on all BOQs generated by users. You'll also get access to analytics and leads.</p>
            </div>
            <div>
              <p className="font-medium text-[#2C3E50]">Can I cancel anytime?</p>
              <p className="text-gray-500">Yes, you can cancel your subscription at any time. Your store will remain active until the end of the billing period.</p>
            </div>
            <div>
              <p className="font-medium text-[#2C3E50]">How do I update my prices?</p>
              <p className="text-gray-500">Go to the Materials page to add, edit, or remove products and prices.</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link href="/dashboard/hardware" className="text-gray-600 hover:text-[#2C3E50] transition">
            ← Back to Store Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
        }
