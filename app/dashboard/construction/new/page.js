'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CITIES } from '@/lib/cities';

export default function NewConstructionListing() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingListing, setExistingListing] = useState(null);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    website: '',
    city_id: '1',
    location: '',
    ad_text: '',
  });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('construction_companies')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (data) {
        setExistingListing(data);
        setFormData({
          company_name: data.company_name || '',
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          city_id: String(data.city_id || 1),
          location: data.location || '',
          ad_text: data.ad_text || '',
        });
      } else {
        const metadata = session.user.user_metadata || {};
        setFormData((prev) => ({
          ...prev,
          company_name: metadata.company || '',
          contact_person: metadata.full_name || '',
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

    if (!formData.company_name || formData.company_name.trim() === '') {
      setError('Company name is required');
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

      const payload = {
        user_id: session.user.id,
        company_name: formData.company_name.trim(),
        contact_person: formData.contact_person.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        website: formData.website.trim() || null,
        city_id: parseInt(formData.city_id, 10) || 1,
        location: formData.location.trim() || null,
        ad_text: formData.ad_text.trim() || null,
        subscription_tier: 'standard',
        subscription_coverage: 'local',
        subscription_status: 'active',
        featured_city_ids: [],
      };

      let result;
      if (existingListing) {
        result = await supabase
          .from('construction_companies')
          .update(payload)
          .eq('id', existingListing.id);
      } else {
        result = await supabase.from('construction_companies').insert([payload]);
      }

      if (result.error) {
        console.error('Save error:', result.error);
        setError(`Failed to save: ${result.error.message}`);
        setSaving(false);
        return;
      }

      router.push('/dashboard/construction');
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
            onClick={() => router.push('/dashboard/construction')}
            className="text-sm text-gray-600 hover:text-gray-800 mb-3"
          >
            ← Back to Construction
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            {existingListing ? 'Edit Your Company' : 'List Your Company'}
          </h1>
          <p className="text-gray-600 text-sm">
            Add your construction company details to appear in the marketplace and on BOQ documents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <Section title="Company Details">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g., Moyo Construction"
                required
              />
              <Input
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Director's name"
              />
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+263 78 123 4567"
              />
              <Input
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="info@company.co.zw"
              />
              <div className="md:col-span-2">
                <Input
                  label="Website (optional)"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="www.company.co.zw"
                />
              </div>
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
                label="Physical Location (optional)"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., 45 Robert Mugabe Way, Harare"
              />
            </div>
          </Section>

          <Section title="Description">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About Your Company
              </label>
              <textarea
                name="ad_text"
                value={formData.ad_text}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition text-sm"
                placeholder="Describe your company, the types of projects you handle, and what makes you a good choice."
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
              onClick={() => router.push('/dashboard/construction')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : existingListing ? 'Update Company' : 'Create Listing'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your listing is created with the Standard tier by default. You can upgrade later from the Subscription page.
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
