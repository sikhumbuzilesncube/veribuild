'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SampleBOQModal from '@/components/SampleBOQModal';
import {
  IconUpload,
  IconSparkle,
  IconDocument,
  IconShield,
  IconWifi,
  IconCheck,
} from '@/components/Icons';

export default function Home() {
  const [showSample, setShowSample] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-700">
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[88vh] md:min-h-screen flex items-center px-6 pt-32 pb-20 md:pt-36 md:pb-24 overflow-hidden">
        {/* Background photo */}
        <Image
          src="/hero.webp"
          alt="Zimbabwean construction site with a builder reviewing plans"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-slate-900/40" />

        {/* Content */}
        <div className="relative max-w-content mx-auto w-full">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
              Built for Zimbabwe
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold leading-[0.95] tracking-tighter text-white">
              BOQs in minutes.
              <br />
              Not <span className="text-brand-500">weeks</span>.
            </h1>

            <p className="text-lg md:text-xl text-gray-200 mt-8 max-w-2xl leading-relaxed">
              VeriBuild generates a professional BOQ from your floor plan in 3 minutes — with
              real material prices from Zimbabwean hardware stores and labour cost estimates.
            </p>

            <div className="flex flex-wrap gap-3 mt-10">
              <Link
                href="/register"
                className="bg-brand-500 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition shadow-lg shadow-brand-500/30"
              >
                Generate my first BOQ
              </Link>
              <button
                onClick={() => setShowSample(true)}
                className="bg-white/10 backdrop-blur border border-white/20 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition"
              >
                See a sample
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-12 pt-8 border-t border-white/15 text-sm text-gray-200">
              <div className="flex items-center gap-2">
                <IconShield className="w-4 h-4 text-brand-500" />
                <span>Payments via ContiPay</span>
              </div>
              <div className="flex items-center gap-2">
                <IconWifi className="w-4 h-4 text-brand-500" />
                <span>Works offline on low data</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-brand-500" />
                <span>Trusted across Zimbabwe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating BOQ card — bottom-right, desktop only */}
        <div className="hidden lg:block absolute bottom-16 right-8 xl:right-16 w-80 z-10">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  Sample BOQ
                </p>
                <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">
                  3-Bed House · Borrowdale
                </p>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                Live
              </span>
            </div>
            <div className="px-4 py-3 space-y-1 text-xs">
              {[
                ['A. Substructure', '$4,944.32'],
                ['B. Superstructure', '$9,474.93'],
                ['C. Roof', '$9,020.30'],
                ['D. Finishes', '$4,758.78'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500 truncate pr-2">{label}</span>
                  <span className="text-slate-700 font-semibold tabular-nums flex-shrink-0">
                    {value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-slate-700 font-semibold tabular-nums">$31,353.73</span>
              </div>
              <div className="flex justify-between pt-2 mt-1 border-t border-brand-500/20">
                <span className="font-bold text-slate-700">GRAND TOTAL</span>
                <span className="font-bold text-brand-500 tabular-nums">$32,921.42</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile BOQ card — shown only on small screens */}
        <div className="lg:hidden relative max-w-content mx-auto w-full mt-12 z-10">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  Sample BOQ
                </p>
                <p className="text-xs font-bold text-slate-700 mt-0.5 truncate">
                  3-Bed House · Borrowdale
                </p>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                Live
              </span>
            </div>
            <div className="px-4 py-3 space-y-1 text-xs">
              {[
                ['A. Substructure', '$4,944.32'],
                ['B. Superstructure', '$9,474.93'],
                ['C. Roof', '$9,020.30'],
                ['D. Finishes', '$4,758.78'],
                ['E. Services', '$1,100.00'],
                ['F. Labour', '$2,055.40'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500 truncate pr-2">{label}</span>
                  <span className="text-slate-700 font-semibold tabular-nums flex-shrink-0">
                    {value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-slate-700 font-semibold tabular-nums">$31,353.73</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contingency (5%)</span>
                <span className="text-slate-700 font-semibold tabular-nums">$1,567.69</span>
              </div>
              <div className="flex justify-between pt-2 mt-1 border-t border-brand-500/20">
                <span className="font-bold text-slate-700">GRAND TOTAL</span>
                <span className="font-bold text-brand-500 tabular-nums">$32,921.42</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHO IT'S FOR (LEAN STRIP) ===== */}
      <section id="who" className="py-12 md:py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-content mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex-shrink-0">
              Built for
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { letter: 'H', label: 'Homeowners', href: '/register' },
                { letter: 'S', label: 'Hardware Stores', href: '/hardware/register' },
                { letter: 'C', label: 'Construction Companies', href: '/construction/register' },
                { letter: 'W', label: 'Skilled Workers', href: '/workers/register' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group inline-flex items-center gap-3 text-slate-600 hover:text-brand-500 transition"
                >
                  <span className="w-8 h-8 rounded-md bg-white border border-gray-200 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white flex items-center justify-center font-bold text-xs text-slate-700 transition">
                    {item.letter}
                  </span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 bg-white">
        <div className="max-w-content mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-500 mb-3">
              How it works
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-700">
              Three steps. Three minutes.
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              No quantity surveyor required. No spreadsheets. Just your plan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                n: '01',
                icon: <IconUpload className="w-7 h-7" />,
                title: 'Upload your plan',
                body: 'PDF, JPEG, PNG, or a hand-drawn sketch. All common formats work.',
              },
              {
                n: '02',
                icon: <IconSparkle className="w-7 h-7" />,
                title: 'Yaka reads it',
                body: 'Rooms, dimensions, doors, windows, electrical points — extracted automatically.',
              },
              {
                n: '03',
                icon: <IconDocument className="w-7 h-7" />,
                title: 'Get your BOQ',
                body: 'Priced against live hardware stock. Compare suppliers. See labour costs.',
              },
            ].map((step) => (
              <div key={step.n} className="relative">
                <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white mb-6">
                  {step.icon}
                </div>
                <p className="text-xs font-bold text-brand-500 tracking-wider mb-2">
                  STEP {step.n}
                </p>
                <h3 className="text-xl font-bold mb-3 text-slate-700">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MEET YAKA ===== */}
      <section className="py-24 md:py-32 px-6 bg-slate-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />

        <div className="max-w-content mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-400 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                The BOQ engine
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.05]">
                Meet <span className="text-brand-500">Yaka</span>.
              </h2>
              <p className="text-lg md:text-xl text-gray-300 mt-6 leading-relaxed max-w-lg">
                Yaka is our BOQ engine. Built from real Zimbabwean construction data — material
                rates, labour patterns, hardware stock — so your estimate reflects how building
                actually works in Zimbabwe.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  ['Reads every detail', 'Rooms, dimensions, doors, windows, electrical points.'],
                  ['Prices against reality', 'Live rates from local hardware stores.'],
                  ['Knows Zimbabwean labour', 'Realistic gang-day costs for bricklayers, plumbers, and general labour.'],
                ].map(([title, body]) => (
                  <li key={title} className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
                      Y
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Yaka</p>
                      <p className="text-[10px] text-gray-400">BOQ Engine</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Analysing
                  </span>
                </div>
                <div className="py-4 space-y-3 text-sm">
                  {[
                    ['Detected 4 rooms', 'done'],
                    ['Measured wall area — 218m²', 'done'],
                    ['Counted 6 doors, 8 windows', 'done'],
                    ['Priced against 3 hardware stores', 'loading'],
                    ['Calculating labour costs', 'pending'],
                  ].map(([label, status]) => (
                    <div key={label} className="flex items-center gap-3">
                      {status === 'done' ? (
                        <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : status === 'loading' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0" />
                      )}
                      <span className={status === 'pending' ? 'text-gray-500' : 'text-gray-300'}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Estimated time</span>
                  <span className="text-xs font-bold text-brand-500">2 min 47 sec</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-24 md:py-32 px-6 bg-white">
        <div className="max-w-content mx-auto">
          <div className="max-w-2xl mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-500 mb-3">
              Why VeriBuild
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-700">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-x-12 gap-y-12">
            {[
              ['Real local prices', 'Live material costs from Zimbabwean hardware stores.'],
              ['Labour estimates', 'Realistic breakdown by trade, not just materials.'],
              ['Full BOQ structure', 'Substructure, superstructure, roof, finishes, services, labour.'],
              ['Works offline', 'Low-data mode. Generates even on a weak connection.'],
              ['Export anywhere', 'PDF, CSV. Share with lenders, suppliers, or your team.'],
              ['Built for Zimbabwe', 'Local suppliers, local rates, local context.'],
            ].map(([title, body], i) => (
              <div key={title}>
                <span className="text-xs font-bold text-brand-500 tracking-wider">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-bold mt-2 mb-2 text-slate-700">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIAL ===== */}
      <section className="py-24 md:py-32 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-500 mb-8">
            From our first users
          </span>
          <blockquote className="text-2xl md:text-3xl font-medium text-slate-700 leading-snug tracking-tight">
            &ldquo;Yaka gave me a full BOQ in under 5 minutes. My quantity surveyor quoted
            $450 and 3 weeks. Same numbers, fraction of the cost.&rdquo;
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
              TM
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-700">Tendai M.</p>
              <p className="text-sm text-gray-500">Homeowner · Borrowdale, Harare</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6 italic">
            Placeholder testimonial — replace with a real quote from a real user when available.
          </p>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-content mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ['3 min', 'Average BOQ time'],
            ['6', 'BOQ sections'],
            ['50+', 'Hardware partners'],
            ['100%', 'Zimbabwe-focused'],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-bold text-brand-500 tabular-nums">{stat}</p>
              <p className="text-sm text-gray-500 mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 md:py-32 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-500 mb-3">
              Pricing
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-700">
              One BOQ. One price.
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              No subscriptions. No hidden fees. Pay only when you generate.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-card">
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-2 p-8 md:p-10 bg-slate-700 text-white">
                <span className="inline-block bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                  Starting from
                </span>
                <div className="mt-6">
                  <p className="flex items-baseline">
                    <span className="text-6xl md:text-7xl font-bold text-brand-500 tracking-tighter">
                      $10
                    </span>
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

              <div className="md:col-span-3 p-8 md:p-10">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-5">
                  Every BOQ includes
                </p>
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Full BOQ — 6 sections</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Substructure, superstructure, roof, finishes, services, labour.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Local hardware pricing</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Live rates from multiple Zimbabwean hardware stores, side by side.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Labour cost breakdown</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        By trade — bricklaying, plumbing, electrical, general labour.
                      </p>
                    </div>
                  </li>
                </ul>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <IconCheck className="w-3.5 h-3.5 text-brand-500" />
                    PDF &amp; CSV exports
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IconCheck className="w-3.5 h-3.5 text-brand-500" />
                    Under 3 minutes
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
            Larger or commercial project?{' '}
            <Link href="/contact" className="text-brand-500 font-semibold hover:underline">
              Talk to us
            </Link>{' '}
            for a custom quote.
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 md:py-32 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-slate-700 leading-[1.05]">
            Price your build
            <br />
            in 3 minutes.
          </h2>
          <p className="text-gray-600 mt-6 text-lg">
            Upload a plan. Get a BOQ. Build with confidence.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            <Link
              href="/register"
              className="bg-brand-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-brand-600 transition shadow-card"
            >
              Create free account
            </Link>
            <Link
              href="/pricing"
              className="border border-gray-300 text-slate-700 px-8 py-4 rounded-xl font-semibold hover:border-slate-700 hover:bg-gray-50 transition"
            >
              See full pricing
            </Link>
          </div>
        </div>
      </section>

      <SampleBOQModal open={showSample} onClose={() => setShowSample(false)} />
      <Footer />
    </div>
  );
    }
