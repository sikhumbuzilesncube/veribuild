'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ArchitectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [architects, setArchitects] = useState([]);
  const [myListing, setMyListing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('architects')
        .select('*')
        .eq('subscription_status', 'active')
        .order('rating', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setArchitects(data || []);

      // Check if the user has their own listing
      const { data: mine } = await supabase
        .from('architects')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setMyListing(mine || null);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading architects...</p>
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
            Architects
          </h1>
          <p className="text-gray-600 text-sm">
            Architects, draftsmen, and plan designers in Zimbabwe.
          </p>
        </div>

        {/* Promote card */}
        <div className="bg-gradient-to-r from-[#F47B20] to-[#E06B10] rounded-lg p-6 mb-6 text-white">
          <h2 className="text-lg font-bold mb-1">Promote Your Firm</h2>
          <p className="text-sm mb-4 opacity-90">
            Appear on template BOQs — where new builders need architects most.
          </p>
          <button
            onClick={() => router.push('/dashboard/subscription?category=architect')}
            className="bg-white text-[#F47B20] px-5 py-2 rounded-lg font-semibold hover:bg-gray-100 transition text-sm"
          >
            View Plans
          </button>
        </div>

        {/* Your listing */}
        {myListing ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base font-bold text-[#2C3E50]">Your Listing</h2>
                <p className="text-sm text-gray-600 mt-1">{myListing.firm_name}</p>
                {myListing.location && (
                  <p className="text-xs text-gray-500">{myListing.location}</p>
                )}
              </div>
              <div className="text-right">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    myListing.subscription_tier === 'premium'
                      ? 'bg-[#F47B20] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {myListing.subscription_tier === 'premium' ? 'Premium' : 'Standard'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="font-semibold text-amber-900 mb-1">You do not have a listing yet</div>
            <p className="text-sm text-amber-800 mb-3">
              Create your architect listing to appear in the marketplace and on template BOQs.
            </p>
            <button
              onClick={() => router.push('/dashboard/architects/new')}
              className="bg-[#F47B20] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition text-sm"
            >
              Create Listing
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* All architects */}
        <h2 className="text-lg font-bold text-[#2C3E50] mb-4">
          Listed Architects
        </h2>

        {architects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No architects listed yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {architects.map((arch) => (
              <div
                key={arch.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <h3 className="font-bold text-[#2C3E50]">
                  {arch.firm_name}
                  {arch.subscription_tier === 'premium' && (
                    <span className="ml-2 text-xs bg-[#F47B20] text-white px-2 py-0.5 rounded">
                      Featured
                    </span>
                  )}
                </h3>
                {arch.contact_person && (
                  <p className="text-xs text-gray-500 mt-0.5">{arch.contact_person}</p>
                )}
                {arch.services && arch.services.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">{arch.services.join(', ')}</p>
                )}
                {(arch.price_per_m2_min || arch.price_per_m2_max) && (
                  <p className="text-xs text-gray-600 mt-1">
                    ${arch.price_per_m2_min || 0}–${arch.price_per_m2_max || 0} per m²
                  </p>
                )}
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  {arch.phone && <div>Tel: {arch.phone}</div>}
                  {arch.email && <div>Email: {arch.email}</div>}
                  {arch.location && <div>Location: {arch.location}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
      }
