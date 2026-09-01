'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function PricingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const plans = [
    {
      name: 'Residential',
      price: '$10',
      period: 'per BOQ',
      description: 'Perfect for homeowners and small projects',
      features: [
        'Full BOQ Generation',
        'Supplier Price Comparison',
        'Worker Suggestions',
        '3 Exports (PDF/Excel/CSV)',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Townhouse',
      price: '$10',
      period: 'per BOQ',
      description: 'Ideal for medium-sized residential projects',
      features: [
        'Full BOQ Generation',
        'Supplier Price Comparison',
        'Worker Suggestions',
        '3 Exports (PDF/Excel/CSV)',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Commercial',
      price: '$30',
      period: 'per BOQ',
      description: 'For large-scale commercial projects',
      features: [
        'Full BOQ Generation',
        'Supplier Price Comparison',
        'Worker Suggestions',
        'Unlimited Exports',
        'Multi-Story Support',
        'Priority Processing',
      ],
      cta: 'Get Started',
      popular: false,
    },
  ];

  const subscriptions = [
    {
      name: 'Hardware Store',
      price: '$15',
      period: '/month',
      description: 'List your prices and get customers',
      features: [
        'List your prices on the platform',
        'Get customer leads',
        'Monthly analytics',
        'Priority support',
      ],
      cta: 'Register Now',
      icon: '🏪',
    },
    {
      name: 'Construction Company',
      price: '$15',
      period: '/month',
      description: 'Advertise on every BOQ',
      features: [
        'Your ad appears on every BOQ',
        'Get customer leads directly',
        'Build brand awareness',
        'Priority support',
      ],
      cta: 'Register Now',
      icon: '🏗️',
    },
    {
      name: 'Skilled Worker',
      price: '$5',
      period: '/month',
      description: 'Get hired by clients',
      features: [
        'Clients see your profile',
        'Get reviews and ratings',
        'More job opportunities',
        'Priority support',
      ],
      cta: 'Register Now',
      icon: '🔧',
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
            Pay only for what you need. No hidden fees.
          </p>
        </div>
      </section>

      {/* BOQ Plans */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#2C3E50] mb-4">BOQ Plans</h2>
          <p className="text-center text-gray-600 mb-12">Choose the plan that fits your project</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div key={index} className={`border rounded-2xl p-8 text-center hover:shadow-xl transition ${
                plan.popular ? 'border-2 border-[#F47B20] shadow-xl shadow-orange-100' : 'border-gray-200'
              }`}>
                {plan.popular && (
                  <span className="inline-block bg-[#F47B20] text-white px-4 py-1 rounded-full text-xs font-bold uppercase mb-4">
                    Popular
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
                  href="/register"
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
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#2C3E50] mb-4">Subscription Plans</h2>
          <p className="text-center text-gray-600 mb-12">For businesses and workers</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {subscriptions.map((plan, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-xl transition">
                <div className="text-4xl mb-4">{plan.icon}</div>
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
                  href={`/${plan.name.toLowerCase().replace(' ', '')}/register`}
                  className="block mt-8 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition"
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 mb-8">Have questions? We're here to help.</p>
          
          <div className="space-y-4 text-left">
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-[#2C3E50]">How does BOQ generation work?</h4>
              <p className="text-sm text-gray-500 mt-1">Upload your floor plan, and our AI extracts all the data to generate a professional BOQ in minutes.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-[#2C3E50]">Can I cancel my subscription anytime?</h4>
              <p className="text-sm text-gray-500 mt-1">Yes, you can cancel anytime. Your subscription will remain active until the end of the billing period.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-[#2C3E50]">What payment methods do you accept?</h4>
              <p className="text-sm text-gray-500 mt-1">We accept PayNow (EcoCash, OneMoney, and bank cards).</p>
            </div>
          </div>
          
          <Link
            href="/faq"
            className="inline-block mt-8 text-[#F47B20] hover:underline font-medium"
          >
            View All FAQs →
          </Link>
        </div>
      </section>

      {/* Footer */}
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
              <li><Link href="/" className="hover:text-white transition">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition">About</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>🇿🇼 Zimbabwe</li>
              <li>📧 admin@gatekeeperai.co.zw</li>
              <li>📞 +263 77 780 3157</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
      }
