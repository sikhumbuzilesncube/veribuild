'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function VerifyWorkerPage() {
  const router = useRouter();
  const params = useParams();
  const workerId = params.id;

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadWorker() {
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
        .eq('id', workerId)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setWorker(data);
      setLoading(false);
    }

    loadWorker();
  }, [workerId, router]);

  const handleVerify = async (status) => {
    setActionLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('workers')
        .update({
          verification_status: status,
          is_verified: status === 'approved',
          verified_by: (await supabase.auth.getSession()).data.session?.user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', workerId);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `Worker ${status}!` });
        setTimeout(() => {
          router.push('/admin/workers');
        }, 1500);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    }
    setActionLoading(false);
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

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">👷</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">Worker not found</h2>
          <Link href="/admin/workers" className="text-[#F47B20] hover:underline">
            ← Back to Workers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/workers" className="text-gray-600 hover:text-[#2C3E50] transition">
          ← Back to Workers
        </Link>

        <h1 className="text-3xl font-bold text-[#2C3E50] mt-4 mb-6">👷 Verify Worker</h1>

        {message && (
          <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Full Name</p>
              <p className="font-medium text-[#2C3E50]">{worker.full_name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Email</p>
              <p className="font-medium text-[#2C3E50]">{worker.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Phone</p>
              <p className="font-medium text-[#2C3E50]">{worker.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Trade</p>
              <p className="font-medium text-[#2C3E50]">{worker.trade}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Sub-Trade</p>
              <p className="font-medium text-[#2C3E50]">{worker.sub_trade || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Trade Class (Optional)</p>
              <p className="font-medium text-[#2C3E50]">{worker.trade_class || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Experience</p>
              <p className="font-medium text-[#2C3E50]">{worker.years_experience || 0} years</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Location</p>
              <p className="font-medium text-[#2C3E50]">{worker.location || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Availability</p>
              <p className={`font-medium ${
                worker.availability === 'available' ? 'text-green-600' :
                worker.availability === 'limited' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {worker.availability || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p className={`font-medium ${
                worker.verification_status === 'approved' ? 'text-green-600' :
                worker.verification_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {worker.verification_status || 'Pending'}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-gray-500 text-sm">About Me</p>
            <p className="font-medium text-[#2C3E50]">{worker.about_me || 'Not set'}</p>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-gray-500 text-sm">Past Projects</p>
            <p className="font-medium text-[#2C3E50]">{worker.past_projects || 'Not set'}</p>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-gray-500 text-sm">Certifications</p>
            <p className="font-medium text-[#2C3E50]">{worker.certifications || 'Not set'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleVerify('approved')}
            disabled={actionLoading}
            className="bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
          >
            ✅ Approve
          </button>
          <button
            onClick={() => handleVerify('rejected')}
            disabled={actionLoading}
            className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50"
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </div>
  );
        }
