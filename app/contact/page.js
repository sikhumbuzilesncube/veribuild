'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would send an email
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

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
            <Link href="/pricing" className="text-gray-600 hover:text-[#F47B20] transition text-sm font-medium">Pricing</Link>
            <Link href="/contact" className="text-[#F47B20] font-medium text-sm">Contact</Link>
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
            Get in <span className="text-[#F47B20]">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-4">Contact Information</h2>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-[#2C3E50] font-medium">info@veribuild.co.zw</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-[#2C3E50] font-medium">+263 78 123 4567</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-[#2C3E50] font-medium">Harare, Zimbabwe</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Working Hours</p>
                <p className="text-[#2C3E50] font-medium">Monday - Friday: 8:00 AM - 5:00 PM</p>
              </div>
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-700">Message Sent!</h3>
                <p className="text-green-600 mt-2">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                    placeholder="I need help with..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                    placeholder="Your message..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
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
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>🇿🇼 Zimbabwe</li>
              <li>📧 admin@gatekeeperai.co.zw</li>
              <li>📞 +263 77 780 3517</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
                 }
