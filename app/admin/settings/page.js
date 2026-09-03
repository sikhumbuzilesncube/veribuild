'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    verification_fee: 5.00,
    subscription_fee: 5.00,
  });

  useEffect(() => {
    async function loadSettings() {
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
        .from('admin_settings')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .single();

      if (data) {
        setSettings({
          verification_fee: data.verification_fee || 5.00,
          subscription_fee: data.subscription_fee || 5.00,
        });
      }
      setLoading(false);
    }

    loadSettings();
  }, [router]);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          id: 1,
          verification_fee: settings.verification_fee,
          subscription_fee: settings.subscription_fee,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: '✅ Settings saved successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    }
    setSaving(false);
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
            <Link href="/admin/payments" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
              💳 Payments
            </Link>
            <Link href="/admin/settings" className="block py-2 px-4 bg-[#F47B20] rounded-lg font-medium">
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
              <h1 className="text-3xl font-bold text-[#2C3E50]">⚙️ Admin Settings</h1>
              <p className="text-gray-600">Configure platform settings</p>
            </div>
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-[#2C3E50] transition">
              ← Back to Dashboard
            </Link>
          </div>

          {message && (
            <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={handleSave} className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Fee ($)
                </label>
                <input
                  type="number"
                  name="verification_fee"
                  value={settings.verification_fee}
                  onChange={handleChange}
                  step="0.50"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  One-time fee charged to workers for verification
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Subscription Fee ($)
                </label>
                <input
                  type="number"
                  name="subscription_fee"
                  value={settings.subscription_fee}
                  onChange={handleChange}
                  step="0.50"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Monthly fee for workers, hardware stores, and construction companies
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Current Pricing</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Worker Verification Fee</p>
                <p className="font-bold text-2xl text-blue-600">${settings.verification_fee.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-700">Monthly Subscription</p>
                <p className="font-bold text-2xl text-blue-600">${settings.subscription_fee.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
            }
