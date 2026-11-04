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

// Icon Components
const HomeIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-brand-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const SearchIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-brand-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const FolderIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-brand-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);
const UserIcon = ({ active }) => (
  <svg className={`w-6 h-6 ${active ? 'text-brand-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const DocumentIcon = () => (
  <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const TemplateIcon = () => (
  <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userType, setUserType] = useState('client');
  const [loading, setLoading] = useState(true);
  const [urgentCount, setUrgentCount] = useState(0);
  const [myWorkerId, setMyWorkerId] = useState(null);
  const [myTrade, setMyTrade] = useState(null);
  const [myCityId, setMyCityId] = useState(null);
  
  // State for the FAB popup
  const [isFabOpen, setIsFabOpen] = useState(false);

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_requests' }, (payload) => {
          const job = payload.new;
          if (job && job.status === 'open' && job.trade === myTrade && job.city_id === myCityId && !isExpired(job)) {
            setUrgentCount((prev) => prev + 1);
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'job_requests' }, (payload) => {
          const job = payload.new;
          const old = payload.old;
          if (!job) return;
          if (old && old.status === 'open' && job.status !== 'open' && job.trade === myTrade && job.city_id === myCityId) {
            setUrgentCount((prev) => Math.max(0, prev - 1));
          }
          if (old && old.status !== 'open' && job.status === 'open' && job.trade === myTrade && job.city_id === myCityId && !isExpired(job)) {
            setUrgentCount((prev) => prev + 1);
          }
      })
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
          <span className="ml-2 bg-brand-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
            {urgentCount}
          </span>
        )}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white text-slate-700 p-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <h1 className="text-lg font-bold text-slate-700">VeriBuild</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/settings" className="text-gray-500 hover:text-brand-500">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Nav (Fixed) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-40 pb-safe">
        <div className="flex justify-between items-center h-16 px-2 relative">
          
          {/* Left 2 Items */}
          <Link href="/dashboard" className="flex flex-col items-center justify-center w-16 h-full space-y-1">
            <HomeIcon active={isActive(pathname, '/dashboard')} />
            <span className={`text-[10px] font-medium ${isActive(pathname, '/dashboard') ? 'text-brand-500' : 'text-gray-400'}`}>Home</span>
          </Link>
          <Link href="/dashboard/find" className="flex flex-col items-center justify-center w-16 h-full space-y-1">
            <SearchIcon active={isActive(pathname, '/dashboard/find')} />
            <span className={`text-[10px] font-medium ${isActive(pathname, '/dashboard/find') ? 'text-brand-500' : 'text-gray-400'}`}>Find</span>
          </Link>

          {/* Center FAB (New BOQ) */}
          <div className="relative w-16 h-full flex justify-center">
            <button 
              onClick={() => setIsFabOpen(true)}
              className="absolute -top-5 w-14 h-14 bg-brand-500 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/40 ring-4 ring-white hover:bg-brand-600 transition"
              aria-label="Create New BOQ"
            >
              <PlusIcon />
            </button>
            <span className="absolute bottom-2 text-[10px] font-medium text-gray-400">New BOQ</span>
          </div>

          {/* Right 2 Items */}
          <Link href="/dashboard/projects" className="flex flex-col items-center justify-center w-16 h-full space-y-1">
            <FolderIcon active={isActive(pathname, '/dashboard/projects')} />
            <span className={`text-[10px] font-medium ${isActive(pathname, '/dashboard/projects') ? 'text-brand-500' : 'text-gray-400'}`}>Projects</span>
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center justify-center w-16 h-full space-y-1">
            <UserIcon active={isActive(pathname, '/dashboard/settings')} />
            <span className={`text-[10px] font-medium ${isActive(pathname, '/dashboard/settings') ? 'text-brand-500' : 'text-gray-400'}`}>Profile</span>
          </Link>
        </div>
      </div>

      {/* FAB Popup Modal */}
      {isFabOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFabOpen(false)}>
          <div 
            className="bg-white w-full max-w-sm rounded-3xl p-5 mb-16 sm:mb-0 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">Create BOQ</h3>
              <button onClick={() => setIsFabOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => { setIsFabOpen(false); router.push('/dashboard/new-project'); }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-2xl hover:border-brand-500 hover:bg-brand-50 transition text-left"
              >
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                  <DocumentIcon />
                </div>
                <div>
                  <p className="font-bold text-slate-800">BOQ with a Plan</p>
                  <p className="text-xs text-gray-500 mt-0.5">Upload a PDF or image of your floor plan</p>
                </div>
              </button>

              <button 
                onClick={() => { setIsFabOpen(false); router.push('/dashboard/template'); }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-2xl hover:border-brand-500 hover:bg-brand-50 transition text-left"
              >
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                  <TemplateIcon />
                </div>
                <div>
                  <p className="font-bold text-slate-800">BOQ Without a Plan</p>
                  <p className="text-xs text-gray-500 mt-0.5">Generate an estimate from a house template</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Unchanged) */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-700 text-white p-6 hidden md:block overflow-y-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
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
                  active ? 'bg-brand-500' : 'hover:bg-brand-500/20'
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
