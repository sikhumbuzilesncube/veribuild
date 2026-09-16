// components/Header.jsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const navLinks = [
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#who', label: "Who It's For" },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? 'bg-white border-b border-gray-100 py-3'
            : 'bg-white/95 backdrop-blur py-4'
        }`}
      >
        <div className="max-w-content mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              V
            </div>
            <div className="leading-none">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-700">
                VeriBuild
              </h1>
              <p className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5 hidden sm:block">
                By GatekeeperAI
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-brand-500 transition text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side: CTA + mobile menu toggle */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/login"
              className="hidden sm:inline text-slate-700 hover:text-brand-500 transition font-medium text-sm"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-brand-500 text-white px-4 md:px-5 py-2 rounded-lg font-semibold hover:bg-brand-600 transition text-sm"
            >
              <span className="hidden sm:inline">Create Account</span>
              <span className="sm:hidden">Sign Up</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="md:hidden p-2 -mr-1 text-slate-700 hover:text-brand-500 transition"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="max-w-content mx-auto px-6 py-4 flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-base font-medium text-slate-700 hover:text-brand-500 transition border-b border-gray-50 last:border-b-0"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-base font-medium text-slate-700 hover:text-brand-500 transition border-b border-gray-50"
              >
                Log In
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Backdrop (only when menu is open on mobile) */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
    }
