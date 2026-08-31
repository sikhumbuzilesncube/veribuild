'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ConstructionRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    location: '',
    city: 'Harare',
    adText: '',
    website: '',
    password: '',
    confirmPassword: '',
  });

  const cities = ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Kwekwe', 'Masvingo', 'Chinhoyi', 'Marondera'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.companyName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('🏗️ Registering construction company...');

      // STEP 1: Create Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.contactPerson || formData.companyName,
            user_type: 'construction',
            company_name: formData.companyName,
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please log in.');
        } else {
          setError(`Registration failed: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      console.log('✅ Auth user created:', authData.user.id);

      // STEP 2: Create construction company record
      const cityId = cities.indexOf(formData.city) + 1;
      
      const { data: companyData, error: companyError } = await supabase
        .from('construction_companies')
        .insert({
          company_name: formData.companyName,
          contact_person: formData.contactPerson || formData.companyName,
          email: formData.email,
          phone: formData.phone || '',
          location: formData.location || '',
          city_id: cityId,
          user_id: authData.user.id,
          ad_text: formData.adText || '',
          website: formData.website || '',
          is_verified: true,
          subscription_status: 'inactive',
        })
        .select();

      if (companyError) {
        console.error('❌ Company error:', companyError);
        setError(`Database error: ${companyError.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ Company created:', companyData);

      setSuccess('✅ Construction company registered successfully! Subscribe to start getting leads.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <h1 className="text-2xl font-bold text-[#2C3E50]">VeriBuild</h1>
          </div>
          <p className="text-gray-500 text-sm">🏗️ Register Your Construction Company</p>
          <p className="text-sm text-gray-400">Advertise on BOQs for only <strong>$15/month</strong></p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="e.g., BuildCo Zimbabwe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="info@company.co.zw"
              required
            />
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="+263 78 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="e.g., Corner Street, Harare"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              required
            >
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Text <span className="text-red-500">*</span>
            </label>
            <textarea
              name="adText"
              value={formData.adText}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="Describe your company and services. This will appear on BOQs."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website (Optional)
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="www.yourcompany.co.zw"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="Min 8 characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="Confirm your password"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <strong>💡 Ad Plan:</strong> $15/month
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your ad appears on every BOQ</li>
              <li>Get customer leads directly</li>
              <li>Build brand awareness</li>
              <li>Priority support</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register Construction Company →'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Already registered?{' '}
            <a href="/login" className="text-[#F47B20] font-semibold hover:underline">
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
                  }
