'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminHardwarePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hardwareStores, setHardwareStores] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadHardware() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      // Check if admin
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (!userData || userData.user_type !== 'admin') {
        router.push('/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('hardware_stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setHardwareStores(data || []);
      }
      setLoading(false);
    }

    loadHardware();
  }, [router]);

  const filteredStores = filter === 'all' 
    ? hardwareStores 
    : hardwareStores.filter(s => s.subscription_status === filter);

  const stats = {
    total: hardwareStores.length,
    active: hardwareStores.filter(s => s.subscription_status === 'active').length,
    inactive: hardwareStores.filter(s => s.subscription_status === 'inactive').length,
    pending: hardwareStores.filter(s => s.is_verified === false).length,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full w-64 bg-[#2C3E50] text-white p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              V
            </div>
            <h1 className="text-xl font-bold">VeriBuild</h1>
            <span className="text-xs bg-[#F47B20]/30 px-2 py-1 rounded-full">Admin</span>
          </div>

          <nav className="space-y-2">
            <Link href="/admin/dashboard" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
              📊 Dashboard
            </Link>
            <Link href="/admin/workers" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
              👷 Workers
            </Link>
            <Link href="/admin/hardware" className="block py-2 px-4 bg-[#F47B20] rounded-lg font-medium">
              🏪 Hardware
            </Link>
            <Link href="/admin/construction" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
              🏗️ Construction
            </Link>
            <Link href="/admin/payments" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
              💳 Payments
            </Link>
            <Link href="/admin/settings" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
              ⚙️ Settings
            </Link>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/admin/login');
              }}
              className="block w-full text-left py-2 px-4 hover:bg-red-500/20 rounded-lg transition font-medium mt-8 text-red-300"
            >
              🚪 Logout
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-6 w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#2C3E50]">🏪 Hardware Stores</h1>
              <p className="text-gray-600">Manage all hardware stores</p>
            </div>
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-[#2C3E50] transition">
              ← Back to Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-[#2C3E50]">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Stores</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.inactive}</p>
              <p className="text-sm text-gray-500">Inactive</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending Verification</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all' ? 'bg-[#2C3E50] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'inactive' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Hardware Stores List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredStores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2C3E50] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Store Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStores.map((store) => (
                      <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-[#2C3E50]">{store.store_name}</td>
                        <td className="px-4 py-3 text-gray-600">{store.contact_person}</td>
                        <td className="px-4 py-3 text-gray-600">{store.location || 'Not set'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            store.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                            store.subscription_status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {store.subscription_status || 'inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/hardware/${store.id}`}
                            className="text-[#F47B20] hover:underline text-sm font-medium"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🏪</div>
                <p className="text-gray-500">No hardware stores found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
        }
