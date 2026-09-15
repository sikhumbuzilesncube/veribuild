'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// ---- Inline SVG icons ----
const IconUpload = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12m4.5-4.5v9" />
  </svg>
);
const IconSparkle = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);
const IconDocument = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);
const IconShield = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
  </svg>
);
const IconWifi = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
  </svg>
);
const IconMail = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const IconPhone = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);
const IconMapPin = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const IconCheck = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export default function Home() {
  const [showSample, setShowSample] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showSample ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showSample]);

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-700">

      {/* ===== HEADER ===== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur border-b border-gray-100 py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-content mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
            <div className="leading-none">
              <h1 className="text-xl font-bold tracking-tight">VeriBuild</h1>
              <p className="text-[9px] text-gray-400 tracking-widest uppercase mt-0.5">By GatekeeperAI</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-gray-600 hover:text-brand-500 transition text-sm font-medium">How It Works</a>
            <a href="#who" className="text-gray-600 hover:text-brand-500 transition text-sm font-medium">Who It&apos;s For</a>
            <a href="#pricing" className="text-gray-600 hover:text-brand-500 transition text-sm font-medium">Pricing</a>
            <Link href="/about" className="text-gray-600 hover:text-brand-500 transition text-sm font-medium">About</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:inline text-slate-700 hover:text-brand-500 transition font-medium text-sm">
              Log In
            </Link>
            <Link href="/register" className="bg-brand-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-brand-600 transition text-sm">
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-28 px-6 bg-white">
        <div className="max-w-content mx-auto">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-500 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                Built for Zimbabwe
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.05] tracking-tight text-slate-700">
                Know your build cost <span className="text-brand-500">before</span> you break ground.
              </h1>
              <p className="text-lg text-gray-600 mt-6 max-w-lg leading-relaxed">
                Upload your floor plan. In three minutes, get a professional BOQ with real material prices from Zimbabwean hardware stores, plus labour cost estimates.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="/register" className="bg-brand-500 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition shadow-card">
                  Generate my first BOQ
                </Link>
                <button
                  onClick={() => setShowSample(true)}
                  className="border border-gray-300 text-slate-700 px-7 py-3.5 rounded-xl font-semibold hover:border-slate-700 hover:bg-gray-50 transition"
                >
                  See a sample
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10 pt-8 border-t border-gray-100 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <IconShield className="w-4 h-4 text-brand-500" />
                  <span>Payments via <strong className="font-semibold">ContiPay</strong></span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <IconWifi className="w-4 h-4 text-brand-500" />
                  <span>Works offline on low data</span>
                </div>
              </div>
            </div>

            {/* BOQ Preview card */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-card-hover border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Sample BOQ</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">3-Bed House · Borrowdale</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-2 py-1 rounded">
                    Live pricing
                  </span>
                </div>
                <div className="p-6 space-y-3 text-sm">
                  {[
                    ['Foundation excavation', '$249.48'],
                    ['Concrete mix (20MPa)', '$1,349.46'],
                    ['Cement 50kg · 45 bags', '$540.00'],
                    ['Standard bricks · 450 pcs', '$180.00'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-gray-100 pb-2.5">
                      <span className="text-gray-600">{label}</span>
                      <span className="text-slate-700 font-semibold tabular-nums">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-b border-gray-100 pb-2.5">
                    <span className="text-gray-600">Labour (skilled + general)</span>
                    <span className="text-slate-700 font-semibold tabular-nums">$3,200.00</span>
                  </div>
                  <div className="flex justify-between pt-3 mt-1 border-t-2 border-brand-500">
                    <span className="font-bold text-slate-700">Project total</span>
                    <span className="font-bold text-brand-500 text-lg tabular-nums">$29,286.63</span>
                  </div>
                  <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-2">
                    Best supplier: Builders Warehouse — save $490
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHO IT'S FOR ===== */}
      <section id="who" className="py-20 md:py-28 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-content mx-auto">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-700">Built for everyone in the build.</h2>
            <p className="text-gray-600 mt-3 text-lg">One platform, four account types — each with tools made for the job.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { letter: 'H', title: 'Homeowner', desc: 'Planning a build or renovation', href: '/register' },
              { letter: 'S', title: 'Hardware Store', desc: 'List prices, reach more builders', href: '/hardware/register' },
              { letter: 'C', title: 'Construction Co.', desc: 'Get featured on client BOQs', href: '/construction/register' },
              { letter: 'W', title: 'Skilled Worker', desc: 'Get matched to real jobs', href: '/workers/register' },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-brand-500 hover:shadow-card-hover transition"
              >
                <div className="w-11 h-11 mb-4 rounded-lg bg-gray-100 group-hover:bg-brand-500 flex items-center justify-center text-slate-700 group-hover:text-white transition font-bold">
                  {item.letter}
                </div>
                <h3 className="font-bold text-slate-700 group-hover:text-brand-500 transition">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-snug">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-content mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-700">From floor plan to full BOQ in 3 minutes.</h2>
            <p className="text-gray-600 mt-3 text-lg">No quantity surveyor required. No spreadsheets. Just your plan.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
            {[
              {
                n: '01',
                icon: <IconUpload className="w-6 h-6" />,
                title: 'Upload your plan',
                body: 'Drop in a PDF, JPEG, or PNG. Hand-drawn sketches and scanned plans work too.',
              },
              {
                n: '02',
                icon: <IconSparkle className="w-6 h-6" />,
                title: 'We read every detail',
                body: 'Rooms, dimensions, doors, windows, electrical points — extracted automatically.',
              },
              {
                n: '03',
                icon: <IconDocument className="w-6 h-6" />,
                title: 'Get your BOQ',
                body: 'Priced against live local hardware stock. Compare suppliers. See labour costs. Build.',
              },
            ].map((step) => (
              <div key={step.n} className="relative">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-sm font-bold text-brand-500 tabular-nums">{step.n}</span>
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-700">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST / STATS ===== */}
      <section className="py-16 px-6 bg-slate-700 text-white">
        <div className="max-w-content mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ['500+', 'Projects priced'],
            ['50+', 'Partner hardware stores'],
            ['100+', 'Verified workers'],
            ['3 min', 'Average BOQ time'],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-bold text-brand-500 tabular-nums">{stat}</p>
              <p className="text-sm text-gray-300 mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 md:py-28 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-700">Simple, honest pricing.</h2>
            <p className="text-gray-600 mt-3 text-lg">Pay per BOQ. No subscriptions. No hidden fees.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-card">
            <div className="grid md:grid-cols-5">
              {/* Left: Price */}
              <div className="md:col-span-2 p-8 md:p-10 bg-slate-700 text-white">
                <span className="inline-block bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                  Ordinary Plan
                </span>
                <div className="mt-6">
                  <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Starting from</p>
                  <p className="mt-2 flex items-baseline">
                    <span className="text-6xl font-bold text-brand-500">$10</span>
                    <span className="text-gray-400 ml-3 text-base">/ BOQ</span>
                  </p>
                </div>
                <p className="text-gray-300 text-sm mt-6 leading-relaxed">
                  Final price depends on plan size and complexity. You&apos;ll see it before you pay.
                </p>
                <Link
                  href="/register"
                  className="mt-8 inline-flex items-center justify-center w-full bg-brand-500 text-white py-3 rounded-lg font-semibold hover:bg-brand-600 transition"
                >
                  Generate my BOQ
                </Link>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Secure payment via ContiPay
                </p>
              </div>

              {/* Right: What's included */}
              <div className="md:col-span-3 p-8 md:p-10">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-5">
                  Every BOQ includes
                </p>
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Full BOQ from your floor plan</p>
                      <p className="text-sm text-gray-600 mt-0.5">Every material, quantified and listed.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Material cost comparison</p>
                      <p className="text-sm text-gray-600 mt-0.5">Live prices from multiple local hardware stores, side by side. See where you save.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Labour cost estimates</p>
                      <p className="text-sm text-gray-600 mt-0.5">Realistic labour breakdown by trade — so your budget reflects the whole build, not just materials.</p>
                    </div>
                  </li>
                </ul>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <IconCheck className="w-3.5 h-3.5 text-brand-500" />
                    PDF &amp; JPEG exports
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IconCheck className="w-3.5 h-3.5 text-brand-500" />
                    Results in under 3 minutes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IconCheck className="w-3.5 h-3.5 text-brand-500" />
                    Works offline
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Larger or commercial project? <Link href="/contact" className="text-brand-500 font-semibold hover:underline">Talk to us</Link> for a custom quote.
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 md:py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-700">Ready to price your build?</h2>
          <p className="text-gray-600 mt-4 text-lg">Upload a plan. Get a BOQ. Build with confidence.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link href="/register" className="bg-brand-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition shadow-card">
              Create free account
            </Link>
            <Link href="/pricing" className="border border-gray-300 text-slate-700 px-8 py-3.5 rounded-xl font-semibold hover:border-slate-700 hover:bg-gray-50 transition">
              See full pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ===== SAMPLE BOQ MODAL ===== */}
      {showSample && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSample(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Sample output</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-700">3-Bedroom Residential House</h3>
                <p className="text-sm text-gray-500 mt-0.5">Harare, Zimbabwe</p>
              </div>
              <button
                onClick={() => setShowSample(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-slate-700 transition p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 text-white">
                  <tr>
                    <th className="p-3 text-left font-medium">Item</th>
                    <th className="p-3 text-right font-medium">Qty</th>
                    <th className="p-3 text-right font-medium">Unit</th>
                    <th className="p-3 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {[
                    ['Cement 50kg', '45', 'bags', '$540'],
                    ['Standard brick', '450', 'pcs', '$180'],
                    ['Steel rebar 12mm', '28', 'pcs', '$392'],
                    ['Wall paint 20L', '20', 'litres', '$400'],
                  ].map(([m, q, u, p]) => (
                    <tr key={m} className="border-b border-gray-100">
                      <td className="p-3">{m}</td>
                      <td className="p-3 text-right tabular-nums">{q}</td>
                      <td className="p-3 text-right text-gray-500">{u}</td>
                      <td className="p-3 text-right tabular-nums font-medium">{p}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="p-3 font-medium">Labour — skilled &amp; general</td>
                    <td className="p-3 text-right text-gray-500">—</td>
                    <td className="p-3 text-right text-gray-500">—</td>
                    <td className="p-3 text-right tabular-nums font-medium">$3,200</td>
                  </tr>
                  <tr className="bg-brand-500/5 font-bold">
                    <td className="p-3" colSpan={3}>Estimated total</td>
                    <td className="p-3 text-right text-brand-500 tabular-nums">$8,050</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex items-center gap-3 text-sm bg-green-50 border border-green-100 rounded-lg p-4">
              <IconCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800">
                <strong>Best price: Builders Warehouse — $4,360 on materials.</strong> Save $490 by ordering from this supplier.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="bg-brand-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-600 transition"
              >
                Generate my own BOQ
              </Link>
              <button
                onClick={() => setShowSample(false)}
                className="text-gray-500 hover:text-slate-700 px-4 py-3 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-700 text-white pt-16 pb-8 px-6">
        <div className="max-w-content mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">V</div>
              <h3 className="text-lg font-bold">VeriBuild</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Professional BOQs from floor plans, priced in real time from Zimbabwean hardware stores.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-gray-400">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#how-it-works" className="text-gray-300 hover:text-white transition">How It Works</a></li>
              <li><a href="#who" className="text-gray-300 hover:text-white transition">Who It&apos;s For</a></li>
              <li><a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a></li>
              <li><Link href="/about" className="text-gray-300 hover:text-white transition">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-gray-400">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition">Contact</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-white transition">FAQ</Link></li>
              <li><Link href="/privacy" className="text-gray-300 hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-300 hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-gray-400">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <IconMapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
                Harare, Zimbabwe
              </li>
              <li className="flex items-center gap-2">
                <IconMail className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <a href="mailto:info@veribuild.co.zw" className="hover:text-white transition">info@veribuild.co.zw</a>
              </li>
              <li className="flex items-center gap-2">
                <IconPhone className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <a href="tel:+263777803517" className="hover:text-white transition">+263 78 123 4567</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-content mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>© 2026 VeriBuild · A product of GatekeeperAI</p>
          <p>Proudly built in Zimbabwe</p>
        </div>
      </footer>
    </div>
  );
  }
