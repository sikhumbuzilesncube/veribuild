'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    async function loadPayments() {
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
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setPayments(data || []);
        
        const completed = data?.filter(p => p.payment_status === 'completed') || [];
        const pending = data?.filter(p => p.payment_status === 'pending') || [];
        const failed = data?.filter(p => p.payment_status === 'failed') || [];
        const totalAmount = completed.reduce((sum, p) => sum + (p.amount || 0), 0);

        setStats({
          total: data?.length || 0,
          completed: completed.length,
          pending: pending.length,
          failed: failed.length,
          totalAmount: totalAmount,
        });
      }
      setLoading(false);
    }

    loadPayments();
  }, [router]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
            <Link href="/admin/hardware" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
              🏪 Hardware
            </Link>
            <Link href="/admin/construction" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
              🏗️ Construction
            </Link>
            <Link href="/admin/payments" className="block py-2 px-4 bg-[#F47B20] rounded-lg font-medium">
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
              <h1 className="text-3xl font-bold text-[#2C3E50]">💳 Payments</h1>
              <p className="text-gray-600">View all payment transactions</p>
            </div>
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-[#2C3E50] transition">
              ← Back to Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-[#2C3E50]">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Transactions</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-[#F47B20]">${stats.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2C3E50] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Reference</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm font-mono text-[#2C3E50]">
                          {payment.transaction_reference || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.user_id ? payment.user_id.substring(0, 8) + '...' : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[#2C3E50]">
                          ${(payment.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.payment_method || 'PayNow'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.payment_status)}`}>
                            {payment.payment_status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">💳</div>
                <p className="text-gray-500">No payments found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
      }
