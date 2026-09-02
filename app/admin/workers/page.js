'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminWorkersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadWorkers() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      if (session.user.email !== 'admin@gatekeeperai.co.zw') {
        router.push('/dashboard');
        return;
      }

      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setWorkers(data || []);
      }
      setLoading(false);
    }

    loadWorkers();
  }, [router]);

  const filteredWorkers = filter === 'all' 
    ? workers 
    : workers.filter(w => w.verification_status === filter);

  const stats = {
    total: workers.length,
    pending: workers.filter(w => w.verification_status === 'pending').length,
    approved: workers.filter(w => w.verification_status === 'approved').length,
    rejected: workers.filter(w => w.verification_status === 'rejected').length,
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">👷 Workers</h1>
            <p className="text-gray-600">Manage all workers</p>
          </div>
          <Link href="/admin/dashboard" className="text-gray-600 hover:text-[#2C3E50] transition">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-[#2C3E50]">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Workers</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-gray-500">Approved</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-sm text-gray-500">Rejected</p>
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
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Workers List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredWorkers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2C3E50] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Trade</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-[#2C3E50]">{worker.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">{worker.trade}</td>
                      <td className="px-4 py-3 text-gray-600">{worker.location || 'Not set'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          worker.verification_status === 'approved' ? 'bg-green-100 text-green-700' :
                          worker.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {worker.verification_status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/workers/${worker.id}`}
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
              <div className="text-5xl mb-4">👷</div>
              <p className="text-gray-500">No workers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
        }
