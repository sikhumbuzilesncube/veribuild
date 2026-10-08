'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CITIES } from '@/lib/cities';

export default function NewHardwareStore() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingStore, setExistingStore] = useState(null);

  const [formData, setFormData] = useState({
    store_name: '',
    contact_person: '',
    phone: '',
    email: '',
    city_id: '1',
    location: '',
  });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('hardware_stores')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (data) {
        setExistingStore(data);
        setFormData({
          store_name: data.store_name || '',
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          email: data.email || '',
          city_id: String(data.city_id || 1),
          location: data.location || '',
        });
      } else {
        const metadata = session.user.user_metadata || {};
        setFormData((prev) => ({
          ...prev,
          store_name: metadata.company || '',
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

    if (!formData.store_name || formData.store_name.trim() === '') {
      setError('Store name is required');
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

      const selectedCityId = parseInt(formData.city_id, 10) || 1;

      // Preserve existing featured cities if editing, plus ensure the
      // store's own city is included. New stores start with just their city.
      let featuredCityIds;
      if (existingStore && Array.isArray(existingStore.featured_city_ids)) {
        const set = new Set(existingStore.featured_city_ids);
        set.add(selectedCityId);
        featuredCityIds = Array.from(set);
      } else {
        featuredCityIds = [selectedCityId];
      }

      const payload = {
        user_id: session.user.id,
        store_name: formData.store_name.trim(),
        contact_person: formData.contact_person.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        city_id: selectedCityId,
        location: formData.location.trim() || null,
        subscription_tier: 'standard',
        subscription_coverage: 'local',
        subscription_status: 'active',
        featured_city_ids: featuredCityIds,
      };

      let result;
      if (existingStore) {
        result = await supabase
          .from('hardware_stores')
          .update(payload)
          .eq('id', existingStore.id);
      } else {
        result = await supabase.from('hardware_stores').insert([payload]);
      }

      if (result.error) {
        console.error('Save error:', result.error);
        setError(`Failed to save: ${result.error.message}`);
        setSaving(false);
        return;
      }

      router.push('/dashboard/hardware');
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
            onClick={() => router.push('/dashboard/hardware')}
            className="text-sm text-gray-600 hover:text-gray-800 mb-3"
          >
            ← Back to My Store
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            {existingStore ? 'Edit Your Store' : 'Create Your Store Listing'}
          </h1>
          <p className="text-gray-600 text-sm">
            Add your store details to appear in the marketplace and on BOQ pages.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <Section title="Store Details">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Store Name"
                name="store_name"
                value={formData.store_name}
                onChange={handleChange}
                placeholder="e.g., Basil Hardware"
                required
              />
              <Input
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Owner or manager name"
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
                placeholder="info@store.co.zw"
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
                label="Physical Location (optional)"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., 45 Robert Mugabe Way, Harare"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Your store will appear on BOQ pages generated in the city you select above.
            </p>
          </Section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/hardware')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : existingStore ? 'Update Store' : 'Create Store'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your store is created with the Standard tier by default. You can upgrade later from the Subscription page.
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

function Input({ label, name, value, onChange, placeholder, required, type = 'text' }) {
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
