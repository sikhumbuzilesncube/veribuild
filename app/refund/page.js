'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RefundPage() {
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
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[#2C3E50] hover:text-[#F47B20] transition font-medium text-sm">Log In</Link>
            <Link href="/register" className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition shadow-lg shadow-orange-200 text-sm">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-12 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-[#2C3E50] mb-8">Refund Policy</h1>
        <div className="space-y-6 text-gray-600 leading-relaxed">
          <p><strong>Last Updated:</strong> September 2026</p>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">1. Refund Eligibility</h2>
            <p>VeriBuild offers refunds for:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li>Duplicate payments</li>
              <li>Subscriptions canceled within 14 days of purchase</li>
              <li>Technical issues preventing service delivery</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">2. Non-Refundable Items</h2>
            <p>The following are non-refundable:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li>BOQs that have been generated and downloaded</li>
              <li>Subscriptions that have been active for more than 14 days</li>
              <li>Payments made more than 30 days ago</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">3. How to Request a Refund</h2>
            <p>To request a refund, email us at:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 ml-4">
              <li>admin@gatekeeperai.co.zw</li>
              <li>gatekeeperzw@gmail.com</li>
            </ul>
            <p className="mt-2">Please include your registered email, payment reference, and reason for refund.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">4. Processing Time</h2>
            <p>Refund requests are processed within 5-7 business days. Funds will be returned to the original payment method.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#2C3E50] mb-3">5. Contact</h2>
            <p>Email: admin@gatekeeperai.co.zw or gatekeeperzw@gmail.com<br />Phone: +263 77 780 3517</p>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-500">
            <p>This refund policy is subject to change. Please check this page periodically for updates.</p>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-[#F47B20] hover:underline">← Back to Home</Link>
        </div>
      </section>

      <footer className="bg-[#2C3E50] text-white py-8 px-6 text-center text-sm text-gray-400">
        <p>© 2026 VeriBuild. A product of GatekeeperAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
