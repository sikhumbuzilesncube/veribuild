'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SUBSCRIPTION_CATEGORIES, composePlanType } from '@/lib/subscriptions';

export default function PricingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // The two BOQ options we actually have in the system
  const boqPlans = [
    {
      name: 'BOQ Without a Plan',
      price: '$5',
      period: 'per BOQ',
      description: 'Pick a standard house type and generate a BOQ instantly.',
      features: [
        'Full BOQ Generation',
        'Standard house designs',
        'Supplier Price Comparison',
        'Worker Suggestions',
        'PDF & CSV Exports',
      ],
      cta: 'Start a Template BOQ',
      href: '/register',
      popular: false,
    },
    {
      name: 'BOQ With Plan',
      price: '$10',
      period: 'per BOQ',
      description: 'Upload your own floor plan and get an exact cost breakdown.',
      features: [
        'Full BOQ Generation',
        'AI reads your custom plan',
        'Supplier Price Comparison',
        'Worker Suggestions',
        'PDF & CSV Exports',
      ],
      cta: 'Upload a Plan',
      href: '/register',
      popular: true,
    },
  ];

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
            <Link href="/about" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">About</Link>
            <Link href="/pricing" className="text-[#F47B20] font-medium text-sm">Pricing</Link>
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
            Simple, <span className="text-[#F47B20]">Transparent</span> Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pay per BOQ or subscribe for premium visibility. No hidden fees.
          </p>
        </div>
      </section>

      {/* BOQ Plans */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#2C3E50] mb-4">BOQ Generation</h2>
          <p className="text-center text-gray-600 mb-12">Pay only when you generate a BOQ</p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {boqPlans.map((plan, index) => (
              <div key={index} className={`border rounded-2xl p-8 text-center hover:shadow-xl transition ${
                plan.popular ? 'border-2 border-[#F47B20] shadow-xl shadow-orange-100 relative' : 'border-gray-200'
              }`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F47B20] text-white px-4 py-1 rounded-full text-xs font-bold uppercase whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-[#2C3E50]">{plan.name}</h3>
                <p className="text-4xl font-bold text-[#F47B20] my-4">{plan.price}</p>
                <p className="text-gray-600 text-sm">{plan.period}</p>
                <p className="text-sm text-gray-500 my-4">{plan.description}</p>
                <ul className="mt-6 space-y-3 text-left text-sm text-gray-600">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#F47B20] font-bold mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="block mt-8 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition"
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#2C3E50] mb-4">Subscription Plans</h2>
          <p className="text-center text-gray-600 mb-12">For businesses, professionals, and workers</p>
          
          <div className="space-y-12">
            {SUBSCRIPTION_CATEGORIES.map((cat) => (
              <div key={cat.key}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded bg-[#2C3E50] flex items-center justify-center text-white font-bold text-sm">
                    {cat.label.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2C3E50]">{cat.label}</h3>
                    <p className="text-xs text-gray-500">{cat.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {cat.plans.map((plan) => (
                    <div key={plan.key} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:border-[#F47B20] hover:shadow-md transition">
                      <h4 className="text-base font-bold text-[#2C3E50]">{plan.label}</h4>
                      <p className="text-3xl font-bold text-[#F47B20] mt-2">${plan.priceUsd}</p>
                      <p className="text-xs text-gray-500 mb-4">per month</p>
                      
                      <ul className="space-y-2 text-sm text-gray-600 flex-1 mb-6">
                        {plan.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#F47B20] font-bold mt-0.5">✓</span>
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Link
                        href="/register"
                        className={`block text-center py-2.5 rounded-lg font-semibold transition ${
                          plan.placement === 'boq' 
                            ? 'bg-[#F47B20] text-white hover:bg-[#E06B10]' 
                            : 'bg-white border-2 border-[#F47B20] text-[#F47B20] hover:bg-orange-50'
                        }`}
                      >
                        Register Now
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-6">Secure payments powered by</p>
          
          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
            {/* Paynow Logo Mockup */}
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-3 shadow-sm flex items-center justify-center min-w-[120px]">
              <span className="text-[#004B87] font-extrabold italic tracking-tighter text-xl leading-none">paynow</span>
            </div>
            
            {/* EcoCash Logo Mockup */}
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-3 shadow-sm flex items-center justify-center min-w-[120px]">
              <span className="text-[#0054A6] font-bold text-lg leading-none">Eco<span className="text-[#F47B20]">Cash</span></span>
            </div>

            {/* Visa Logo Mockup */}
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-3 shadow-sm flex items-center justify-center min-w-[120px]">
              <span className="text-[#1A1F71] font-extrabold italic text-xl leading-none tracking-tight">VISA</span>
            </div>

            {/* Mastercard Logo Mockup */}
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-3 shadow-sm flex items-center justify-center min-w-[120px]">
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-[#EB001B] rounded-full"></div>
                <div className="w-5 h-5 bg-[#F79E1B] rounded-full -ml-2 mix-blend-multiply"></div>
                <span className="text-[10px] text-gray-500 font-medium ml-1 leading-none mt-1">mastercard</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400">Pay securely with local mobile money or international cards.</p>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 mb-8">Have questions? We're here to help.</p>
          
          <div className="space-y-4 text-left">
            <div className="border border-gray-200 bg-white rounded-xl p-4">
              <h4 className="font-bold text-[#2C3E50]">How does BOQ generation work?</h4>
              <p className="text-sm text-gray-500 mt-1">Upload your floor plan, and our AI extracts all the data to generate a professional BOQ in minutes. If you don't have a plan, you can pick a standard house template.</p>
            </div>
            <div className="border border-gray-200 bg-white rounded-xl p-4">
              <h4 className="font-bold text-[#2C3E50]">Can I cancel my subscription anytime?</h4>
              <p className="text-sm text-gray-500 mt-1">Yes, you can cancel anytime. Your subscription will remain active until the end of the 30-day billing period.</p>
            </div>
            <div className="border border-gray-200 bg-white rounded-xl p-4">
              <h4 className="font-bold text-[#2C3E50]">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-500 mt-1">We accept PayNow (EcoCash, OneMoney, ZimSwitch, Telecash, Visa, and Mastercard).</p>
            </div>
          </div>
          
          <Link
            href="/faq"
            className="inline-block mt-8 text-[#F47B20] hover:underline font-medium"
          >
            View All FAQs
          </Link>
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
              <li>Zimbabwe</li>
              <li>admin@gatekeeperai.co.zw</li>
              <li>gatekeeperzw@gmail.com</li>
              <li>+263 77 780 3517</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
    }
