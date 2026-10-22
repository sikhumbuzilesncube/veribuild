'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          if (res.status === 403) {
            router.replace('/dashboard');
            return;
          }
          throw new Error('Failed to fetch stats');
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError('Could not load admin data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="md:ml-64 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error || 'Unauthorized'}
          </div>
        </div>
      </div>
    );
  }

  const { stats, recentProjects, recentPayments, chartData, recentLogs } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="md:ml-64 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50]">Platform Overview</h1>
              <p className="text-gray-600 text-sm">Live stats and recent activity.</p>
            </div>
            <button onClick={() => window.location.reload()} className="text-sm text-[#F47B20] hover:underline">
              Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                +{stats.recentSignups} this week
              </div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mt-2">Total Users</p>
              <p className="text-3xl font-bold text-[#2C3E50] mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                +${stats.recentRevenue} this week
              </div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mt-2">Total Revenue</p>
              <p className="text-3xl font-bold text-[#F47B20] mt-1">${stats.totalRevenue.toFixed(2)}</p>
              <div className="mt-1 text-xs text-gray-500">
                <span className="text-green-600">${stats.subRevenue} subs</span> · <span className="text-blue-600">${stats.boqRevenue} BOQs</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mt-2">BOQs Generated</p>
              <p className="text-3xl font-bold text-[#2C3E50] mt-1">{stats.totalProjects}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mt-2">Urgent Jobs</p>
              <p className="text-3xl font-bold text-[#2C3E50] mt-1">{stats.totalUrgentJobs}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Chart */}
            <div className="md:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Revenue & BOQs (Last 7 Days)</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => val.slice(5)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value, name) => {
                        if (name === 'revenue') return [`$${value}`, 'Revenue'];
                        if (name === 'boqs') return [value, 'BOQs Generated'];
                        return [value, name];
                      }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#F47B20" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="boqs" stroke="#2C3E50" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Error Tracker */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-red-50">
                <h2 className="font-bold text-red-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Recent System Errors
                </h2>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
                {!recentLogs || recentLogs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center justify-center h-full">
                    <svg className="w-8 h-8 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    All systems healthy. No recent errors.
                  </div>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="p-3 text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-red-600 truncate mr-2">{log.message}</span>
                        <span className="text-gray-400 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                      {log.context && (
                        <pre className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-[#2C3E50]">Recent Payments</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recentPayments.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No completed payments yet.</div>
                ) : (
                  recentPayments.map((p, i) => (
                    <div key={i} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm text-[#2C3E50] capitalize">{p.payment_method.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${p.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 capitalize">{p.payment_purpose}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-[#2C3E50]">Recent BOQs Generated</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recentProjects.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No projects yet.</div>
                ) : (
                  recentProjects.map((p, i) => (
                    <div key={i} className="p-4 flex justify-between items-center">
                      <div className="truncate pr-4">
                        <p className="font-medium text-sm text-[#2C3E50] truncate">{p.project_name}</p>
                        <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-[#2C3E50]">${(p.total_cost || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
      }
