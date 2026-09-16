'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TermsPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-sm py-3 border-b border-gray-100' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-content mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
            <div className="leading-none">
              <h1 className="text-xl font-bold text-slate-700 tracking-tight">VeriBuild</h1>
              <p className="text-[9px] text-gray-400 tracking-widest uppercase mt-0.5">By GatekeeperAI</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:inline text-slate-700 hover:text-brand-500 transition font-medium text-sm">Log In</Link>
            <Link href="/register" className="bg-brand-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-brand-600 transition text-sm">Create Account</Link>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-16 px-6 max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-500 mb-2">Legal</p>
          <h1 className="text-4xl font-bold text-slate-700 tracking-tight">Terms &amp; Conditions</h1>
          <p className="text-gray-500 mt-3">Last updated: September 2026</p>
        </div>

        <div className="space-y-10 text-gray-700 leading-relaxed">
          {/* Intro */}
          <div>
            <p className="text-lg">
              Welcome to VeriBuild. These terms explain how our platform works, what you can expect
              from us, and what we ask of you in return. We&apos;ve tried to write them in plain
              language — if anything is unclear, reach out at <a href="mailto:admin@gatekeeperai.co.zw" className="text-brand-500 hover:underline">admin@gatekeeperai.co.zw</a>.
            </p>
          </div>

          {/* 1. What VeriBuild is */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">1. What VeriBuild does</h2>
            <p>
              VeriBuild is a construction planning platform built for Zimbabwe. We analyse floor
              plans and generate Bills of Quantities (BOQs) with real material prices from local
              hardware stores and realistic labour cost estimates. We also connect you with hardware
              stores, construction companies, and skilled workers across the country.
            </p>
            <p className="mt-3">
              Our goal is simple: give you accurate, affordable visibility into your build cost
              before you break ground.
            </p>
          </div>

          {/* 2. Accepting these terms */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">2. Accepting these terms</h2>
            <p>
              By creating an account or using VeriBuild, you agree to these terms. If you don&apos;t
              agree, please don&apos;t use the platform.
            </p>
          </div>

          {/* 3. BOQ estimates — the key section, rewritten */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">3. BOQ estimates</h2>
            <p>
              VeriBuild generates professional planning estimates by analysing your floor plan and
              current market data. Most users find our BOQs accurate enough for budgeting, supplier
              comparison, and project planning.
            </p>
            <p className="mt-3">
              That said, construction costs vary — site conditions, material availability, design
              changes, and labour market shifts can all affect final numbers. So the following
              applies:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>BOQs are professional planning estimates, not fixed quotations or contracts.</li>
              <li>Final material and labour costs are agreed between you and your chosen suppliers and contractors.</li>
              <li>For contractual use, bank financing, or regulatory submission, we recommend having a certified quantity surveyor review and sign off on the BOQ. This is standard practice for any professional estimate and may be required by lenders or regulators.</li>
            </ul>
            <p className="mt-3">
              VeriBuild is not liable for decisions made solely on the basis of a generated BOQ
              without the appropriate professional review where required.
            </p>
          </div>

          {/* 4. Hardware stores */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">4. Hardware stores on VeriBuild</h2>
            <p>
              Hardware stores listed on VeriBuild are independent Zimbabwean businesses. They set
              their own prices and manage their own stock. VeriBuild displays their listings to help
              you compare and choose, but we do not control their pricing, availability, or quality.
            </p>
            <p className="mt-3">
              When you place an order with a hardware store, your agreement is directly with that
              store.
            </p>
          </div>

          {/* 5. Construction companies */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">5. Construction companies on VeriBuild</h2>
            <p>
              Construction companies listed on VeriBuild are independent contractors. They manage
              their own teams, timelines, and quality of work. VeriBuild lists them as an
              advertising and discovery service so you can find companies operating in your area.
            </p>
            <p className="mt-3">
              Work scope, timelines, quality, and payment terms are agreed directly between you and
              the company. We encourage both parties to have a written agreement before work starts.
            </p>
          </div>

          {/* 6. Skilled workers */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">6. Skilled workers on VeriBuild</h2>
            <p>
              Skilled workers on VeriBuild — bricklayers, plumbers, electricians, carpenters, and
              others — are independent contractors, not VeriBuild employees. We help you find them
              and see their profile, but your working relationship with them is separate from us.
            </p>
            <p className="mt-3">
              As with any contractor relationship, agree on scope, rates, and timelines in writing
              before work begins.
            </p>
          </div>

          {/* 7. Accounts */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">7. Your account</h2>
            <p>
              To use most of VeriBuild, you need an account. Keep your login credentials secure —
              you&apos;re responsible for activity on your account.
            </p>
            <p className="mt-3">
              We may suspend accounts that violate these terms or are used for fraudulent activity.
            </p>
          </div>

          {/* 8. Payments */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">8. Payments</h2>
            <p>
              BOQ generation starts at <strong>$10</strong>. Final pricing depends on plan size and
              complexity — you&apos;ll see the exact price before you pay.
            </p>
            <p className="mt-3">
              Subscription plans for hardware stores, construction companies, and skilled workers
              are billed monthly. Current pricing is shown on our <Link href="/pricing" className="text-brand-500 hover:underline">Pricing page</Link>.
            </p>
            <p className="mt-3">
              All payments are processed securely through ContiPay.
            </p>
          </div>

          {/* 9. Cancellation & refunds */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">9. Cancellation &amp; refunds</h2>
            <p>
              You can cancel a subscription at any time from your dashboard. Refunds are available
              within 14 days of purchase for unused services.
            </p>
            <p className="mt-3">
              For refund requests, email <a href="mailto:admin@gatekeeperai.co.zw" className="text-brand-500 hover:underline">admin@gatekeeperai.co.zw</a>.
            </p>
          </div>

          {/* 10. Intellectual property */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">10. Content and intellectual property</h2>
            <p>
              The VeriBuild platform, brand, code, and design are the property of GatekeeperAI.
              Floor plans you upload remain yours — we use them only to generate your BOQ.
            </p>
          </div>

          {/* 11. Limitation of liability */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">11. Limitation of liability</h2>
            <p>
              VeriBuild provides a professional planning tool and a marketplace that connects users
              with independent suppliers, contractors, and workers. We work hard to keep the platform
              accurate and useful, but:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>We are not a party to agreements between you and any supplier, contractor, or worker.</li>
              <li>We are not liable for disputes, damages, or losses arising from those agreements.</li>
              <li>Our total liability for any claim related to VeriBuild&apos;s own services is limited to the amount you paid us in the 3 months before the claim.</li>
            </ul>
            <p className="mt-3">
              Nothing in these terms limits any rights you have under Zimbabwean consumer protection law.
            </p>
          </div>

          {/* 12. Changes to terms */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">12. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. When we do, we&apos;ll update the date at
              the top. Continued use of VeriBuild after a change means you accept the updated terms.
            </p>
          </div>

          {/* 13. Governing law */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">13. Governing law</h2>
            <p>
              These terms are governed by the laws of Zimbabwe. Any disputes are subject to the
              jurisdiction of Zimbabwean courts.
            </p>
          </div>

          {/* 14. Contact */}
          <div>
            <h2 className="text-xl font-bold text-slate-700 mb-3">14. Contact us</h2>
            <p>
              Questions about these terms? Reach us at:
            </p>
            <ul className="mt-3 space-y-1">
              <li><strong>Email:</strong> <a href="mailto:admin@gatekeeperai.co.zw" className="text-brand-500 hover:underline">admin@gatekeeperai.co.zw</a></li>
              <li><strong>Phone:</strong> +263 77 780 3517</li>
              <li><strong>Location:</strong> Harare, Zimbabwe</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/" className="text-brand-500 hover:underline font-medium">← Back to home</Link>
        </div>
      </section>

      <footer className="bg-slate-700 text-white py-8 px-6 text-center text-sm text-gray-400">
        <p>© 2026 VeriBuild · A product of GatekeeperAI</p>
      </footer>
    </div>
  );
}
