'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CITIES } from '@/lib/cities';

const SERVICE_OPTIONS = [
  'Architectural drawings',
  'Structural drawings',
  'Council submission drawings',
  'Interior design',
  '3D rendering',
  'Site supervision',
  'Plan approval assistance',
];

export default function NewArchitectListing() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingListing, setExistingListing] = useState(null);

  const [formData, setFormData] = useState({
    firm_name: '',
    contact_person: '',
    phone: '',
    email: '',
    city_id: '1',
    location: '',
    services: [],
    price_per_m2_min: '',
    price_per_m2_max: '',
    years_experience: '',
    description: '',
    portfolio_link: '',
  });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('architects')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (data) {
        setExistingListing(data);
      } else {
        const metadata = session.user.user_metadata || {};
        setFormData((prev) => ({
          ...prev,
          contact_person: metadata.full_name || '',
          email: session.user.email || '',
          phone: metadata.phone || '',
          city_id: '1',
        }));
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceToggle = (service) => {
    const current = formData.services || [];
    const next = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    setFormData({ ...formData, services: next });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!formData.firm_name || formData.firm_name.trim() === '') {
      setError('Firm name is required');
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
        firm_name: formData.firm_name.trim(),
        contact_person: formData.contact_person.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        city_id: parseInt(formData.city_id, 10) || 1,
        location: formData.location.trim() || null,
        services: formData.services || [],
        price_per_m2_min: formData.price_per_m2_min ? parseFloat(formData.price_per_m2_min) : null,
        price_per_m2_max: formData.price_per_m2_max ? parseFloat(formData.price_per_m2_max) : null,
        years_experience: formData.years_experience ? parseInt(formData.years_experience, 10) : null,
        description: formData.description.trim() || null,
        subscription_tier: 'standard',
        subscription_coverage: 'local',
        subscription_status: 'active',
        featured_city_ids: [],
        is_verified: false,
      };

      let result;
      if (existingListing) {
        result = await supabase
          .from('architects')
          .update(payload)
          .eq('id', existingListing.id);
      } else {
        result = await supabase.from('architects').insert([payload]);
      }

      if (result.error) {
        console.error('Save error:', result.error);
        setError(`Failed to save: ${result.error.message}`);
        setSaving(false);
        return;
      }

      router.push('/dashboard/architects');
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
            onClick={() => router.push('/dashboard/architects')}
            className="text-sm text-gray-600 hover:text-gray-800 mb-3"
          >
            ← Back to Architects
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            {existingListing ? 'Edit Your Listing' : 'Create Your Listing'}
          </h1>
          <p className="text-gray-600 text-sm">
            Add your firm's details to appear in the marketplace and on template BOQ documents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <Section title="Firm Details">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Firm or Practice Name"
                name="firm_name"
                value={formData.firm_name}
                onChange={handleChange}
                placeholder="e.g., Nyoni Architects"
                required
              />
              <Input
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                placeholder="Architect's name"
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
                placeholder="info@firm.co.zw"
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
                placeholder="e.g., 123 Samora Machel Ave, Harare"
              />
            </div>
          </Section>

          <Section title="Services">
            <p className="text-sm text-gray-600 mb-3">
              Select all that apply.
            </p>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map((service) => {
                const isActive = (formData.services || []).includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleServiceToggle(service)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                      isActive
                        ? 'bg-[#2C3E50] text-white border-[#2C3E50]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {service}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Experience and Pricing">
            <div className="grid md:grid-cols-3 gap-4">
              <Input
                label="Years of Experience"
                name="years_experience"
                value={formData.years_experience}
                onChange={handleChange}
                type="number"
                placeholder="10"
              />
              <Input
                label="Price per m² (min, USD)"
                name="price_per_m2_min"
                value={formData.price_per_m2_min}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="4.00"
              />
              <Input
                label="Price per m² (max, USD)"
                name="price_per_m2_max"
                value={formData.price_per_m2_max}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder="6.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Price range helps clients understand what you typically charge. Leave blank if you prefer to quote per project.
            </p>
          </Section>

          <Section title="Description">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition text-sm"
                placeholder="Describe your firm, the types of projects you handle, and what makes you a good choice."
              />
            </div>
            <div className="mt-4">
              <Input
                label="Portfolio Link (optional)"
                name="portfolio_link"
                value={formData.portfolio_link}
                onChange={handleChange}
                placeholder="https://yourportfolio.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: the portfolio link is stored but not yet displayed on listings. It will be shown once the profile page is built.
              </p>
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
              onClick={() => router.push('/dashboard/architects')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : existingListing ? 'Update Listing' : 'Create Listing'}
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
