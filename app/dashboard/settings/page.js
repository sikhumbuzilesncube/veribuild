'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

const ADMIN_EMAIL = 'gatekeeperzw@gmail.com';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const user = session.user;
      const metadata = user.user_metadata || {};
      
      setUser(user);
      setFormData({
        full_name: metadata.full_name || '',
        email: user.email || '',
        phone: metadata.phone || '',
        company: metadata.company || '',
      });
      setLoading(false);
    }

    loadUser();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
          company: formData.company,
        }
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setSaving(false);
        return;
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const isAdmin = formData.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Sidebar />

      <div className="md:ml-64 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-700 mb-2">Settings</h1>
            <p className="text-gray-500 text-sm md:text-base">Manage your profile and account settings</p>
          </div>

          {/* Admin Access Card */}
          {isAdmin && (
            <div className="bg-slate-700 rounded-2xl shadow-sm p-6 mb-6 text-white">
              <h2 className="text-lg font-bold mb-2">Administrator Access</h2>
              <p className="text-sm text-slate-300 mb-4">
                You are logged in as the system administrator. Access the master control panel to manage users, revenue, and platform settings.
              </p>
              <Link
                href="/dashboard/admin-portal"
                className="inline-block bg-brand-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-brand-600 transition text-center w-full sm:w-auto"
              >
                Open Admin Portal
              </Link>
            </div>
          )}

          {/* Profile Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              {message && (
                <div className={`px-4 py-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                  placeholder="+263 78 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                  placeholder="Your Company Name"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
            <h2 className="text-lg font-bold text-slate-700 mb-2">Account Actions</h2>
            <p className="text-sm text-gray-500 mb-4">
              Logging out will end your current session. You will need to sign in again to access your projects.
            </p>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition disabled:opacity-50 text-center"
            >
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
        }
