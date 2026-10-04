'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ------------------------------------------------------------
// Sidebar items per role
// ------------------------------------------------------------
const SIDEBAR_ITEMS = {
  client: [
    { label: 'Dashboard',           href: '/dashboard' },
    { label: 'New BOQ',             href: '/dashboard/new-project' },
    { label: 'BOQ Without a Plan',  href: '/dashboard/template' },
    { label: 'Jobs',                href: '/dashboard/jobs' },
    { label: 'My Projects',         href: '/dashboard/projects' },
    { label: 'Settings',            href: '/dashboard/settings' },
  ],
  construction: [
    { label: 'Dashboard',           href: '/dashboard' },
    { label: 'New BOQ',             href: '/dashboard/new-project' },
    { label: 'BOQ Without a Plan',  href: '/dashboard/template' },
    { label: 'My Projects',         href: '/dashboard/projects' },
    { label: 'My Company',          href: '/dashboard/construction' },
    { label: 'Subscription',        href: '/dashboard/subscription?category=construction' },
    { label: 'Settings',            href: '/dashboard/settings' },
  ],
  architect: [
    { label: 'Dashboard',           href: '/dashboard' },
    { label: 'New BOQ',             href: '/dashboard/new-project' },
    { label: 'BOQ Without a Plan',  href: '/dashboard/template' },
    { label: 'My Projects',         href: '/dashboard/projects' },
    { label: 'My Firm',             href: '/dashboard/architects' },
    { label: 'Subscription',        href: '/dashboard/subscription?category=architect' },
    { label: 'Settings',            href: '/dashboard/settings' },
  ],
  hardware: [
    { label: 'Dashboard',           href: '/dashboard' },
    { label: 'My Store',            href: '/dashboard/hardware' },
    { label: 'My Products',         href: '/dashboard/hardware/products' },
    { label: 'Subscription',        href: '/dashboard/subscription?category=hardware' },
    { label: 'Settings',            href: '/dashboard/settings' },
  ],
  worker: [
    { label: 'Dashboard',           href: '/dashboard' },
    { label: 'My Profile',          href: '/dashboard/workers' },
    { label: 'Subscription',        href: '/dashboard/subscription?category=worker' },
    { label: 'Settings',            href: '/dashboard/settings' },
  ],
};

// ------------------------------------------------------------
// Which URL prefix identifies the active page
// ------------------------------------------------------------
function isActive(currentPath, href) {
  if (href === '/dashboard') {
    return currentPath === '/dashboard';
  }
  const base = href.split('?')[0];
  return currentPath.startsWith(base);
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userType, setUserType] = useState('client');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserType() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const metadata = session.user.user_metadata || {};
      const type = metadata.user_type || 'client';
      setUserType(type in SIDEBAR_ITEMS ? type : 'client');
      setLoading(false);
    }
    loadUserType();
  }, []);

  const items = SIDEBAR_ITEMS[userType] || SIDEBAR_ITEMS.client;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden bg-[#2C3E50] text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <h1 className="text-lg font-bold">VeriBuild</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white text-3xl focus:outline-none"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#2C3E50] text-white p-4 border-t border-[#F47B20]/30">
          <nav className="space-y-3">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block py-3 px-4 rounded-lg transition font-medium ${
                    active
                      ? 'bg-[#F47B20]'
                      : 'hover:bg-[#F47B20]/20'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="block w-full text-left py-3 px-4 hover:bg-red-500/20 rounded-lg transition font-medium mt-4 text-red-300"
            >
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#2C3E50] text-white p-6 hidden md:block overflow-y-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <h1 className="text-xl font-bold">VeriBuild</h1>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2.5 px-4 rounded-lg transition font-medium text-sm ${
                  active
                    ? 'bg-[#F47B20]'
                    : 'hover:bg-[#F47B20]/20'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="block w-full text-left py-2.5 px-4 hover:bg-red-500/20 rounded-lg transition font-medium text-sm mt-4 text-red-300"
          >
            Logout
          </button>
        </nav>
      </div>
    </>
  );
    }
