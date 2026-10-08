'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CITIES } from '@/lib/cities';

const TRADES = [
  'Mason',
  'Carpenter',
  'Plumber',
  'Electrician',
  'Tiler',
  'Painter',
  'Roofer',
  'Welder',
  'Steel fixer',
  'General labourer',
  'Site supervisor',
  'Other',
];

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available now' },
  { value: 'limited', label: 'Limited availability' },
  { value: 'unavailable', label: 'Not available' },
];

export default function NewWorkerListing() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingListing, setExistingListing] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    trade: 'Mason',
    sub_trade: '',
    years_experience: '',
    daily_rate_usd: '',
    availability: 'available',
    city_id: '1',
    location: '',
    about_me: '',
  });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (data) {
        setExistingListing(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          email: data.email || '',
          trade: data.trade || 'Mason',
          sub_trade: data.sub_trade || '',
          years_experience: data.years_experience != null ? String(data.years_experience) : '',
          daily_rate_usd: data.daily_rate_usd != null ? String(data.daily_rate_usd) : '',
          availability: data.availability || 'available',
          city_id: String(data.city_id || 1),
          location: data.location || '',
          about_me: data.about_me || '',
        });
      } else {
        const metadata = session.user.user_metadata || {};
        setFormData((prev) => ({
          ...prev,
          full_name: metadata.full_name || '',
          email: session.user.email || '',
          phone: metadata.phone || '',
        }));
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!formData.full_name || formData.full_name.trim() === '') {
      setError('Full name is required');
      setSaving(false);
      return;
    }

    if (!formData.phone && !formData.email) {
      setError('Please provide at least a phone number or an email address');
      setSaving(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // On create: no plan selected yet. Subscription is set later from
      // the subscription page. On edit: preserve existing subscription state.
      const payload = {
        user_id: session.user.id,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        trade: formData.trade || 'Other',
        sub_trade: formData.sub_trade.trim() || null,
        years_experience: formData.years_experience
          ? parseInt(formData.years_experience, 10)
          : null,
        daily_rate_usd: formData.daily_rate_usd
          ? parseFloat(formData.daily_rate_usd)
          : null,
        availability: formData.availability || 'available',
        city_id: parseInt(formData.city_id, 10) || 1,
        location: formData.location.trim() || null,
        about_me: formData.about_me.trim() || null,
      };

      let result;
      if (existingListing) {
        // Preserve existing subscription state on edit
        result = await supabase
          .from('workers')
          .update(payload)
          .eq('id', existingListing.id);
      } else {
        // New listing starts unsubscribed
        const insertPayload = {
          ...payload,
          subscription_tier: null,
          subscription_coverage: null,
          subscription_status: 'none',
          featured_city_ids: [],
        };
        result = await supabase.from('workers').insert([insertPayload]);
      }

      if (result.error) {
        console.error('Save error:', result.error);
        setError(`Failed to save: ${result.error.message}`);
        setSaving(false);
        return;
      }

      router.push('/dashboard/workers');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/workers')}
            className="text-sm text-gray-600 hover:text-gray-800 mb-3"
          >
            ← Back to Workers
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            {existingListing ? 'Edit Your Profile' : 'Create Your Worker Profile'}
          </h1>
          <p className="text-gray-600 text-sm">
            Add your details to appear in the marketplace and on BOQ documents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <Section title="Personal Details">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g., John Moyo"
                required
              />
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+263 78 123 4567"
              />
              <div className="md:col-span-2">
                <Input
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </Section>

          <Section title="Trade Details">
            <div className="grid md:grid-cols-2 gap-4">
              <Select
                label="Trade"
                name="trade"
                value={formData.trade}
                onChange={handleChange}
                options={TRADES.map((t) => ({ value: t, label: t }))}
              />
              <Input
                label="Sub-trade or Speciality (optional)"
                name="sub_trade"
                value={formData.sub_trade}
                onChange={handleChange}
                placeholder="e.g., Roof tiling, Industrial wiring"
              />
              <Input
                label="Years of Experience"
                name="years_experience"
                value={formData.years_experience}
                onChange={handleChange}
                type="number"
                placeholder="8"
              />
              <Input
                label="Daily Rate (USD)"
                name="daily_rate_usd"
                value={formData.daily_rate_usd}
                onChange={handleChange}
                type="number"
                step="0.01"
                placeholder="18.00"
              />
              <Select
                label="Availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                options={AVAILABILITY_OPTIONS}
              />
            </div>
          </Section>

          <Section title="Location">
            <div className="grid md:grid-cols-2 gap-4">
              <Select
                label="City"
                name="city_id"
                value={formData.city_id}
                onChange={handleChange}
                options={CITIES.map((c) => ({ value: String(c.id), label: c.name }))}
              />
              <Input
                label="Area or Suburb (optional)"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Mbare, Harare"
              />
            </div>
          </Section>

          <Section title="About You">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description (optional)
              </label>
              <textarea
                name="about_me"
                value={formData.about_me}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition text-sm"
                placeholder="Describe your work, the kinds of jobs you take, and what clients can expect."
              />
            </div>
          </Section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/workers')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : existingListing ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            After creating your profile, choose a subscription plan to appear on BOQ documents.
          </p>

        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-base font-bold text-[#2C3E50] mb-4 pb-2 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Input({ label, name, value, onChange, placeholder, required, type = 'text', step }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition text-sm ${
          required && !value ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
    }
