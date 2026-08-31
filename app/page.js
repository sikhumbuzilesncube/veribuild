'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [showSample, setShowSample] = useState(false);
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
      {/* ===== HEADER ===== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2C3E50] leading-tight">VeriBuild</h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">A product of GatekeeperAI</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-[#F47B20] transition">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-[#F47B20] transition">How It Works</a>
            <a href="#pricing" className="text-gray-600 hover:text-[#F47B20] transition">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[#2C3E50] hover:text-[#F47B20] transition font-medium">
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition shadow-lg shadow-orange-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-white via-orange-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-[#F47B20]/10 text-[#F47B20] px-4 py-1 rounded-full text-sm font-semibold mb-6">
            🇿🇼 Built for Zimbabwe
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#2C3E50] leading-tight mb-6">
            Generate Professional BOQs from Floor Plans in{' '}
            <span className="text-[#F47B20]">3 Minutes</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Get accurate material costs from local hardwares, compare suppliers, 
            and find skilled workers — all in one platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="bg-[#F47B20] text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-[#E06B10] transition shadow-xl shadow-orange-200"
            >
              Start Building →
            </Link>
            <button
              onClick={() => setShowSample(!showSample)}
              className="border-2 border-[#2C3E50] text-[#2C3E50] px-10 py-4 rounded-xl text-lg font-semibold hover:bg-[#2C3E50] hover:text-white transition"
            >
              View Sample BOQ
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-gray-500">
            <span className="flex items-center gap-2">✅ 500+ Projects Generated</span>
            <span className="flex items-center gap-2">✅ 50+ Hardware Stores</span>
            <span className="flex items-center gap-2">✅ 100+ Skilled Workers</span>
          </div>
        </div>
      </section>

      {/* ===== REGISTRATION TYPES ===== */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#2C3E50] mb-8">Who Are You?</h2>
          <p className="text-center text-gray-600 mb-10">Choose your account type and get started</p>
          
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              href="/register"
              className="group bg-gray-50 hover:bg-[#F47B20]/10 rounded-xl p-6 text-center border border-gray-200 hover:border-[#F47B20] transition-all duration-300"
            >
              <div className="text-4xl mb-3">👤</div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Client</h3>
              <p className="text-xs text-gray-500 mt-1">Generate BOQs</p>
            </Link>
            
            <Link
              href="/hardware/register"
              className="group bg-gray-50 hover:bg-[#F47B20]/10 rounded-xl p-6 text-center border border-gray-200 hover:border-[#F47B20] transition-all duration-300"
            >
              <div className="text-4xl mb-3">🏪</div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Hardware Store</h3>
              <p className="text-xs text-gray-500 mt-1">List your prices</p>
            </Link>
            
            <Link
              href="/construction/register"
              className="group bg-gray-50 hover:bg-[#F47B20]/10 rounded-xl p-6 text-center border border-gray-200 hover:border-[#F47B20] transition-all duration-300"
            >
              <div className="text-4xl mb-3">🏗️</div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Construction Co.</h3>
              <p className="text-xs text-gray-500 mt-1">Advertise on BOQs</p>
            </Link>
            
            <Link
              href="/workers/register"
              className="group bg-gray-50 hover:bg-[#F47B20]/10 rounded-xl p-6 text-center border border-gray-200 hover:border-[#F47B20] transition-all duration-300"
            >
              <div className="text-4xl mb-3">🔧</div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Skilled Worker</h3>
              <p className="text-xs text-gray-500 mt-1">Get hired</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              Everything You Need to Build Smarter
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              From plan upload to final BOQ — VeriBuild streamlines the entire process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-[#F47B20]/10 rounded-xl flex items-center justify-center mb-5">
                <span className="text-3xl">📤</span>
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-3">Upload Your Plan</h3>
              <p className="text-gray-600">PDF, JPEG, or PNG — just upload your floor plan and let AI do the rest.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-[#F47B20]/10 rounded-xl flex items-center justify-center mb-5">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-3">AI-Powered Analysis</h3>
              <p className="text-gray-600">Extracts rooms, dimensions, doors, windows, and electrical points automatically.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-[#F47B20]/10 rounded-xl flex items-center justify-center mb-5">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-3">Instant BOQ</h3>
              <p className="text-gray-600">Get a professional BOQ with hardware prices, supplier comparisons, and worker suggestions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              How It Works — 3 Simple Steps
            </h2>
            <p className="text-gray-600 text-lg">From upload to BOQ in under 3 minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#F47B20] text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-xl shadow-orange-200">
                1
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-2">Upload Your Plan</h3>
              <p className="text-gray-600 text-sm">PDF, JPEG, or PNG — we support all common formats.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#F47B20] text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-xl shadow-orange-200">
                2
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-2">AI Reads Your Plan</h3>
              <p className="text-gray-600 text-sm">Extracts all key information — rooms, dimensions, labels.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#F47B20] text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-xl shadow-orange-200">
                3
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-2">Get Your BOQ</h3>
              <p className="text-gray-600 text-sm">Professional BOQ with local hardware prices and worker suggestions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 text-lg">Pay only for what you need.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition">
              <h3 className="text-xl font-bold text-[#2C3E50]">Residential</h3>
              <p className="text-4xl font-bold text-[#F47B20] my-4">$10</p>
              <p className="text-gray-600 text-sm">Per BOQ</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-gray-600">
                <li>✅ Full BOQ Generation</li>
                <li>✅ Supplier Price Comparison</li>
                <li>✅ Worker Suggestions</li>
                <li>✅ 3 Exports (PDF/Excel/CSV)</li>
              </ul>
              <Link href="/register" className="block mt-8 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition">
                Get Started
              </Link>
            </div>

            <div className="border-2 border-[#F47B20] rounded-2xl p-8 text-center shadow-xl shadow-orange-100 relative">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F47B20] text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
                Popular
              </span>
              <h3 className="text-xl font-bold text-[#2C3E50]">Townhouse</h3>
              <p className="text-4xl font-bold text-[#F47B20] my-4">$10</p>
              <p className="text-gray-600 text-sm">Per BOQ</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-gray-600">
                <li>✅ Full BOQ Generation</li>
                <li>✅ Supplier Price Comparison</li>
                <li>✅ Worker Suggestions</li>
                <li>✅ 3 Exports (PDF/Excel/CSV)</li>
              </ul>
              <Link href="/register" className="block mt-8 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition">
                Get Started
              </Link>
            </div>

            <div className="border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition">
              <h3 className="text-xl font-bold text-[#2C3E50]">Commercial</h3>
              <p className="text-4xl font-bold text-[#F47B20] my-4">$30</p>
              <p className="text-gray-600 text-sm">Per BOQ</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-gray-600">
                <li>✅ Full BOQ Generation</li>
                <li>✅ Supplier Price Comparison</li>
                <li>✅ Worker Suggestions</li>
                <li>✅ Unlimited Exports</li>
                <li>✅ Multi-Story Support</li>
                <li>✅ Priority Processing</li>
              </ul>
              <Link href="/register" className="block mt-8 bg-[#2C3E50] text-white py-3 rounded-lg font-semibold hover:bg-[#1a2a3a] transition">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SAMPLE BOQ MODAL ===== */}
      {showSample && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSample(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#2C3E50]">📋 Sample BOQ</h3>
              <button onClick={() => setShowSample(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[#2C3E50]">3-Bedroom Residential House</span>
                <span className="text-sm text-gray-600">Harare, Zimbabwe</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-[#2C3E50] text-white">
                  <tr>
                    <th className="p-3 text-left">Material</th>
                    <th className="p-3 text-left">Qty</th>
                    <th className="p-3 text-left">Unit</th>
                    <th className="p-3 text-left">Price (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-3">Cement 50kg</td><td>45</td><td>bags</td><td>$540</td></tr>
                  <tr className="border-b"><td className="p-3">Standard Brick</td><td>450</td><td>pieces</td><td>$180</td></tr>
                  <tr className="border-b"><td className="p-3">Steel Rebar 12mm</td><td>28</td><td>pieces</td><td>$392</td></tr>
                  <tr className="border-b"><td className="p-3">Wall Paint 20L</td><td>20</td><td>litres</td><td>$400</td></tr>
                  <tr className="border-b"><td className="p-3">Skilled Mason</td><td>12</td><td>days</td><td>$180</td></tr>
                  <tr className="font-bold bg-[#F47B20]/10">
                    <td className="p-3">Total</td>
                    <td></td>
                    <td></td>
                    <td className="text-[#F47B20]">$4,850</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-500">
                <span className="text-green-600 font-semibold">✓ Best Price: Builders Warehouse — $4,360</span>
                <span className="ml-4">(Save $490)</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button className="text-[#F47B20] hover:underline font-medium">📥 Download Full Sample BOQ (PDF)</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#2C3E50] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                V
              </div>
              <h3 className="text-lg font-bold">VeriBuild</h3>
            </div>
            <p className="text-gray-400 text-sm">A product of GatekeeperAI</p>
            <p className="text-gray-500 text-xs mt-2">© 2026 All rights reserved</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>🇿🇼 Zimbabwe</li>
              <li>📧 info@veribuild.co.zw</li>
              <li>📞 +263 78 123 4567</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
