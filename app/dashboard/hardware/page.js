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
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    auto_renew: true,
  });
  const [renewing, setRenewing] = useState(false);

  const [formData, setFormData] = useState({
    store_name: '',
    contact_person: '',
    phone: '',
    location: '',
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
      setFormData({
        store_name: storeData.store_name || '',
        contact_person: storeData.contact_person || '',
        phone: storeData.phone || '',
        location: storeData.location || '',
      });

      // Get subscription settings
      const { data: settingsData } = await supabase
        .from('subscription_settings')
        .select('*')
        .eq('user_id', storeData.user_id)
        .single();

      if (settingsData) {
        setSubscriptionSettings({
          auto_renew: settingsData.auto_renew !== false,
        });
      }

      // Get materials
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*')
        .eq('hardware_store_id', storeData.id)
        .order('created_at', { ascending: false });

      setMaterials(materialsData || []);
      setLoading(false);
    }

    loadHardwareData();
  }, [router]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('hardware_stores')
        .update({
          store_name: formData.store_name,
          contact_person: formData.contact_person,
          phone: formData.phone,
          location: formData.location,
        })
        .eq('id', store.id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
        setStore({ ...store, ...formData });
        setEditMode(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    }
    setSaving(false);
  };

  const handleAutoRenewToggle = async () => {
    const newStatus = !subscriptionSettings.auto_renew;
    
    try {
      const { error } = await supabase
        .from('subscription_settings')
        .upsert({
          user_id: store.user_id,
          user_type: 'hardware',
          auto_renew: newStatus,
          payment_method: 'paynow',
        }, { onConflict: 'user_id' });

      if (error) {
        alert('Failed to update auto-renewal settings.');
        return;
      }

      setSubscriptionSettings({ ...subscriptionSettings, auto_renew: newStatus });
      alert(`Auto-renewal ${newStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (err) {
      alert('Something went wrong.');
    }
  };

  const handleRenew = async () => {
    setRenewing(true);
    try {
      const response = await fetch('/api/subscription/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: store.user_id,
          userType: 'hardware',
          email: store.email,
          phone: store.phone,
          autoRenew: subscriptionSettings.auto_renew,
        }),
      });

      const result = await response.json();

      if (result.success && result.redirectUrl) {
        window.open(result.redirectUrl, '_blank');
        alert('Subscription renewal initiated! Please complete payment on PayNow.');
      } else {
        alert(result.error || 'Renewal failed. Please try again.');
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
    }
    setRenewing(false);
  };

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

  const isActive = store.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#2C3E50] text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <h1 className="text-lg font-bold">VeriBuild</h1>
          <span className="text-xs bg-[#F47B20]/30 px-2 py-1 rounded-full">Store</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white text-3xl focus:outline-none"
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#2C3E50] text-white p-4 border-t border-[#F47B20]/30">
          <nav className="space-y-3">
            <Link href="/dashboard/hardware" className="block py-3 px-4 bg-[#F47B20] rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <Link href="/dashboard/hardware/materials" className="block py-3 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium" onClick={() => setMobileMenuOpen(false)}>
              Materials
            </Link>
            <Link href="/dashboard/hardware/subscription" className="block py-3 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium" onClick={() => setMobileMenuOpen(false)}>
              Subscription
            </Link>
            <Link href="/dashboard" className="block py-3 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium" onClick={() => setMobileMenuOpen(false)}>
              Back to Main
            </Link>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="block w-full text-left py-3 px-4 hover:bg-red-500/20 rounded-lg transition font-medium mt-4 text-red-300"
            >
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#2C3E50] text-white p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <h1 className="text-xl font-bold">VeriBuild</h1>
          <span className="text-xs bg-[#F47B20]/30 px-2 py-1 rounded-full">Store</span>
        </div>

        <nav className="space-y-2">
          <Link href="/dashboard/hardware" className="block py-2 px-4 bg-[#F47B20] rounded-lg font-medium">
            Dashboard
          </Link>
          <Link href="/dashboard/hardware/materials" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
            Materials
          </Link>
          <Link href="/dashboard/hardware/subscription" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
            Subscription
          </Link>
          <Link href="/dashboard" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
            Back to Main
          </Link>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="block w-full text-left py-2 px-4 hover:bg-red-500/20 rounded-lg transition font-medium mt-8 text-red-300"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50]">🏪 Hardware Dashboard</h1>
            <p className="text-gray-600 font-semibold text-sm md:text-base">{store.store_name}</p>
            <p className="text-xs md:text-sm text-gray-500">
              {store.location || 'No location set'} • {store.phone || 'No phone'}
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              Contact: {store.contact_person} • {store.email}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isActive ? '✅ Active' : '⚠️ Inactive'}
            </span>
            {!isActive && (
              <button
                onClick={handleRenew}
                disabled={renewing}
                className="block mt-2 bg-[#F47B20] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E06B10] transition text-center w-full disabled:opacity-50"
              >
                {renewing ? 'Processing...' : 'Subscribe $15/month →'}
              </button>
            )}
            {isActive && (
              <button
                onClick={handleRenew}
                disabled={renewing}
                className="block mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition text-center w-full disabled:opacity-50"
              >
                {renewing ? 'Processing...' : '🔄 Renew Now'}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs md:text-sm">Total Materials</p>
            <p className="text-2xl md:text-3xl font-bold text-[#2C3E50]">{materials.length}</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs md:text-sm">Total Leads</p>
            <p className="text-2xl md:text-3xl font-bold text-[#2C3E50]">0</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 col-span-2 md:col-span-1">
            <p className="text-gray-500 text-xs md:text-sm">Store Status</p>
            <p className={`text-lg md:text-xl font-bold ${
              isActive ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {isActive ? '✅ Active' : '⚠️ Inactive'}
            </p>
            {store.subscription_expiry && (
              <p className="text-xs text-gray-400 mt-1">
                Expires: {new Date(store.subscription_expiry).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* ===== AUTO-RENEW TOGGLE ===== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-[#2C3E50] text-sm md:text-base">🔄 Auto-Renewal</h3>
              <p className="text-xs md:text-sm text-gray-500">
                Automatically renew your subscription each month
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${subscriptionSettings.auto_renew ? 'text-green-600' : 'text-gray-400'}`}>
                {subscriptionSettings.auto_renew ? 'On' : 'Off'}
              </span>
              <button
                onClick={handleAutoRenewToggle}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  subscriptionSettings.auto_renew ? 'bg-[#F47B20]' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                  subscriptionSettings.auto_renew ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Store Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base md:text-lg font-bold text-[#2C3E50]">🏪 Store Profile</h2>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-[#F47B20] hover:underline text-sm font-medium"
            >
              {editMode ? 'Cancel' : '✏️ Edit'}
            </button>
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

          {editMode ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  type="text"
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="+263 78 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="e.g., Corner Street, Harare"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Store Name</p>
                <p className="font-medium text-[#2C3E50]">{store.store_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Contact Person</p>
                <p className="font-medium text-[#2C3E50]">{store.contact_person || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-[#2C3E50]">{store.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium text-[#2C3E50]">{store.location || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-[#2C3E50]">{store.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className={`font-medium ${
                  isActive ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {isActive ? '✅ Active' : '⚠️ Inactive'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Materials */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-base md:text-lg font-bold text-[#2C3E50]">📦 Your Materials</h2>
            <Link
              href="/dashboard/hardware/materials"
              className="bg-[#F47B20] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E06B10] transition w-full sm:w-auto text-center"
            >
              + Manage Materials
            </Link>
          </div>
          {materials.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs md:text-sm border-b">
                    <th className="pb-2">Material</th>
                    <th className="pb-2 hidden sm:table-cell">Category</th>
                    <th className="pb-2 hidden sm:table-cell">Unit</th>
                    <th className="pb-2">Price (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.slice(0, 5).map((material) => (
                    <tr key={material.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-[#2C3E50] text-xs md:text-sm">{material.name}</td>
                      <td className="py-3 text-gray-600 text-xs hidden sm:table-cell">{material.category || 'Uncategorized'}</td>
                      <td className="py-3 text-gray-600 text-xs hidden sm:table-cell">{material.unit}</td>
                      <td className="py-3 font-bold text-[#2C3E50] text-xs md:text-sm">${material.price_usd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {materials.length > 5 && (
                <p className="text-xs md:text-sm text-gray-500 mt-2">+ {materials.length - 5} more materials</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-500">No materials added yet</p>
              <Link
                href="/dashboard/hardware/materials"
                className="inline-block mt-2 text-[#F47B20] hover:underline"
              >
                Add your first material →
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-6">
          <Link
            href="/dashboard/hardware/materials"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-lg transition"
          >
            <div className="text-2xl md:text-3xl mb-2">📤</div>
            <h3 className="font-bold text-[#2C3E50] text-sm md:text-base">Add Materials</h3>
            <p className="text-xs text-gray-500">Upload your price list</p>
          </Link>

          <Link
            href="/dashboard/hardware/subscription"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-lg transition"
          >
            <div className="text-2xl md:text-3xl mb-2">💳</div>
            <h3 className="font-bold text-[#2C3E50] text-sm md:text-base">Subscription</h3>
            <p className="text-xs text-gray-500">Manage your plan</p>
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-lg transition cursor-pointer col-span-2 md:col-span-1 opacity-50">
            <div className="text-2xl md:text-3xl mb-2">📊</div>
            <h3 className="font-bold text-[#2C3E50] text-sm md:text-base">Analytics</h3>
            <p className="text-xs text-gray-500">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
        }
