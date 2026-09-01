'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function WorkerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    auto_renew: true,
  });
  const [renewing, setRenewing] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    trade: '',
    sub_trade: '',
    years_experience: '',
    availability: '',
    location: '',
    about_me: '',
    past_projects: '',
    certifications: '',
  });

  const trades = [
    'Builder', 'Carpenter', 'Electrician', 'Plumber', 
    'Painter', 'General Labourer', 'Supervisor', 
    'Tiler', 'Plasterer', 'Welder', 'Scaffolder', 'Glazier', 'Other'
  ];

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: workerData, error } = await supabase
        .from('workers')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error) {
        console.error('Worker error:', error);
        setLoading(false);
        return;
      }

      setWorker(workerData);
      setFormData({
        full_name: workerData.full_name || '',
        phone: workerData.phone || '',
        trade: workerData.trade || '',
        sub_trade: workerData.sub_trade || '',
        years_experience: workerData.years_experience || '',
        availability: workerData.availability || 'available',
        location: workerData.location || '',
        about_me: workerData.about_me || '',
        past_projects: workerData.past_projects || '',
        certifications: workerData.certifications || '',
      });

      // Get subscription settings
      const { data: settingsData } = await supabase
        .from('subscription_settings')
        .select('*')
        .eq('user_id', workerData.user_id)
        .single();

      if (settingsData) {
        setSubscriptionSettings({
          auto_renew: settingsData.auto_renew !== false,
        });
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('workers')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          trade: formData.trade,
          sub_trade: formData.sub_trade,
          years_experience: parseInt(formData.years_experience) || 0,
          availability: formData.availability,
          location: formData.location,
          about_me: formData.about_me,
          past_projects: formData.past_projects,
          certifications: formData.certifications,
        })
        .eq('id', worker.id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
        setWorker({ ...worker, ...formData });
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
          user_id: worker.user_id,
          user_type: 'worker',
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
          userId: worker.user_id,
          userType: 'worker',
          email: worker.email,
          phone: worker.phone,
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">No Worker Profile Found</h2>
          <p className="text-gray-600">You haven't registered as a worker yet.</p>
          <Link
            href="/workers/register"
            className="mt-4 inline-block bg-[#F47B20] text-white px-6 py-2 rounded-lg hover:bg-[#E06B10] transition"
          >
            Register as Worker
          </Link>
        </div>
      </div>
    );
  }

  const isActive = worker.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#2C3E50] text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <h1 className="text-lg font-bold">VeriBuild</h1>
          <span className="text-xs bg-[#F47B20]/30 px-2 py-1 rounded-full">Worker</span>
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
            <Link href="/dashboard/workers" className="block py-3 px-4 bg-[#F47B20] rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <Link href="/dashboard/workers/subscription" className="block py-3 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium" onClick={() => setMobileMenuOpen(false)}>
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
          <span className="text-xs bg-[#F47B20]/30 px-2 py-1 rounded-full">Worker</span>
        </div>

        <nav className="space-y-2">
          <Link href="/dashboard/workers" className="block py-2 px-4 bg-[#F47B20] rounded-lg font-medium">
            Dashboard
          </Link>
          <Link href="/dashboard/workers/subscription" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50]">🔧 Worker Dashboard</h1>
            <p className="text-gray-600 font-semibold">{worker.full_name}</p>
            <p className="text-xs md:text-sm text-gray-500">
              {worker.trade} • {worker.location || 'No location'}
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              {worker.years_experience || 0} years experience
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
                {renewing ? 'Processing...' : 'Subscribe $5/month →'}
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
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Availability</p>
            <p className={`text-xl font-bold ${
              worker.availability === 'available' ? 'text-green-600' : 
              worker.availability === 'limited' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {worker.availability === 'available' ? '✅ Available' : 
               worker.availability === 'limited' ? '⚠️ Limited' : '❌ Unavailable'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Rating</p>
            <p className="text-3xl font-bold text-[#2C3E50]">
              ⭐ {worker.rating || 0} ({worker.reviews_count || 0} reviews)
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Status</p>
            <p className={`text-xl font-bold ${isActive ? 'text-green-600' : 'text-yellow-600'}`}>
              {isActive ? '✅ Active' : '⚠️ Inactive'}
            </p>
            {worker.subscription_expiry && (
              <p className="text-xs text-gray-400 mt-1">
                Expires: {new Date(worker.subscription_expiry).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* ===== AUTO-RENEW TOGGLE ===== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
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

        {/* Why Subscribe Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">💳 Why Subscribe?</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
              <div className="text-3xl mb-2">👷</div>
              <h3 className="font-bold text-[#2C3E50] text-sm">Get Hired</h3>
              <p className="text-xs text-gray-500 mt-1">Clients see your profile when they need workers</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-bold text-[#2C3E50] text-sm">Build Your Reputation</h3>
              <p className="text-xs text-gray-500 mt-1">Get reviews and ratings from clients</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-bold text-[#2C3E50] text-sm">More Job Opportunities</h3>
              <p className="text-xs text-gray-500 mt-1">Access to more projects and earn more</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-[#F47B20]/5 border border-[#F47B20]/20 rounded-lg text-center">
            <p className="text-sm text-gray-700">
              <strong>Only $5/month</strong> — Cancel anytime. Start getting hired today!
            </p>
          </div>
        </div>

        {/* Worker Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#2C3E50]">👤 Worker Profile</h2>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-[#F47B20] hover:underline text-sm font-medium"
            >
              {editMode ? 'Cancel' : 'Edit'}
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
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                <select
                  name="trade"
                  value={formData.trade}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  required
                >
                  {trades.map((trade) => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Trade</label>
                <input
                  type="text"
                  name="sub_trade"
                  value={formData.sub_trade}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
                <input
                  type="number"
                  name="years_experience"
                  value={formData.years_experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                >
                  <option value="available">Available</option>
                  <option value="limited">Limited Availability</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                />
              </div>

              {/* New Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                <textarea
                  name="about_me"
                  value={formData.about_me}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="Tell clients about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Past Projects</label>
                <textarea
                  name="past_projects"
                  value={formData.past_projects}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="List your previous projects..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                <textarea
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="List any certifications..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Full Name</p>
                <p className="font-medium text-[#2C3E50]">{worker.full_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-[#2C3E50]">{worker.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500">Trade</p>
                <p className="font-medium text-[#2C3E50]">{worker.trade}</p>
              </div>
              <div>
                <p className="text-gray-500">Sub-Trade</p>
                <p className="font-medium text-[#2C3E50]">{worker.sub_trade || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500">Experience</p>
                <p className="font-medium text-[#2C3E50]">{worker.years_experience || 0} years</p>
              </div>
              <div>
                <p className="text-gray-500">Availability</p>
                <p className={`font-medium ${
                  worker.availability === 'available' ? 'text-green-600' : 
                  worker.availability === 'limited' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {worker.availability === 'available' ? '✅ Available' : 
                   worker.availability === 'limited' ? '⚠️ Limited' : '❌ Unavailable'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium text-[#2C3E50]">{worker.location || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500">Rating</p>
                <p className="font-medium text-[#2C3E50]">⭐ {worker.rating || 0} ({worker.reviews_count || 0} reviews)</p>
              </div>

              {/* New Fields Display */}
              <div className="md:col-span-2">
                <p className="text-gray-500">About Me</p>
                <p className="font-medium text-[#2C3E50]">{worker.about_me || 'Not set'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Past Projects</p>
                <p className="font-medium text-[#2C3E50]">{worker.past_projects || 'Not set'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Certifications</p>
                <p className="font-medium text-[#2C3E50]">{worker.certifications || 'Not set'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/workers/subscription"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-lg transition"
          >
            <div className="text-3xl mb-2">💳</div>
            <h3 className="font-bold text-[#2C3E50]">Subscription</h3>
            <p className="text-sm text-gray-500">$5/month</p>
          </Link>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center opacity-50">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-[#2C3E50]">Job Matches</h3>
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center opacity-50">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="font-bold text-[#2C3E50]">Reviews</h3>
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-[#2C3E50] transition">
            ← Back to Main Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
    }
