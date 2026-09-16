// components/Footer.jsx
import Link from 'next/link';
import { IconMapPin, IconMail, IconPhone } from '@/components/Icons';

export default function Footer() {
  return (
    <footer className="bg-slate-700 text-white pt-16 pb-8 px-6">
      <div className="max-w-content mx-auto grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              V
            </div>
            <h3 className="text-lg font-bold">VeriBuild</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Professional BOQs from floor plans, priced in real time from Zimbabwean hardware stores.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-gray-400">
            Platform
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="/#how-it-works" className="text-gray-300 hover:text-white transition">
                How It Works
              </a>
            </li>
            <li>
              <a href="/#who" className="text-gray-300 hover:text-white transition">
                Who It&apos;s For
              </a>
            </li>
            <li>
              <a href="/#pricing" className="text-gray-300 hover:text-white transition">
                Pricing
              </a>
            </li>
            <li>
              <Link href="/about" className="text-gray-300 hover:text-white transition">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-gray-400">
            Support
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/contact" className="text-gray-300 hover:text-white transition">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-gray-300 hover:text-white transition">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-gray-300 hover:text-white transition">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-gray-300 hover:text-white transition">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-gray-400">
            Contact
          </h4>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <IconMapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
              Harare, Zimbabwe
            </li>
            <li className="flex items-center gap-2">
              <IconMail className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <a href="mailto:info@veribuild.co.zw" className="hover:text-white transition">
                info@veribuild.co.zw
              </a>
            </li>
            <li className="flex items-center gap-2">
              <IconPhone className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <a href="tel:+263777803517" className="hover:text-white transition">
                +263 77 780 3157
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-content mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
        <p>© 2026 VeriBuild · A product of GatekeeperAI</p>
        <p>Proudly built in Zimbabwe</p>
      </div>
    </footer>
  );
      }
