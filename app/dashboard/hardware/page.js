'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function HardwareDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalLeads: 0,
    subscriptionStatus: 'inactive',
    subscriptionExpiry: null,
  });

  useEffect(() => {
    async function loadHardwareData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Get hardware store
      const { data: storeData, error: storeError } = await supabase
        .from('hardware_stores')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (storeError) {
        console.error('Store error:', storeError);
        setLoading(false);
        return;
      }

      setStore(storeData);
      setStats({
        totalMaterials: 0,
        totalLeads: 0,
        subscriptionStatus: storeData.subscription_status || 'inactive',
        subscriptionExpiry: storeData.subscription_expiry || null,
      });

      // Get materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('hardware_store_id', storeData.id);

      if (!materialsError) {
        setMaterials(materialsData || []);
        setStats(prev => ({ ...prev, totalMaterials: materialsData?.length || 0 }));
      }

      setLoading(false);
    }

    loadHardwareData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hardware dashboard...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">No Store Found</h2>
          <p className="text-gray-600">You haven't registered a hardware store yet.</p>
          <Link
            href="/hardware/register"
            className="mt-4 inline-block bg-[#F47B20] text-white px-6 py-2 rounded-lg hover:bg-[#E06B10] transition"
          >
            Register Your Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">🏪 Hardware Dashboard</h1>
            <p className="text-gray-600 font-semibold">{store.store_name}</p>
            <p className="text-sm text-gray-500">{store.location || 'No location set'}</p>
            <p className="text-sm text-gray-500">Contact: {store.contact_person} • {store.email}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              stats.subscriptionStatus === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {stats.subscriptionStatus === 'active' ? '✅ Active' : '⚠️ Inactive'}
            </span>
            {stats.subscriptionStatus !== 'active' && (
              <button className="block mt-2 bg-[#F47B20] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E06B10] transition">
                Subscribe $15/month →
              </button>
            )}
            {stats.subscriptionExpiry && (
              <p className="text-xs text-gray-500 mt-1">
                Expires: {new Date(stats.subscriptionExpiry).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Total Materials</p>
            <p className="text-3xl font-bold text-[#2C3E50]">{stats.totalMaterials}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Total Leads</p>
            <p className="text-3xl font-bold text-[#2C3E50]">{stats.totalLeads}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Store Status</p>
            <p className={`text-xl font-bold ${
              stats.subscriptionStatus === 'active' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {stats.subscriptionStatus === 'active' ? '✅ Active' : '⚠️ Inactive'}
            </p>
          </div>
        </div>

        {/* Materials */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#2C3E50]">📦 Your Materials</h2>
            <button className="bg-[#F47B20] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E06B10] transition">
              + Add Materials
            </button>
          </div>
          {materials.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-2">Material Name</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Unit</th>
                    <th className="pb-2">Price (USD)</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-[#2C3E50]">{material.name}</td>
                      <td className="py-3 text-gray-600">{material.category || 'Uncategorized'}</td>
                      <td className="py-3 text-gray-600">{material.unit}</td>
                      <td className="py-3 font-bold text-[#2C3E50]">${material.price_usd}</td>
                      <td className="py-3">
                        <button className="text-[#F47B20] hover:underline text-sm">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-500">No materials added yet</p>
              <p className="text-sm text-gray-400">Start by uploading your inventory</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-2">📤</div>
            <h3 className="font-bold text-[#2C3E50]">Upload Prices</h3>
            <p className="text-sm text-gray-500">Upload your price list (CSV)</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-[#2C3E50]">Analytics</h3>
            <p className="text-sm text-gray-500">View your store performance</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-lg transition cursor-pointer">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-bold text-[#2C3E50]">Leads</h3>
            <p className="text-sm text-gray-500">See who viewed your prices</p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-[#2C3E50] transition">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
    }
