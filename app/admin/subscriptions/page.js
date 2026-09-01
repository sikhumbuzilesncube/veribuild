'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    failed: 0,
  });

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('subscription_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setLogs(data || []);
        setStats({
          total: data?.length || 0,
          active: data?.filter(l => l.status === 'active').length || 0,
          pending: data?.filter(l => l.status === 'pending').length || 0,
          failed: data?.filter(l => l.status === 'failed').length || 0,
        });
      }
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">📊 Subscription Logs</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Total</p>
            <p className="text-3xl font-bold text-[#2C3E50]">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Active</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Failed</p>
            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2C3E50] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Period</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm">{log.user_id?.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm capitalize">{log.user_type}</td>
                    <td className="px-4 py-3 text-sm font-bold">${log.amount}</td>
                    <td className="px-4 py-3 text-sm">
                      {log.period_start} → {log.period_end}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === 'active' ? 'bg-green-100 text-green-700' :
                        log.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(log.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/admin" className="text-gray-600 hover:text-[#2C3E50] transition">
            ← Back to Admin
          </Link>
        </div>
      </div>
    </div>
  );
          }
