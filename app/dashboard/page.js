'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

const TRIAL_LIMIT = 2;
const ADMIN_EMAIL = 'gatekeeperzw@gmail.com';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userType, setUserType] = useState('client');
  const [projects, setProjects] = useState([]);
  const [trialUsed, setTrialUsed] = useState(null);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    active: 0,
    averageCost: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const user = session.user;
      const metadata = user.user_metadata || {};
      const resolvedType = metadata.user_type || 'client';

      if (resolvedType === 'hardware') {
        router.replace('/dashboard/hardware');
        return;
      }

      setUserName(metadata.full_name || user.email || 'User');
      setUserEmail(user.email || '');
      setUserType(resolvedType);

      if (resolvedType === 'construction' || resolvedType === 'architect') {
        const table = resolvedType === 'construction'
          ? 'construction_companies'
          : 'architects';

        const { data: listingRow } = await supabase
          .from(table)
          .select('boqs_generated_count')
          .eq('user_id', user.id)
          .maybeSingle();

        if (listingRow) {
          setTrialUsed(listingRow.boqs_generated_count || 0);
        }
      }

      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        setLoading(false);
        return;
      }

      const formattedProjects = (projectsData || []).map((p) => ({
        id: p.id,
        name: p.project_name || 'Unnamed Project',
        status: p.status || 'draft',
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A',
        cost: p.total_cost || 0,
        plan_type: p.plan_type || 'residential',
      }));

      setProjects(formattedProjects);

      const totalProjects = formattedProjects.length;
      const completedProjects = formattedProjects.filter(
        (p) => p.status === 'completed' || p.status === 'Completed'
      ).length;
      const activeProjects = formattedProjects.filter(
        (p) =>
          p.status !== 'completed' &&
          p.status !== 'Completed' &&
          p.status !== 'draft'
      ).length;

      const completedCosts = formattedProjects
        .filter((p) => p.status === 'completed' || p.status === 'Completed')
        .map((p) => p.cost || 0);

      const totalCost = completedCosts.reduce((sum, cost) => sum + cost, 0);
      const averageCost =
        completedCosts.length > 0 ? Math.round(totalCost / completedCosts.length) : 0;

      setStats({
        total: totalProjects,
        completed: completedProjects,
        active: activeProjects,
        averageCost,
      });

      setLoading(false);
    }

    loadDashboardData();
  }, [router]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete project. Please try again.');
      setIsDeleting(false);
      return;
    }

    const originalProjects = [...projects];
    const updatedProjects = projects.filter((p) => p.id !== deleteTarget.id);
    setProjects(updatedProjects);

    const completed = updatedProjects.filter(p => p.status === 'completed' || p.status === 'Completed');
    const totalCost = completed.reduce((sum, p) => sum + (p.cost || 0), 0);
    setStats({
      total: updatedProjects.length,
      completed: completed.length,
      active: updatedProjects.filter(p => p.status !== 'completed' && p.status !== 'Completed' && p.status !== 'draft').length,
      averageCost: completed.length > 0 ? Math.round(totalCost / completed.length) : 0,
    });

    setDeleteTarget(null);
    setIsDeleting(false);
  };

  function getStatusColor(status) {
    const s = status?.toLowerCase() || '';
    if (s === 'completed') return 'bg-green-100 text-green-700';
    if (s === 'processing') return 'bg-blue-100 text-blue-700';
    if (s === 'draft') return 'bg-yellow-100 text-yellow-700';
    if (s === 'failed') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isClient = userType === 'client';
  const isAdmin = userEmail === ADMIN_EMAIL;
  const showTrialCard =
    (userType === 'construction' || userType === 'architect') && trialUsed != null;
  const trialRemaining = showTrialCard
    ? Math.max(0, TRIAL_LIMIT - trialUsed)
    : 0;

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <Sidebar />

        <div className="md:ml-64 p-4 md:p-6">
          
          {/* Mobile Welcome Greeting */}
          <div className="md:hidden mb-4">
            <h1 className="text-2xl font-bold text-slate-700">Hello, {userName.split(' ')[0]}</h1>
            <p className="text-gray-500 text-sm">What are we building today?</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-700">Dashboard</h1>
              <p className="text-gray-600 text-sm md:text-base">
                Welcome back, {userName}!
              </p>
              <p className="text-xs md:text-sm text-gray-400">{userEmail}</p>
              {userType === 'construction' && (
                <p className="text-xs md:text-sm text-green-600 font-semibold">
                  Construction Company Account
                </p>
              )}
              {userType === 'worker' && (
                <p className="text-xs md:text-sm text-purple-600 font-semibold">
                  Worker Account
                </p>
              )}
              {userType === 'architect' && (
                <p className="text-xs md:text-sm text-indigo-600 font-semibold">
                  Architect Account
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Link
                href="/dashboard/new-project"
                className="bg-brand-500 text-white px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-brand-600 transition shadow-lg shadow-orange-200 text-sm md:text-base text-center"
              >
                + New BOQ
              </Link>
              <Link
                href="/dashboard/template"
                className="border-2 border-brand-500 text-brand-500 px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-brand-500 hover:text-white transition text-sm md:text-base text-center"
              >
                BOQ Without a Plan
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/admin-portal"
                  className="bg-slate-700 text-white px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-slate-800 transition shadow-lg shadow-gray-400 text-sm md:text-base text-center"
                >
                  Admin Portal
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar (Mobile Only) */}
          <div className="md:hidden mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="Search hardware, workers, architects..."
                onClick={() => router.push('/dashboard/find')}
                readOnly
              />
            </div>
          </div>

          {showTrialCard && (
            <div className="bg-slate-700 rounded-xl p-5 mb-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-1">
                    Free trial BOQs: {trialRemaining} of {TRIAL_LIMIT} remaining
                  </h2>
                  {trialRemaining > 0 ? (
                    <p className="text-sm text-gray-200">
                      You can generate {trialRemaining} more BOQ{trialRemaining === 1 ? '' : 's'} free of charge.
                      After that, each BOQ costs $10 with a plan or $5 without a plan.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-200">
                      Your 2 free trial BOQs have been used. Each new BOQ costs $10 with a plan
                      or $5 without a plan.
                    </p>
                  )}
                </div>
                {trialRemaining > 0 && (
                  <div className="bg-brand-500 rounded-full w-14 h-14 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">{trialRemaining}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs md:text-sm">Total Projects</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-700">{stats.total}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs md:text-sm">Completed BOQs</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-700">{stats.completed}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs md:text-sm">Average Cost</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-700">
                ${stats.averageCost}
              </p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs md:text-sm">Active Projects</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-700">{stats.active}</p>
            </div>
          </div>

          {/* Orange CTA Banner (Replaces old Find Providers text) */}
          {isClient && (
            <div className="mb-6 md:mb-8">
              <div 
                className="bg-brand-500 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:bg-brand-600 transition"
                onClick={() => router.push('/dashboard/find')}
              >
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Need a professional?</h3>
                  <p className="text-brand-100 text-sm max-w-[200px]">Find hardware stores, contractors, and skilled workers near you.</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Swipeable Category Cards (Mobile) / Grid (Desktop) */}
          {isClient && (
            <div className="mb-6 md:mb-8">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-slate-700">Browse Directory</h2>
                <Link href="/dashboard/find" className="text-brand-500 text-sm font-semibold">See all</Link>
              </div>
              
              <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar md:grid md:grid-cols-4 md:overflow-visible">
                <button
                  onClick={() => router.push('/dashboard/find?category=hardware')}
                  className="min-w-[140px] snap-start bg-white border border-gray-100 rounded-xl p-4 text-left hover:shadow-md hover:border-brand-500 transition"
                >
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div className="font-bold text-slate-700 mb-1 text-sm">Hardware</div>
                  <div className="text-xs text-gray-500">Supplies</div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/find?category=construction')}
                  className="min-w-[140px] snap-start bg-white border border-gray-100 rounded-xl p-4 text-left hover:shadow-md hover:border-brand-500 transition"
                >
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div className="font-bold text-slate-700 mb-1 text-sm">Construction</div>
                  <div className="text-xs text-gray-500">Builders</div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/find?category=architects')}
                  className="min-w-[140px] snap-start bg-white border border-gray-100 rounded-xl p-4 text-left hover:shadow-md hover:border-brand-500 transition"
                >
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  </div>
                  <div className="font-bold text-slate-700 mb-1 text-sm">Architects</div>
                  <div className="text-xs text-gray-500">Plans</div>
                </button>

                <button
                  onClick={() => router.push('/dashboard/find?category=workers')}
                  className="min-w-[140px] snap-start bg-white border border-gray-100 rounded-xl p-4 text-left hover:shadow-md hover:border-brand-500 transition"
                >
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="font-bold text-slate-700 mb-1 text-sm">Workers</div>
                  <div className="text-xs text-gray-500">Labour</div>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-bold text-slate-700 mb-4">
              Recent Projects
            </h2>
            {projects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm md:text-base">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs md:text-sm border-b">
                      <th className="pb-2">Project</th>
                      <th className="pb-2 hidden sm:table-cell">Type</th>
                      <th className="pb-2 hidden md:table-cell">Date</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.slice(0, 10).map((project) => (
                      <tr key={project.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-slate-700 text-sm">
                          {project.name}
                        </td>
                        <td className="py-3 text-xs text-gray-500 capitalize hidden sm:table-cell">
                          {project.plan_type}
                        </td>
                        <td className="py-3 text-xs text-gray-600 hidden md:table-cell">
                          {project.date}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-slate-700 text-sm">
                          ${project.cost}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/dashboard/boq/${project.id}`}
                              className="text-brand-500 hover:underline text-sm font-medium"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(project)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-4 text-gray-300">[ ]</div>
                <p className="text-gray-500">No projects yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Upload a plan or use the template to get started.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                  <Link
                    href="/dashboard/new-project"
                    className="bg-brand-500 text-white px-6 py-2 rounded-lg hover:bg-brand-600 transition"
                  >
                    Upload a Plan
                  </Link>
                  <Link
                    href="/dashboard/template"
                    className="border-2 border-brand-500 text-brand-500 px-6 py-2 rounded-lg hover:bg-brand-500 hover:text-white transition"
                  >
                    Start from a Template
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refined Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/70 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700">Delete Project</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 text-sm"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
    }
