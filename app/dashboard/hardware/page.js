'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HardwarePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
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
        .eq('subscription_status', 'active');

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setStores(data || []);
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
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

        {/* Promote card */}
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

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
  );
          }
