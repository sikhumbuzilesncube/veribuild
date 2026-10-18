'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SIDEBAR_ITEMS = {
  client: [
    { label: 'Dashboard',           href: '/dashboard' },
    { label: 'New BOQ',             href: '/dashboard/new-project' },
    { label: 'BOQ Without a Plan',  href: '/dashboard/template' },
    { label: 'Find Providers',      href: '/dashboard/find' },
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
    { label: 'New BOQ',             href: '/dashboard/new-project' },
    { label: 'BOQ Without a Plan',  href: '/dashboard/template' },
    { label: 'My Projects',         href: '/dashboard/projects' },
    { label: 'My Profile',          href: '/dashboard/workers' },
    { label: 'Urgent Jobs',         href: '/dashboard/workers/urgent-jobs', showUrgentBadge: true },
    { label: 'Subscription',        href: '/dashboard/subscription?category=worker' },
    { label: 'Settings',            href: '/dashboard/settings' },
  ],
};

const URGENCY_WINDOWS = {
  asap: 48,
  today: 24,
  this_week: 168,
};

function isExpired(job) {
  if (!job || job.status !== 'open') return false;
  const hours = URGENCY_WINDOWS[job.urgency] || 24;
  const created = new Date(job.created_at).getTime();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return created < cutoff;
}

function isActive(currentPath, href) {
  if (href === '/dashboard') {
    return currentPath === '/dashboard';
  }
  const base = href.split('?')[0];
  return currentPath.startsWith(base);
}

function HamburgerIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userType, setUserType] = useState('client');
  const [loading, setLoading] = useState(true);
  const [urgentCount, setUrgentCount] = useState(0);
  const [myWorkerId, setMyWorkerId] = useState(null);
  const [myTrade, setMyTrade] = useState(null);
  const [myCityId, setMyCityId] = useState(null);

  useEffect(() => {
    async function loadUserType() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const metadata = session.user.user_metadata || {};
      const type = metadata.user_type || 'client';
      const resolvedType = type in SIDEBAR_ITEMS ? type : 'client';
      setUserType(resolvedType);

      if (resolvedType === 'worker') {
        const { data: workerRow } = await supabase
          .from('workers')
          .select('id, trade, city_id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (workerRow && workerRow.trade && workerRow.city_id) {
          setMyWorkerId(workerRow.id);
          setMyTrade(workerRow.trade);
          setMyCityId(workerRow.city_id);

          const { data: jobsData } = await supabase
            .from('job_requests')
            .select('id, urgency, created_at, status')
            .eq('status', 'open')
            .eq('trade', workerRow.trade)
            .eq('city_id', workerRow.city_id);

          const live = (jobsData || []).filter((j) => !isExpired(j));
          setUrgentCount(live.length);
        }
      }

      setLoading(false);
    }
    loadUserType();
  }, []);

  useEffect(() => {
    if (!myTrade || !myCityId) return;

    const channel = supabase
      .channel('sidebar-urgent-jobs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_requests' },
        (payload) => {
          const job = payload.new;
          if (
            job &&
            job.status === 'open' &&
            job.trade === myTrade &&
            job.city_id === myCityId &&
            !isExpired(job)
          ) {
            setUrgentCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'job_requests' },
        (payload) => {
          const job = payload.new;
          const old = payload.old;
          if (!job) return;

          if (
            old &&
            old.status === 'open' &&
            job.status !== 'open' &&
            job.trade === myTrade &&
            job.city_id === myCityId
          ) {
            setUrgentCount((prev) => Math.max(0, prev - 1));
          }

          if (
            old &&
            old.status !== 'open' &&
            job.status === 'open' &&
            job.trade === myTrade &&
            job.city_id === myCityId &&
            !isExpired(job)
          ) {
            setUrgentCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myTrade, myCityId]);

  const items = SIDEBAR_ITEMS[userType] || SIDEBAR_ITEMS.client;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return null;
  }

  const renderLabel = (item) => {
    const showBadge = item.showUrgentBadge && urgentCount > 0;
    return (
      <span className="flex items-center justify-between">
        <span>{item.label}</span>
        {showBadge && (
          <span className="ml-2 bg-[#F47B20] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
            {urgentCount}
          </span>
        )}
      </span>
    );
  };

  return (
    <>
      <div className="md:hidden bg-[#2C3E50] text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <h1 className="text-lg font-bold">VeriBuild</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white focus:outline-none"
          aria-label="Toggle menu"
        >
          <HamburgerIcon />
        </button>
      </div>

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
                    active ? 'bg-[#F47B20]' : 'hover:bg-[#F47B20]/20'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {renderLabel(item)}
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
                  active ? 'bg-[#F47B20]' : 'hover:bg-[#F47B20]/20'
                }`}
              >
                {renderLabel(item)}
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
