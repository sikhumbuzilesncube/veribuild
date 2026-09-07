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
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ===== HEADER ===== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-sm py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-lg">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2C3E50] tracking-tight">VeriBuild</h1>
              <p className="text-[9px] text-gray-400 tracking-widest uppercase">A product of GatekeeperAI</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">How It Works</a>
            <Link href="/pricing" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">Pricing</Link>
            <Link href="/about" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">About</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[#2C3E50] hover:text-[#F47B20] transition font-medium text-sm">
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-36 pb-20 px-6 bg-gradient-to-br from-white via-orange-50/30 to-white overflow-hidden">
        <div className="absolute top-20 right-0 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-[#F47B20]/10 text-[#F47B20] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                Built for Zimbabwe
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-[#2C3E50] leading-tight tracking-tight">
                Generate Professional{' '}
                <span className="text-[#F47B20]">BOQs</span>
                <br />
                in 3 Minutes
              </h1>
              <p className="text-lg text-gray-600 mt-6 max-w-lg leading-relaxed">
                Upload your floor plan and let AI do the work — get accurate material costs, supplier comparisons, and worker suggestions.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  href="/register"
                  className="bg-[#F47B20] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#E06B10] transition shadow-lg shadow-orange-200/50"
                >
                  Start Building
                </Link>
                <button
                  onClick={() => setShowSample(!showSample)}
                  className="border-2 border-[#2C3E50] text-[#2C3E50] px-8 py-3.5 rounded-xl font-semibold hover:bg-[#2C3E50] hover:text-white transition"
                >
                  View Sample BOQ
                </button>
              </div>
              <div className="flex items-center gap-8 mt-8 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#F47B20] rounded-full" />
                  500+ Projects
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#F47B20] rounded-full" />
                  50+ Hardware Stores
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#F47B20] rounded-full" />
                  100+ Workers
                </span>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <span className="text-sm text-gray-400 ml-2">BOQ Preview</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[#2C3E50] font-medium">Foundation Excavation</span>
                    <span className="text-[#F47B20] font-bold">$249.48</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[#2C3E50] font-medium">Concrete Mix</span>
                    <span className="text-[#F47B20] font-bold">$1,349.46</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[#2C3E50] font-medium">Cement 50kg</span>
                    <span className="text-[#F47B20] font-bold">$1,190.70</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-[#2C3E50] font-medium">Standard Bricks</span>
                    <span className="text-[#F47B20] font-bold">$13,778.10</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-[#F47B20]">
                    <span className="font-bold text-[#2C3E50]">Total</span>
                    <span className="font-bold text-[#F47B20] text-lg">$29,286.63</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== REGISTRATION TYPES ===== */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2C3E50]">Who Are You?</h2>
            <p className="text-gray-600 mt-2">Choose your account type and get started</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/register"
              className="group bg-gray-50 hover:bg-[#F47B20]/5 rounded-xl p-6 text-center border border-gray-200 hover:border-[#F47B20] transition"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 group-hover:bg-[#F47B20]/10 flex items-center justify-center text-[#2C3E50] group-hover:text-[#F47B20] transition font-bold text-lg">
                H
              </div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Client</h3>
              <p className="text-sm text-gray-500 mt-1">Generate BOQs</p>
            </Link>
            
            <Link
              href="/hardware/register"
              className="group bg-gray-50 hover:bg-[#F47B20]/5 rounded-xl p-6 text-center border border-gray-200 hover:border-[#F47B20] transition"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 group-hover:bg-[#F47B20]/10 flex items-center justify-center text-[#2C3E50] group-hover:text-[#F47B20] transition font-bold text-lg">
                S
              </div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Hardware Store</h3>
              <p className="text-sm text-gray-500 mt-1">List your prices</p>
            </Link>
            
            <Link
              href="/construction/register"
              className="group bg-gray-50 hover:bg-[#F47B20]/5 rounded-xl p-6 text-center border border-gray-200 hover:border-[#F47B20] transition"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 group-hover:bg-[#F47B20]/10 flex items-center justify-center text-[#2C3E50] group-hover:text-[#F47B20] transition font-bold text-lg">
                C
              </div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Construction Co.</h3>
              <p className="text-sm text-gray-500 mt-1">Advertise on BOQs</p>
            </Link>
            
            <Link
              href="/workers/register"
              className="group bg-gray-50 hover:bg-[#F47B20]/5 rounded-xl p-6 text-center border border-gray-200 hover:border-[#F47B20] transition"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 group-hover:bg-[#F47B20]/10 flex items-center justify-center text-[#2C3E50] group-hover:text-[#F47B20] transition font-bold text-lg">
                W
              </div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Skilled Worker</h3>
              <p className="text-sm text-gray-500 mt-1">Get hired</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#2C3E50]">Everything You Need to Build Smarter</h2>
            <p className="text-gray-600 mt-2">From plan upload to final BOQ — streamlined for Zimbabwe</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#F47B20]/10 rounded-xl flex items-center justify-center text-[#F47B20] font-bold text-xl mb-4">
                ↑
              </div>
              <h3 className="text-lg font-bold text-[#2C3E50] mb-2">Upload Your Plan</h3>
              <p className="text-gray-600 text-sm">PDF, JPEG, or PNG — upload your floor plan and let AI do the rest.</p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#F47B20]/10 rounded-xl flex items-center justify-center text-[#F47B20] font-bold text-xl mb-4">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-[#2C3E50] mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600 text-sm">Extracts rooms, dimensions, doors, windows, and electrical points automatically.</p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-[#F47B20]/10 rounded-xl flex items-center justify-center text-[#F47B20] font-bold text-xl mb-4">
                ≡
              </div>
              <h3 className="text-lg font-bold text-[#2C3E50] mb-2">Instant BOQ</h3>
              <p className="text-gray-600 text-sm">Get a professional BOQ with hardware prices, supplier comparisons, and worker suggestions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#2C3E50]">How It Works — 3 Simple Steps</h2>
            <p className="text-gray-600 mt-2">From upload to BOQ in under 3 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-[#F47B20] text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-orange-200/50">
                1
              </div>
              <h3 className="text-lg font-bold text-[#2C3E50] mb-2">Upload Your Plan</h3>
              <p className="text-gray-600 text-sm max-w-xs mx-auto">PDF, JPEG, or PNG — we support all common formats.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-[#F47B20] text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-orange-200/50">
                2
              </div>
              <h3 className="text-lg font-bold text-[#2C3E50] mb-2">AI Reads Your Plan</h3>
              <p className="text-gray-600 text-sm max-w-xs mx-auto">Extracts all key information — rooms, dimensions, labels.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-[#F47B20] text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-orange-200/50">
                3
              </div>
              <h3 className="text-lg font-bold text-[#2C3E50] mb-2">Get Your BOQ</h3>
              <p className="text-gray-600 text-sm max-w-xs mx-auto">Professional BOQ with local hardware prices and worker suggestions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING PREVIEW ===== */}
      <section className="py-20 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#2C3E50]">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 mt-2">Pay only for what you need</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-[#2C3E50]">Residential</h3>
              <p className="text-4xl font-bold text-[#F47B20] my-4">$10</p>
              <p className="text-sm text-gray-500">Per BOQ</p>
              <ul className="mt-6 space-y-2 text-sm text-left text-gray-600">
                <li className="flex items-center gap-2"><span className="text-[#F47B20] font-bold">✓</span> Full BOQ Generation</li>
                <li className="flex items-center gap-2"><span className="text-[#F47B20] font-bold">✓</span> Supplier Price Comparison</li>
                <li className="flex items-center gap-2"><span className="text-[#F47B20] font-bold">✓</span> Worker Suggestions</li>
              </ul>
              <Link href="/register" className="block mt-8 bg-[#F47B20] text-white py-2.5 rounded-lg font-semibold hover:bg-[#E06B10] transition">
                Get Started
              </Link>
            </div>

            <div className="bg-white p-8 rounded-xl border-2 border-[#F47B20] text-center shadow-lg shadow-orange-100 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F47B20] text-white px-4 py-0.5 rounded-full text-xs font-bold uppercase">Popular</span>
              <h3 className="text-lg font-bold text-[#2C3E50]">Townhouse</h3>
              <p className="text-4xl font-bold text-[#F47B20] my-4">$10</p>
              <p className="text-sm text-gray-500">Per BOQ</p>
              <ul className="mt-6 space-y-2 text-sm text-left text-gray-600">
                <li className="flex items-center gap-2"><span className="text-[#F47B20] font-bold">✓</span> Full BOQ Generation</li>
                <li className="flex items-center gap-2"><span className="text-[#F47B20] font-bold">✓</span> Supplier Price Comparison</li>
                <li className="flex items-center gap-2"><span className="text-[#F47B20] font-bold">✓</span> Worker Suggestions</li>
              </ul>
              <Link href="/register" className="block mt-8 bg-[#F47B20] text-white py-2.5 rounded-lg font-semibold hover:bg-[#E06B10] transition">
                Get Started
              </Link>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-[#2C3E50]">Commercial</h3>
              <p className="text-4xl font-bold text-[#F47B20] my-4">$30</p>
              <p className="text-sm text-gray-500">Per BOQ</p>
              <ul className="mt-6 space-y-2 text-sm text-left text-gray-600">
                <li className="flex items-center gap-2"><span className="text-[#F47B20] font-bold">✓</span> Full BOQ Generation</li>
                <li className="flex items-center gap-2"><span className="text-[#F47B20] font-bold">✓</span> Supplier Price Comparison</li>
                <li className="flex items-center gap-2"><span className="text-[#F47B20] font-bold">✓</span> Unlimited Exports</li>
              </ul>
              <Link href="/register" className="block mt-8 bg-[#2C3E50] text-white py-2.5 rounded-lg font-semibold hover:bg-[#1a2a3a] transition">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SAMPLE BOQ MODAL ===== */}
      {showSample && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSample(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#2C3E50]">Sample BOQ</h3>
              <button onClick={() => setShowSample(false)} className="text-gray-400 hover:text-gray-600 text-2xl transition">✕</button>
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
                  <tr className="font-bold bg-[#F47B20]/10">
                    <td className="p-3">Total</td>
                    <td></td>
                    <td></td>
                    <td className="text-[#F47B20]">$4,850</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-500">
                <span className="text-green-600 font-semibold">Best Price: Builders Warehouse — $4,360</span>
                <span className="ml-4">(Save $490)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#2C3E50] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                V
              </div>
              <h3 className="text-lg font-bold">VeriBuild</h3>
            </div>
            <p className="text-gray-400 text-sm">A product of GatekeeperAI</p>
            <p className="text-gray-500 text-xs mt-4">© 2026 All rights reserved</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">Platform</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link href="/about" className="hover:text-white transition">About</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">Support</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">Connect</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">🇿🇼 Zimbabwe</li>
              <li className="flex items-center gap-2">📧 info@veribuild.co.zw</li>
              <li className="flex items-center gap-2">📞 +263 78 123 4567</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
    }
