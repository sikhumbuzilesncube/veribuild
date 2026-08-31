'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ConstructionDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    location: '',
    ad_text: '',
    website: '',
  });

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: companyData, error } = await supabase
        .from('construction_companies')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error) {
        console.error('Company error:', error);
        setLoading(false);
        return;
      }

      setCompany(companyData);
      setFormData({
        company_name: companyData.company_name || '',
        contact_person: companyData.contact_person || '',
        phone: companyData.phone || '',
        location: companyData.location || '',
        ad_text: companyData.ad_text || '',
        website: companyData.website || '',
      });
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
        .from('construction_companies')
        .update({
          company_name: formData.company_name,
          contact_person: formData.contact_person,
          phone: formData.phone,
          location: formData.location,
          ad_text: formData.ad_text,
          website: formData.website,
        })
        .eq('id', company.id);

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
        setCompany({ ...company, ...formData });
        setEditMode(false);
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

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">No Company Found</h2>
          <p className="text-gray-600">You haven't registered a construction company yet.</p>
          <Link
            href="/construction/register"
            className="mt-4 inline-block bg-[#F47B20] text-white px-6 py-2 rounded-lg hover:bg-[#E06B10] transition"
          >
            Register Your Company
          </Link>
        </div>
      </div>
    );
  }

  const isActive = company.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#2C3E50] text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <h1 className="text-lg font-bold">VeriBuild</h1>
          <span className="text-xs bg-[#F47B20]/30 px-2 py-1 rounded-full">Construction</span>
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
            <Link href="/dashboard/construction" className="block py-3 px-4 bg-[#F47B20] rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <Link href="/dashboard/construction/subscription" className="block py-3 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium" onClick={() => setMobileMenuOpen(false)}>
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
          <span className="text-xs bg-[#F47B20]/30 px-2 py-1 rounded-full">Construction</span>
        </div>

        <nav className="space-y-2">
          <Link href="/dashboard/construction" className="block py-2 px-4 bg-[#F47B20] rounded-lg font-medium">
            Dashboard
          </Link>
          <Link href="/dashboard/construction/subscription" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
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
            <h1 className="text-2xl md:text-3xl font-bold text-[#2C3E50]">🏗️ Construction Dashboard</h1>
            <p className="text-gray-600 font-semibold">{company.company_name}</p>
            <p className="text-xs md:text-sm text-gray-500">
              {company.location || 'No location set'} • {company.phone || 'No phone'}
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              Contact: {company.contact_person} • {company.email}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isActive ? '✅ Active' : '⚠️ Inactive'}
            </span>
            {!isActive && (
              <Link
                href="/dashboard/construction/subscription"
                className="block mt-2 bg-[#F47B20] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#E06B10] transition text-center"
              >
                Subscribe $15/month →
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Ad Impressions</p>
            <p className="text-3xl font-bold text-[#2C3E50]">0</p>
            <p className="text-xs text-gray-400">This month</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Total Leads</p>
            <p className="text-3xl font-bold text-[#2C3E50]">0</p>
            <p className="text-xs text-gray-400">All time</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Subscription Status</p>
            <p className={`text-xl font-bold ${isActive ? 'text-green-600' : 'text-yellow-600'}`}>
              {isActive ? '✅ Active' : '⚠️ Inactive'}
            </p>
            {company.subscription_expiry && (
              <p className="text-xs text-gray-400 mt-1">
                Expires: {new Date(company.subscription_expiry).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Company Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#2C3E50]">🏢 Company Profile</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="www.yourcompany.co.zw"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Text</label>
                <textarea
                  name="ad_text"
                  value={formData.ad_text}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="Describe your company and services"
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
                <p className="text-gray-500">Company Name</p>
                <p className="font-medium text-[#2C3E50]">{company.company_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Contact Person</p>
                <p className="font-medium text-[#2C3E50]">{company.contact_person || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-[#2C3E50]">{company.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium text-[#2C3E50]">{company.location || 'Not set'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Website</p>
                <p className="font-medium text-[#2C3E50]">
                  {company.website ? (
                    <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-[#F47B20] hover:underline">
                      {company.website}
                    </a>
                  ) : 'Not set'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Ad Text</p>
                <p className="font-medium text-[#2C3E50]">{company.ad_text || 'No ad text set'}</p>
              </div>
            </div>
          )}
        </div>

        {/* How Your Ad Appears */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">📢 How Your Ad Appears</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#F47B20] rounded-full flex items-center justify-center text-white font-bold text-xl">
                {company.company_name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-[#2C3E50]">{company.company_name}</h3>
                <p className="text-sm text-gray-600">{company.ad_text || 'Your ad text will appear here.'}</p>
                <p className="text-sm text-gray-500 mt-1">📞 {company.phone || 'No phone'} • 📧 {company.email}</p>
                {company.website && (
                  <p className="text-sm text-[#F47B20]">🔗 {company.website}</p>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">This is how your ad will appear on every BOQ generated by users.</p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/construction/subscription"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center hover:shadow-lg transition"
          >
            <div className="text-3xl mb-2">💳</div>
            <h3 className="font-bold text-[#2C3E50]">Subscription</h3>
            <p className="text-sm text-gray-500">$15/month</p>
          </Link>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center opacity-50">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-[#2C3E50]">Analytics</h3>
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center opacity-50">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-bold text-[#2C3E50]">Leads</h3>
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
