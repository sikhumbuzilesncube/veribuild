'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

export default function WorkersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('workers')
        .select('*')
        .eq('subscription_status', 'active')
        .order('rating', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setWorkers(data || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workers...</p>
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
              Skilled Workers
            </h1>
            <p className="text-gray-600 text-sm">
              Masons, carpenters, plumbers, electricians, and other trades.
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#F47B20] to-[#E06B10] rounded-lg p-6 mb-6 text-white">
            <h2 className="text-lg font-bold mb-1">Promote Your Profile</h2>
            <p className="text-sm mb-4 opacity-90">
              Appear on BOQ documents and get found by more clients.
            </p>
            <button
              onClick={() => router.push('/dashboard/subscription?category=worker')}
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

          {workers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No workers listed yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold text-[#2C3E50]">
                        {worker.full_name}
                        {worker.subscription_tier === 'premium' && (
                          <span className="ml-2 text-xs bg-[#F47B20] text-white px-2 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{worker.trade}</p>
                      {worker.sub_trade && (
                        <p className="text-xs text-gray-500">{worker.sub_trade}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>Rating: {worker.rating || 0}</div>
                      <div>Rate: ${worker.daily_rate_usd || 0}/day</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {worker.location || 'Location not set'} ·{' '}
                    {worker.years_experience || 0} years
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
