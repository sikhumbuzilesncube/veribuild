'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

function getPlanLabel(store) {
  if (!store) return 'No Plan';
  if (store.subscription_status !== 'active') return 'No Plan';
  if (store.subscription_tier === 'premium') {
    return store.subscription_coverage === 'national'
      ? 'Premium · National'
      : 'Premium · Local';
  }
  return 'Standard';
}

function getBadgeClass(store) {
  if (!store || store.subscription_status !== 'active') {
    return 'bg-yellow-100 text-yellow-800';
  }
  if (store.subscription_tier === 'premium') {
    return 'bg-brand-500 text-white';
  }
  return 'bg-blue-100 text-blue-800';
}

export default function HardwarePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myStore, setMyStore] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('hardware_stores')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Store lookup error:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setMyStore(data || null);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <Sidebar />

      <div className="md:ml-64 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">

          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600 hover:text-slate-700 mb-3 flex items-center gap-1 font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 mb-2">
              My Store
            </h1>
            <p className="text-gray-600 text-sm">
              Manage your store, products, and subscription.
            </p>
          </div>

          <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl p-6 mb-6 text-white shadow-sm">
            <h2 className="text-lg font-bold mb-1">Promote Your Store</h2>
            <p className="text-sm mb-4 opacity-90">
              Get featured on BOQ documents in your city. Only 3 stores per city.
            </p>
            <button
              onClick={() => router.push('/dashboard/subscription?category=hardware')}
              className="bg-white text-brand-600 px-5 py-2 rounded-lg font-semibold hover:bg-gray-50 transition text-sm shadow-sm"
            >
              View Plans
            </button>
          </div>

          {myStore ? (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                {/* Header section with fixed flex-wrap for the badge */}
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-slate-700">Your Store</h2>
                    <p className="text-xl font-semibold text-slate-800 mt-1 break-words">{myStore.store_name}</p>
                    <div className="mt-3 text-sm text-gray-500 space-y-1">
                      {myStore.contact_person && <div>Contact: {myStore.contact_person}</div>}
                      {myStore.phone && <div>Tel: {myStore.phone}</div>}
                      {myStore.email && <div>Email: {myStore.email}</div>}
                      {myStore.location && <div>Location: {myStore.location}</div>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap ${getBadgeClass(myStore)}`}>
                      {getPlanLabel(myStore)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push('/dashboard/hardware/new')}
                    className="bg-brand-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-600 transition text-sm"
                  >
                    Edit Store
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/hardware/products')}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                  >
                    Manage Products
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/subscription?category=hardware')}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                  >
                    {myStore.subscription_status === 'active' ? 'Change Plan' : 'Choose a Plan'}
                  </button>
                </div>
              </div>

              {myStore.subscription_status !== 'active' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                  <div className="font-semibold text-amber-900 mb-1">
                    Your store is not subscribed
                  </div>
                  <p className="text-sm text-amber-800 mb-4">
                    Your store appears in the marketplace. To also appear on BOQ
                    documents, choose a subscription plan.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/subscription?category=hardware')}
                    className="bg-brand-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-brand-600 transition text-sm"
                  >
                    Choose a Plan
                  </button>
                </div>
              )}

              {myStore.subscription_status === 'active' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
                  <div className="font-semibold text-green-900 mb-1 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Your store is active
                  </div>
                  <p className="text-sm text-green-800 mt-2">
                    {myStore.subscription_tier === 'premium' &&
                    myStore.subscription_coverage === 'national'
                      ? 'You appear on BOQ documents in all 47 cities.'
                      : myStore.subscription_tier === 'premium'
                      ? 'You appear on BOQ documents in your city.'
                      : 'You appear in the marketplace directory. Upgrade to appear on BOQ documents.'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
              <div className="font-semibold text-amber-900 mb-2 text-lg">
                You have not created a store yet
              </div>
              <p className="text-sm text-amber-800 mb-4">
                Create your store listing to appear in the marketplace and on BOQ documents.
                You will be able to add products and select a subscription plan.
              </p>
              <button
                onClick={() => router.push('/dashboard/hardware/new')}
                className="bg-brand-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-600 transition text-sm"
              >
                Create Store
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-900">
            <div className="font-semibold mb-2">How it works</div>
            <p className="leading-relaxed">
              Your store and products are visible in the marketplace for homeowners and
              contractors. When you subscribe to a plan, your store also appears on BOQ
              documents generated in your city (or all cities for the national plan).
            </p>
          </div>

        </div>
      </div>
    </div>
  );
      }
