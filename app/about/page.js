'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AboutPage() {
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
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2C3E50] leading-tight">VeriBuild</h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">A product of GatekeeperAI</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">Home</Link>
            <Link href="/about" className="text-[#F47B20] font-medium text-sm">About</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">Pricing</Link>
            <Link href="/contact" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[#2C3E50] hover:text-[#F47B20] transition font-medium text-sm">
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition shadow-lg shadow-orange-200 text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-br from-white via-orange-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2C3E50] mb-6">
            About <span className="text-[#F47B20]">VeriBuild</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Building Zimbabwe's future, one BOQ at a time.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              VeriBuild was created to simplify the construction process in Zimbabwe. 
              We believe that every builder, contractor, and homeowner should have 
              access to accurate, transparent, and affordable construction estimates.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">What We Do</h2>
            <p className="text-gray-600 leading-relaxed">
              We provide a platform that uses AI to read floor plans and generate 
              professional Bills of Quantities (BOQs) in minutes. Our platform connects 
              clients with hardware stores, construction companies, and skilled workers 
              — creating a complete construction ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
              <div className="text-3xl mb-3">📐</div>
              <h3 className="font-bold text-[#2C3E50]">Accurate Estimates</h3>
              <p className="text-sm text-gray-500">AI-powered BOQs with local pricing</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
              <div className="text-3xl mb-3">🏪</div>
              <h3 className="font-bold text-[#2C3E50]">Local Suppliers</h3>
              <p className="text-sm text-gray-500">Connected to Zimbabwe hardware stores</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
              <div className="text-3xl mb-3">👷</div>
              <h3 className="font-bold text-[#2C3E50]">Skilled Workers</h3>
              <p className="text-sm text-gray-500">Access to verified local tradespeople</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Why Zimbabwe?</h2>
            <p className="text-gray-600 leading-relaxed">
              Zimbabwe has a vibrant construction industry, but accessing accurate 
              cost estimates and finding reliable suppliers can be challenging. 
              VeriBuild was built specifically for the Zimbabwean market with 
              local prices, local suppliers, and local workers.
            </p>
          </div>

          <div className="bg-[#F47B20]/5 p-8 rounded-2xl border border-[#F47B20]/20 text-center">
            <h3 className="text-xl font-bold text-[#2C3E50] mb-3">Ready to Build?</h3>
            <p className="text-gray-600 mb-4">Join thousands of Zimbabweans already using VeriBuild.</p>
            <Link
              href="/register"
              className="bg-[#F47B20] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition inline-block"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C3E50] text-white py-12 px-6">
  <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-8">
    <div className="md:col-span-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#F47B20] rounded-xl flex items-center justify-center text-white font-bold text-lg">
          V
        </div>
        <h3 className="text-xl font-bold">VeriBuild</h3>
      </div>
      <p className="text-gray-400 text-sm">A product of GatekeeperAI</p>
      <p className="text-gray-500 text-xs mt-4">© 2026 VeriBuild. All rights reserved.</p>
    </div>
    <div>
      <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">Platform</h4>
      <ul className="space-y-3 text-sm text-gray-400">
        <li><Link href="/" className="hover:text-white transition">Home</Link></li>
        <li><Link href="/about" className="hover:text-white transition">About</Link></li>
        <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
      </ul>
    </div>
    <div>
      <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">Support</h4>
      <ul className="space-y-3 text-sm text-gray-400">
        <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
        <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
        <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
        <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
        <li><Link href="/refund" className="hover:text-white transition">Refund Policy</Link></li>
      </ul>
    </div>
    <div>
      <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">Connect</h4>
      <ul className="space-y-3 text-sm text-gray-400">
        <li>🇿🇼 Zimbabwe</li>
        <li>📧 admin@gatekeeperai.co.zw</li>
        <li>📧 gatekeeperzw@gmail.com</li>
        <li>📞 +263 77 780 3517</li>
      </ul>
    </div>
  </div>
</footer>
    </div>
  );
    }
