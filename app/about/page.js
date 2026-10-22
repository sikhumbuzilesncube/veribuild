'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  IconSparkle,
  IconShield,
  IconCheck,
} from '@/components/Icons';

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
    <div className="min-h-screen bg-white font-sans antialiased text-slate-700">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-br from-white via-orange-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2C3E50] mb-6">
            About <span className="text-[#F47B20]">VeriBuild</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Building Zimbabwe&apos;s future, one BOQ at a time.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-16">
          
          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Our Mission</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              VeriBuild was created to simplify the construction process in Zimbabwe. We believe that every builder, contractor, and homeowner should have access to accurate, transparent, and affordable construction estimates.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">What We Do</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              We provide a platform that uses AI to read floor plans and generate professional Bills of Quantities (BOQs) in minutes. Our platform connects clients with hardware stores, construction companies, and skilled workers — creating a complete construction ecosystem.
            </p>
          </div>

          {/* Feature Grid with SVG Icons */}
          <div className="grid md:grid-cols-3 gap-6 pt-4">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
              <div className="w-12 h-12 bg-[#F47B20] rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                <IconSparkle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#2C3E50] mb-2">Accurate Estimates</h3>
              <p className="text-sm text-gray-600">AI-powered BOQs with local pricing.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
              <div className="w-12 h-12 bg-[#2C3E50] rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                <IconShield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#2C3E50] mb-2">Local Suppliers</h3>
              <p className="text-sm text-gray-600">Connected to Zimbabwe hardware stores.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
              <div className="w-12 h-12 bg-[#F47B20] rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                <IconCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#2C3E50] mb-2">Skilled Workers</h3>
              <p className="text-sm text-gray-600">Access to verified local tradespeople.</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Why Zimbabwe?</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Zimbabwe has a vibrant construction industry, but accessing accurate cost estimates and finding reliable suppliers can be challenging. VeriBuild was built specifically for the Zimbabwean market with local prices, local suppliers, and local workers.
            </p>
          </div>

          {/* CTA */}
          <div className="bg-orange-50 rounded-2xl p-8 text-center border border-orange-100">
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-3">Ready to Build?</h2>
            <p className="text-gray-600 mb-6">Join thousands of Zimbabweans already using VeriBuild.</p>
            <Link
              href="/register"
              className="inline-block bg-[#F47B20] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition"
            >
              Get Started Today
            </Link>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
      }
