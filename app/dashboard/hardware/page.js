'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

export default function HardwarePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
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
        .eq('subscription_status', 'active')
        .order('store_name', { ascending: true });

      if (fetchError) {
        console.error('Hardware list error:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setStores(data || []);

      const { data: mine } = await supabase
        .from('hardware_stores')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setMyStore(mine || null);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hardware stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="md:ml-64 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">

          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-800 mb-3"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
              Hardware Stores
            </h1>
            <p className="text-gray-600 text-sm">
              Hardware shops, building suppliers, and cement dealers in Zimbabwe.
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#F47B20] to-[#E06B10] rounded-lg p-6 mb-6 text-white">
            <h2 className="text-lg font-bold mb-1">Promote Your Store</h2>
            <p className="text-sm mb-4 opacity-90">
              Get featured on BOQ documents in your city. Only 3 stores per city.
            </p>
            <button
              onClick={() => router.push('/dashboard/subscription?category=hardware')}
              className="bg-white text-[#F47B20] px-5 py-2 rounded-lg font-semibold hover:bg-gray-100 transition text-sm"
            >
              View Plans
            </button>
          </div>

          {myStore ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-base font-bold text-[#2C3E50]">Your Store</h2>
                  <p className="text-sm text-gray-600 mt-1">{myStore.store_name}</p>
                  {myStore.location && (
                    <p className="text-xs text-gray-500">{myStore.location}</p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      myStore.subscription_tier === 'premium'
                        ? 'bg-[#F47B20] text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {myStore.subscription_tier === 'premium' ? 'Premium' : 'Standard'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => router.push('/dashboard/hardware/new')}
                  className="bg-[#F47B20] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition text-sm"
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
                  Change Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="font-semibold text-amber-900 mb-1">
                You do not have a store listing yet
              </div>
              <p className="text-sm text-amber-800 mb-3">
                Create your store listing to appear in the marketplace and on BOQ pages in your city.
              </p>
              <button
                onClick={() => router.push('/dashboard/hardware/new')}
                className="bg-[#F47B20] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition text-sm"
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

          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">
            Listed Stores
          </h2>

          {stores.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No hardware stores listed yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <h3 className="font-bold text-[#2C3E50]">
                    {store.store_name}
                    {store.subscription_tier === 'premium' && (
                      <span className="ml-2 text-xs bg-[#F47B20] text-white px-2 py-0.5 rounded">
                        Featured
                      </span>
                    )}
                  </h3>
                  <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                    {store.contact_person && <div>Contact: {store.contact_person}</div>}
                    {store.phone && <div>Tel: {store.phone}</div>}
                    {store.email && <div>Email: {store.email}</div>}
                    {store.location && <div>Location: {store.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
  }
