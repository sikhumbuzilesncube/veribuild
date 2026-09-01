'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2C3E50] leading-tight">VeriBuild</h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">A product of GatekeeperAI</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[#2C3E50] hover:text-[#F47B20] transition font-medium text-sm">Log In</Link>
            <Link href="/register" className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition shadow-lg shadow-orange-200 text-sm">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-12 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-[#2C3E50] mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-gray-600 leading-relaxed">
          <p><strong>Last Updated:</strong> September 2026</p>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">1. Information We Collect</h2>
            <p>VeriBuild collects the following information:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li>Name and contact information (email, phone)</li>
              <li>Account credentials (password is encrypted)</li>
              <li>Floor plans and project data you upload</li>
              <li>Payment information (processed through PayNow)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li>Generate BOQs from your floor plans</li>
              <li>Process payments and subscriptions</li>
              <li>Connect you with hardware stores, construction companies, and workers</li>
              <li>Improve our AI and platform services</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data. All data is encrypted and stored securely.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">4. Third-Party Services</h2>
            <p>We use third-party services including:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li><strong>Supabase</strong> - Database and authentication</li>
              <li><strong>Vercel</strong> - Hosting and deployment</li>
              <li><strong>PayNow</strong> - Payment processing</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">5. Your Rights</h2>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">6. Contact Us</h2>
            <p>Email: admin@gatekeeperai.co.zw or gatekeeperzw@gmail.com<br />Phone: +263 77 780 3517</p>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-500">
            <p>By using VeriBuild, you consent to this Privacy Policy.</p>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-[#F47B20] hover:underline">← Back to Home</Link>
        </div>
      </section>

      <footer className="bg-[#2C3E50] text-white py-8 px-6 text-center text-sm text-gray-400">
        <p>© 2026 VeriBuild. A product of GatekeeperAI. All rights reserved.</p>
      </footer>
    </div>
  );
    }
