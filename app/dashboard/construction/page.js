'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ConstructionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('construction_companies')
        .select('*')
        .eq('subscription_status', 'active')
        .order('rating', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setCompanies(data || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading construction companies...</p>
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
            Construction Companies
          </h1>
          <p className="text-gray-600 text-sm">
            Builders, contractors, and civil works companies in Zimbabwe.
          </p>
        </div>

        {/* Promote card */}
        <div className="bg-gradient-to-r from-[#F47B20] to-[#E06B10] rounded-lg p-6 mb-6 text-white">
          <h2 className="text-lg font-bold mb-1">Promote Your Company</h2>
          <p className="text-sm mb-4 opacity-90">
            Get featured on BOQ documents generated in your city. Limited slots available.
          </p>
          <button
            onClick={() => router.push('/dashboard/subscription?category=construction')}
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

        {companies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No construction companies listed yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <h3 className="font-bold text-[#2C3E50]">
                  {company.company_name}
                  {company.subscription_tier === 'premium' && (
                    <span className="ml-2 text-xs bg-[#F47B20] text-white px-2 py-0.5 rounded">
                      Featured
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {company.ad_text || 'No description available'}
                </p>
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  {company.phone && <div>Tel: {company.phone}</div>}
                  {company.email && <div>Email: {company.email}</div>}
                  {company.location && <div>Location: {company.location}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
                          }
