// components/Header.jsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur border-b border-gray-100 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-content mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            V
          </div>
          <div className="leading-none">
            <h1 className="text-xl font-bold tracking-tight text-slate-700">VeriBuild</h1>
            <p className="text-[9px] text-gray-400 tracking-widest uppercase mt-0.5">
              By GatekeeperAI
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="/#how-it-works" className="text-gray-600 hover:text-brand-500 transition text-sm font-medium">
            How It Works
          </a>
          <a href="/#who" className="text-gray-600 hover:text-brand-500 transition text-sm font-medium">
            Who It&apos;s For
          </a>
          <a href="/#pricing" className="text-gray-600 hover:text-brand-500 transition text-sm font-medium">
            Pricing
          </a>
          <Link href="/about" className="text-gray-600 hover:text-brand-500 transition text-sm font-medium">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:inline text-slate-700 hover:text-brand-500 transition font-medium text-sm"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="bg-brand-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-brand-600 transition text-sm"
          >
            Create Account
          </Link>
        </div>
      </div>
    </header>
  );
          }
