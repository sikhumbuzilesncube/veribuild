'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Login attempt for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error('❌ Auth error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(error.message || 'Login failed. Please check your credentials.');
        }
        setLoading(false);
        return;
      }

      console.log('✅ Auth successful:', data.user);

      // Check user type
      const userType = data.user.user_metadata?.user_type || 'client';
      console.log('👤 User type:', userType);

      // Redirect based on user type
      if (userType === 'hardware') {
        // Check if store is verified
        const { data: storeData } = await supabase
          .from('hardware_stores')
          .select('is_verified')
          .eq('email', email)
          .single();

        if (storeData?.is_verified) {
          router.push('/dashboard/hardware');
          return;
        }
      }

      if (userType === 'construction') {
        // Check if company is verified
        const { data: companyData } = await supabase
          .from('construction_companies')
          .select('is_verified')
          .eq('email', email)
          .single();

        if (companyData?.is_verified) {
          router.push('/dashboard/construction');
          return;
        }
      }

      // Regular user or pending verification
      router.push('/dashboard');
      
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <h1 className="text-2xl font-bold text-[#2C3E50]">VeriBuild</h1>
          </div>
          <p className="text-gray-500 text-sm">Welcome back! Log in to your account</p>
        </div>

        {/* User Type Options */}
        <div className="flex justify-center gap-2 mb-6 text-xs">
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">👤 Client</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">🏪 Hardware</span>
          <span className="px-3 py-1 bg-[#F47B20] text-white rounded-full">🏗️ Construction</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">🔧 Worker</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-[#F47B20] hover:underline font-medium"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#F47B20] font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
    }
