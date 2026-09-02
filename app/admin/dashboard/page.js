'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkers: 0,
    pendingWorkers: 0,
    totalRevenue: 0,
    totalHardware: 0,
    totalConstruction: 0,
  });
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Check if admin
      if (session.user.email !== 'admin@gatekeeperai.co.zw') {
        router.push('/dashboard');
        return;
      }

      // Get total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get workers
      const { data: workersData } = await supabase
        .from('workers')
        .select('*');

      const pendingWorkersData = workersData?.filter(w => w.verification_status === 'pending') || [];
      
      // Get revenue from payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_status', 'completed');

      const totalRevenue = paymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalWorkers: workersData?.length || 0,
        pendingWorkers: pendingWorkersData.length,
        totalRevenue: totalRevenue,
        totalHardware: 0,
        totalConstruction: 0,
      });

      setPendingWorkers(pendingWorkersData);
      setRecentPayments(paymentsData?.slice(0, 10) || []);
      setLoading(false);
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
            <h1 className="text-xl font-bold">Admin</h1>
          </div>

          <nav className="space-y-2">
            <Link href="/admin/dashboard" className="block py-2 px-4 bg-[#F47B20] rounded-lg font-medium">
              📊 Dashboard
            </Link>
            <Link href="/admin/workers" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
              👷 Workers
            </Link>
            <Link href="/admin/hardware" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
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
                router.push('/login');
              }}
              className="block w-full text-left py-2 px-4 hover:bg-red-500/20 rounded-lg transition font-medium mt-8 text-red-300"
            >
              🚪 Logout
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-6 w-full">
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-6">👑 Admin Dashboard</h1>

          {/* Stats */}
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-[#2C3E50]">{stats.totalUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Total Workers</p>
              <p className="text-3xl font-bold text-[#2C3E50]">{stats.totalWorkers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Pending Verification</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingWorkers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Total Hardware</p>
              <p className="text-3xl font-bold text-[#2C3E50]">{stats.totalHardware}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Pending Workers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#2C3E50]">🟡 Pending Verification</h2>
              <Link href="/admin/workers" className="text-[#F47B20] hover:underline text-sm">
                View All →
              </Link>
            </div>
            {pendingWorkers.length > 0 ? (
              <div className="space-y-3">
                {pendingWorkers.map((worker) => (
                  <div key={worker.id} className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <p className="font-medium text-[#2C3E50]">{worker.full_name}</p>
                      <p className="text-sm text-gray-500">{worker.trade} • {worker.location || 'No location'}</p>
                    </div>
                    <Link
                      href={`/admin/workers/${worker.id}`}
                      className="bg-[#F47B20] text-white px-4 py-1 rounded-lg text-sm font-semibold hover:bg-[#E06B10] transition"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">🎉 No pending verifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
      }
