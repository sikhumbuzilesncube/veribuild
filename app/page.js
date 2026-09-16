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
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 px-6 bg-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />

        <div className="max-w-content mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-brand-500/10 text-brand-500 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                Built for Zimbabwe
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.05] tracking-tight text-slate-700">
                Know your build cost <span className="text-brand-500">before</span> you break ground.
              </h1>
              <p className="text-lg text-gray-600 mt-6 max-w-lg leading-relaxed">
                Upload your floor plan. In three minutes, get a professional BOQ with real material
                prices from Zimbabwean hardware stores, plus labour cost estimates.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href="/register"
                  className="bg-brand-500 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition shadow-card"
                >
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
                  <span>
                    Payments via <strong className="font-semibold">ContiPay</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <IconWifi className="w-4 h-4 text-brand-500" />
                  <span>Works offline on low data</span>
                </div>
              </div>
            </div>

            <div className="relative pb-8 md:pb-0">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-card-hover">
                <Image
                  src="/hero.webp"
                  alt="Zimbabwean construction site with a builder reviewing plans"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              </div>

              <div className="absolute -bottom-2 md:-bottom-6 -left-2 md:-left-8 right-16 md:right-8 bg-white rounded-xl shadow-card-hover border border-gray-100 overflow-hidden">
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
                <div className="px-4 py-3 space-y-1.5 text-xs">
                  {[
                    ['Foundation excavation', '$249.48'],
                    ['Concrete mix (20MPa)', '$1,349.46'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500 truncate pr-2">{label}</span>
                      <span className="text-slate-700 font-semibold tabular-nums flex-shrink-0">
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 mt-1 border-t border-brand-500/20">
                    <span className="font-bold text-slate-700">Total</span>
                    <span className="font-bold text-brand-500 tabular-nums">$29,286</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHO IT'S FOR ===== */}
      <section id="who" className="py-16 md:py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-content mx-auto">
          <div className="max-w-2xl mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-700">
              Built for everyone in the build.
            </h2>
            <p className="text-gray-600 mt-3 text-base md:text-lg">
              One platform, four account types — each with tools made for the job.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
            {[
              { letter: 'H', title: 'Homeowner', desc: 'Planning a build or renovation', href: '/register' },
              { letter: 'S', title: 'Hardware Store', desc: 'List prices, reach more builders', href: '/hardware/register' },
              { letter: 'C', title: 'Construction Co.', desc: 'Get featured on client BOQs', href: '/construction/register' },
              { letter: 'W', title: 'Skilled Worker', desc: 'Get matched to real jobs', href: '/workers/register' },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-center gap-4 bg-white rounded-xl p-4 md:p-5 border border-gray-200 hover:border-brand-500 hover:shadow-card-hover transition"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-brand-500 flex items-center justify-center text-slate-700 group-hover:text-white transition font-bold text-lg flex-shrink-0">
                  {item.letter}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-700 group-hover:text-brand-500 transition text-base">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-snug">{item.desc}</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 bg-white">
        <div className="max-w-content mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-500 mb-3">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-700">
              From floor plan to full BOQ in 3 minutes.
            </h2>
            <p className="text-gray-600 mt-3 text-lg">
              No quantity surveyor required. No spreadsheets. Just your plan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                n: '01',
                icon: <IconUpload className="w-7 h-7" />,
                title: 'Upload your plan',
                body: 'Drop in a PDF, JPEG, or PNG. Hand-drawn sketches and scanned plans work too.',
              },
              {
                n: '02',
                icon: <IconSparkle className="w-7 h-7" />,
                title: 'We read every detail',
                body: 'Rooms, dimensions, doors, windows, electrical points — extracted automatically.',
              },
              {
                n: '03',
                icon: <IconDocument className="w-7 h-7" />,
                title: 'Get your BOQ',
                body: 'Priced against live local hardware stock. Compare suppliers. See labour costs. Build.',
              },
            ].map((step, i) => (
              <div
                key={step.n}
                className="relative bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 border-t-2 border-dashed border-brand-500/30" />
                )}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-brand-500 flex items-center justify-center text-white flex-shrink-0">
                    {step.icon}
                  </div>
                  <span className="text-4xl font-bold text-brand-500/20 tabular-nums leading-none">
                    {step.n}
                  </span>
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
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-700">
              Simple, honest pricing.
            </h2>
            <p className="text-gray-600 mt-3 text-lg">
              Pay per BOQ. No subscriptions. No hidden fees.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-card">
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-2 p-8 md:p-10 bg-slate-700 text-white">
                <span className="inline-block bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                  Ordinary Plan
                </span>
                <div className="mt-6">
                  <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
                    Starting from
                  </p>
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

              <div className="md:col-span-3 p-8 md:p-10">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-5">
                  Every BOQ includes
                </p>
                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Full BOQ from your floor plan</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Every material, quantified and listed.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Material cost comparison</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Live prices from multiple local hardware stores, side by side. See where you save.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <IconCheck className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700">Labour cost estimates</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Realistic labour breakdown by trade — so your budget reflects the whole build,
                        not just materials.
                      </p>
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
            Larger or commercial project?{' '}
            <Link href="/contact" className="text-brand-500 font-semibold hover:underline">
              Talk to us
            </Link>{' '}
            for a custom quote.
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 md:py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-700">
            Ready to price your build?
          </h2>
          <p className="text-gray-600 mt-4 text-lg">
            Upload a plan. Get a BOQ. Build with confidence.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link
              href="/register"
              className="bg-brand-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition shadow-card"
            >
              Create free account
            </Link>
            <Link
              href="/pricing"
              className="border border-gray-300 text-slate-700 px-8 py-3.5 rounded-xl font-semibold hover:border-slate-700 hover:bg-gray-50 transition"
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
