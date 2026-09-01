'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FAQPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const faqs = [
    {
      question: 'What is VeriBuild?',
      answer: 'VeriBuild is an AI-powered platform that generates professional Bills of Quantities (BOQs) from floor plans. It helps builders, contractors, and homeowners get accurate cost estimates in minutes.'
    },
    {
      question: 'How does VeriBuild work?',
      answer: 'Simply upload your floor plan (PDF, JPEG, or PNG), and our AI extracts all the information to generate a professional BOQ with material costs, supplier comparisons, and worker suggestions.'
    },
    {
      question: 'Is VeriBuild free to use?',
      answer: 'VeriBuild offers BOQ generation at affordable prices: $10 for Residential, $10 for Townhouse, and $30 for Commercial plans. Hardware stores, construction companies, and workers can subscribe monthly.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept PayNow, which supports EcoCash, OneMoney, and bank card payments.'
    },
    {
      question: 'Can I cancel my subscription?',
      answer: 'Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your current billing period.'
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach us via email at admin@gatekeeperai.co.zw or gatekeeperzw@gmail.com, or call us at +263 77 780 3517.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2C3E50] leading-tight">VeriBuild</h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">A product of GatekeeperAI</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">Home</Link>
            <Link href="/about" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">About</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">Pricing</Link>
            <Link href="/faq" className="text-[#F47B20] font-medium text-sm">FAQ</Link>
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
      <section className="pt-32 pb-12 px-6 bg-gradient-to-br from-white via-orange-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2C3E50] mb-6">
            Frequently Asked <span className="text-[#F47B20]">Questions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to the most common questions about VeriBuild.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#F47B20]/30 transition">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-[#2C3E50]">{faq.question}</span>
                <span className={`text-2xl text-[#F47B20] transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-gray-50 p-8 rounded-2xl border border-gray-200">
          <h3 className="font-bold text-[#2C3E50] mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-4">We're here to help. Contact us directly.</p>
          <Link
            href="/contact"
            className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
          >
            Contact Us
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
