'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [showSample, setShowSample] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('residential');
  const statsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const plans = {
    residential: {
      name: 'Residential',
      price: '$10',
      description: 'Perfect for homeowners and small projects',
      features: ['Full BOQ Generation', 'Supplier Price Comparison', 'Worker Suggestions', '3 Exports']
    },
    townhouse: {
      name: 'Townhouse',
      price: '$10',
      description: 'Ideal for medium-sized residential projects',
      features: ['Full BOQ Generation', 'Supplier Price Comparison', 'Worker Suggestions', '3 Exports']
    },
    commercial: {
      name: 'Commercial',
      price: '$30',
      description: 'For large-scale commercial projects',
      features: ['Full BOQ Generation', 'Supplier Price Comparison', 'Worker Suggestions', 'Unlimited Exports', 'Multi-Story Support']
    }
  };

  const currentPlan = plans[activeTab] || plans.residential;

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ===== HEADER ===== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-[#F47B20] to-[#E06B10] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform duration-300">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2C3E50] tracking-tight">VeriBuild</h1>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase">A product of GatekeeperAI</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            <a href="#features" className="text-gray-600 hover:text-[#F47B20] transition font-medium text-sm">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-[#F47B20] transition font-medium text-sm">How It Works</a>
            <a href="#pricing" className="text-gray-600 hover:text-[#F47B20] transition font-medium text-sm">Pricing</a>
            <a href="#testimonials" className="text-gray-600 hover:text-[#F47B20] transition font-medium text-sm">Testimonials</a>
            <Link href="/about" className="text-gray-600 hover:text-[#F47B20] transition font-medium text-sm">About</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block text-[#2C3E50] hover:text-[#F47B20] transition font-medium text-sm px-4 py-2 rounded-lg hover:bg-orange-50">
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-[#F47B20] to-[#E06B10] text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-200 transition-all duration-300 text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-white">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-100/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-r from-orange-100/20 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-[#F47B20] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                <span className="w-2 h-2 bg-[#F47B20] rounded-full animate-pulse" />
                Built for Zimbabwe
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-[#2C3E50] leading-tight tracking-tight">
                Generate Professional{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47B20] to-[#E06B10]">
                  BOQs
                </span>{' '}
                in 3 Minutes
              </h1>
              <p className="text-xl text-gray-600 mt-6 max-w-lg leading-relaxed">
                Upload your floor plan and let AI do the work — get accurate material costs, supplier comparisons, and worker suggestions.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-[#F47B20] to-[#E06B10] text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-orange-200 transition-all duration-300 flex items-center gap-2"
                >
                  Start Building
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <button
                  onClick={() => setShowSample(!showSample)}
                  className="border-2 border-[#2C3E50] text-[#2C3E50] px-8 py-4 rounded-xl font-semibold hover:bg-[#2C3E50] hover:text-white transition-all duration-300"
                >
                  View Sample BOQ
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-8 mt-10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-[#F47B20]/20 border-2 border-white flex items-center justify-center text-[#F47B20] font-bold text-sm">JM</div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-white flex items-center justify-center text-blue-600 font-bold text-sm">SN</div>
                    <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-white flex items-center justify-center text-green-600 font-bold text-sm">TM</div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-white flex items-center justify-center text-purple-600 font-bold text-sm">+99</div>
                  </div>
                  <div>
                    <p className="font-bold text-[#2C3E50] text-sm">500+ Builders</p>
                    <p className="text-xs text-gray-500">Trust VeriBuild</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-xl">★★★★★</span>
                  <span className="text-sm text-gray-600">4.9 (120+ reviews)</span>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#F47B20] to-[#E06B10] rounded-3xl blur-3xl opacity-20" />
                <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                    <span className="text-sm text-gray-400 ml-2">BOQ Preview</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="font-medium text-[#2C3E50]">Foundation Excavation</span>
                      <span className="font-bold text-[#F47B20]">$249.48</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="font-medium text-[#2C3E50]">Concrete Mix</span>
                      <span className="font-bold text-[#F47B20]">$1,349.46</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="font-medium text-[#2C3E50]">Cement 50kg</span>
                      <span className="font-bold text-[#F47B20]">$1,190.70</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="font-medium text-[#2C3E50]">Standard Bricks</span>
                      <span className="font-bold text-[#F47B20]">$13,778.10</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-[#F47B20]">
                      <span className="font-bold text-[#2C3E50] text-lg">Total</span>
                      <span className="font-bold text-[#F47B20] text-xl">$29,286.63</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== REGISTRATION TYPES ===== */}
      <section className="py-20 px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[#F47B20] font-semibold text-sm uppercase tracking-wider">Who Are You?</span>
            <h2 className="text-4xl font-bold text-[#2C3E50] mt-2">Choose Your Account Type</h2>
            <p className="text-gray-600 mt-4 max-w-xl mx-auto">Join the platform that's perfect for your role in construction</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/register"
              className="group bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-white rounded-2xl p-8 text-center border border-gray-200 hover:border-[#F47B20] transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 group-hover:bg-[#F47B20]/10 flex items-center justify-center text-2xl text-[#2C3E50] group-hover:text-[#F47B20] transition">
                🏠
              </div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Client</h3>
              <p className="text-sm text-gray-500 mt-1">Generate BOQs</p>
            </Link>
            
            <Link
              href="/hardware/register"
              className="group bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-white rounded-2xl p-8 text-center border border-gray-200 hover:border-[#F47B20] transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 group-hover:bg-[#F47B20]/10 flex items-center justify-center text-2xl text-[#2C3E50] group-hover:text-[#F47B20] transition">
                🏪
              </div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Hardware Store</h3>
              <p className="text-sm text-gray-500 mt-1">List your prices</p>
            </Link>
            
            <Link
              href="/construction/register"
              className="group bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-white rounded-2xl p-8 text-center border border-gray-200 hover:border-[#F47B20] transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 group-hover:bg-[#F47B20]/10 flex items-center justify-center text-2xl text-[#2C3E50] group-hover:text-[#F47B20] transition">
                🏗️
              </div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Construction Co.</h3>
              <p className="text-sm text-gray-500 mt-1">Advertise on BOQs</p>
            </Link>
            
            <Link
              href="/workers/register"
              className="group bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-white rounded-2xl p-8 text-center border border-gray-200 hover:border-[#F47B20] transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 group-hover:bg-[#F47B20]/10 flex items-center justify-center text-2xl text-[#2C3E50] group-hover:text-[#F47B20] transition">
                🔧
              </div>
              <h3 className="font-bold text-[#2C3E50] group-hover:text-[#F47B20] transition">Skilled Worker</h3>
              <p className="text-sm text-gray-500 mt-1">Get hired</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#F47B20] font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-4xl font-bold text-[#2C3E50] mt-2">Everything You Need to Build Smarter</h2>
            <p className="text-gray-600 mt-4 max-w-xl mx-auto">From plan upload to final BOQ — VeriBuild streamlines the entire process</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200/30 rounded-xl flex items-center justify-center mb-5 text-2xl group-hover:scale-110 transition">
                📄
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-3">Upload Your Plan</h3>
              <p className="text-gray-600 leading-relaxed">PDF, JPEG, or PNG — just upload your floor plan and let AI do the rest.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200/30 rounded-xl flex items-center justify-center mb-5 text-2xl group-hover:scale-110 transition">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-3">AI-Powered Analysis</h3>
              <p className="text-gray-600 leading-relaxed">Extracts rooms, dimensions, doors, windows, and electrical points automatically.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200/30 rounded-xl flex items-center justify-center mb-5 text-2xl group-hover:scale-110 transition">
                📋
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-3">Instant BOQ</h3>
              <p className="text-gray-600 leading-relaxed">Get a professional BOQ with hardware prices, supplier comparisons, and worker suggestions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#F47B20] font-semibold text-sm uppercase tracking-wider">Process</span>
            <h2 className="text-4xl font-bold text-[#2C3E50] mt-2">How It Works</h2>
            <p className="text-gray-600 mt-4 max-w-xl mx-auto">From upload to BOQ in under 3 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="absolute hidden md:block top-1/3 left-[15%] right-[15%] h-0.5 bg-gray-200 -translate-y-1/2" />
            {[
              { number: '01', title: 'Upload Your Plan', description: 'PDF, JPEG, or PNG — we support all common formats.', icon: '📤' },
              { number: '02', title: 'AI Reads Your Plan', description: 'Extracts all key information — rooms, dimensions, labels.', icon: '🤖' },
              { number: '03', title: 'Get Your BOQ', description: 'Professional BOQ with local hardware prices and worker suggestions.', icon: '📋' }
            ].map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#F47B20] to-[#E06B10] rounded-2xl flex items-center justify-center text-3xl text-white shadow-xl shadow-orange-200 mb-6 relative z-10">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-[#2C3E50] mb-3">{step.number}. {step.title}</h3>
                <p className="text-gray-600 text-sm max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#F47B20] font-semibold text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="text-4xl font-bold text-[#2C3E50] mt-2">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 mt-4 max-w-xl mx-auto">Pay only for what you need. No hidden fees</p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 max-w-xs mx-auto mb-10">
            {['residential', 'townhouse', 'commercial'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#F47B20] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <div className={`bg-white rounded-3xl shadow-2xl border border-gray-100 p-10 transition-all duration-500 ${
              activeTab === 'commercial' ? 'ring-2 ring-[#F47B20]' : ''
            }`}>
              {activeTab === 'commercial' && (
                <div className="inline-block bg-[#F47B20] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  Best Value
                </div>
              )}
              <h3 className="text-2xl font-bold text-[#2C3E50]">{currentPlan.name}</h3>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-5xl font-bold text-[#F47B20]">{currentPlan.price}</span>
                <span className="text-gray-500">/ BOQ</span>
              </div>
              <p className="text-gray-500 mt-2">{currentPlan.description}</p>
              <ul className="mt-6 space-y-3">
                {currentPlan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-600">
                    <span className="text-[#F47B20] text-xl">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full text-center mt-8 bg-gradient-to-r from-[#F47B20] to-[#E06B10] text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-200 transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#F47B20] font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-4xl font-bold text-[#2C3E50] mt-2">What Our Users Say</h2>
            <p className="text-gray-600 mt-4 max-w-xl mx-auto">Hear from people who have used VeriBuild</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'John Moyo', role: 'Contractor', quote: 'VeriBuild has revolutionized how I prepare estimates. I can generate a BOQ in minutes instead of days.', rating: 5 },
              { name: 'Sarah Ncube', role: 'Architect', quote: 'The AI accuracy is impressive. It catches details I would have missed. A game-changer for my practice.', rating: 5 },
              { name: 'Tendai Musasa', role: 'Homeowner', quote: 'Building my dream home was stress-free with VeriBuild. I knew exactly what to budget for.', rating: 4 }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex text-yellow-400 text-lg mb-4">
                  {'★'.repeat(testimonial.rating)}{'☆'.repeat(5 - testimonial.rating)}
                </div>
                <p className="text-gray-600 italic leading-relaxed">"{testimonial.quote}"</p>
                <div className="mt-4">
                  <p className="font-bold text-[#2C3E50]">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#2C3E50] to-[#1a2a3a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Building?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of Zimbabweans already using VeriBuild to generate professional BOQs.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-[#2C3E50] px-10 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-orange-200/30 transition-all duration-300"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* ===== SAMPLE BOQ MODAL ===== */}
      {showSample && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSample(false)}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
                <span className="text-green-600 font-semibold">Best Price: Builders Warehouse — $4,360</span>
                <span className="ml-4">(Save $490)</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button className="text-[#F47B20] hover:underline font-medium">Download Full Sample BOQ (PDF)</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#2C3E50] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#F47B20] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                V
              </div>
              <h3 className="text-xl font-bold">VeriBuild</h3>
            </div>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              Building Zimbabwe's future, one BOQ at a time.
            </p>
            <p className="text-gray-500 text-xs mt-4">© 2026 VeriBuild. A product of GatekeeperAI. All rights reserved.</p>
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
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
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
