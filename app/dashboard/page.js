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
  
  // New state for the custom delete modal
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

    // Delete from database
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

    // Update UI
    const originalProjects = [...projects];
    const updatedProjects = projects.filter((p) => p.id !== deleteTarget.id);
    setProjects(updatedProjects);

    // Recalculate stats
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
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <div className="md:ml-64 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#2C3E50]">Dashboard</h1>
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
                className="bg-[#F47B20] text-white px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition shadow-lg shadow-orange-200 text-sm md:text-base text-center"
              >
                + New BOQ
              </Link>
              <Link
                href="/dashboard/template"
                className="border-2 border-[#F47B20] text-[#F47B20] px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-[#F47B20] hover:text-white transition text-sm md:text-base text-center"
              >
                BOQ Without a Plan
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard/admin-portal"
                  className="bg-[#2C3E50] text-white px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-[#1a252f] transition shadow-lg shadow-gray-400 text-sm md:text-base text-center"
                >
                  Admin Portal
                </Link>
              )}
            </div>
          </div>

          {showTrialCard && (
            <div className="bg-[#2C3E50] rounded-xl p-5 mb-6 text-white">
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
                  <div className="bg-[#F47B20] rounded-full w-14 h-14 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">{trialRemaining}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs md:text-sm">Total Projects</p>
              <p className="text-2xl md:text-3xl font-bold text-[#2C3E50]">{stats.total}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs md:text-sm">Completed BOQs</p>
              <p className="text-2xl md:text-3xl font-bold text-[#2C3E50]">{stats.completed}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs md:text-sm">Average Cost</p>
              <p className="text-2xl md:text-3xl font-bold text-[#2C3E50]">
                ${stats.averageCost}
              </p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs md:text-sm">Active Projects</p>
              <p className="text-2xl md:text-3xl font-bold text-[#2C3E50]">{stats.active}</p>
            </div>
          </div>

          {isClient && (
            <div className="mb-6 md:mb-8">
              <h2 className="text-base md:text-lg font-bold text-[#2C3E50] mb-3">
                Find Providers
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mb-3">
                Browse hardware stores, construction companies, architects, and
                skilled workers across Zimbabwe.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => router.push('/dashboard/find?category=hardware')}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md hover:border-[#F47B20] transition"
                >
                  <div className="font-bold text-[#2C3E50] mb-1 text-sm md:text-base">
                    Hardware Stores
                  </div>
                  <div className="text-xs text-gray-500">
                    Building supplies and materials
                  </div>
                </button>
                <button
                  onClick={() => router.push('/dashboard/find?category=construction')}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md hover:border-[#F47B20] transition"
                >
                  <div className="font-bold text-[#2C3E50] mb-1 text-sm md:text-base">
                    Construction
                  </div>
                  <div className="text-xs text-gray-500">
                    Builders and contractors
                  </div>
                </button>
                <button
                  onClick={() => router.push('/dashboard/find?category=architects')}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md hover:border-[#F47B20] transition"
                >
                  <div className="font-bold text-[#2C3E50] mb-1 text-sm md:text-base">
                    Architects
                  </div>
                  <div className="text-xs text-gray-500">
                    Plans and drawings
                  </div>
                </button>
                <button
                  onClick={() => router.push('/dashboard/find?category=workers')}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md hover:border-[#F47B20] transition"
                >
                  <div className="font-bold text-[#2C3E50] mb-1 text-sm md:text-base">
                    Skilled Workers
                  </div>
                  <div className="text-xs text-gray-500">
                    Trades and labour
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-bold text-[#2C3E50] mb-4">
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
                        <td className="py-3 font-medium text-[#2C3E50] text-sm">
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
                        <td className="py-3 font-bold text-[#2C3E50] text-sm">
                          ${project.cost}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/dashboard/boq/${project.id}`}
                              className="text-[#F47B20] hover:underline text-sm font-medium"
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
                    className="bg-[#F47B20] text-white px-6 py-2 rounded-lg hover:bg-[#E06B10] transition"
                  >
                    Upload a Plan
                  </Link>
                  <Link
                    href="/dashboard/template"
                    className="border-2 border-[#F47B20] text-[#F47B20] px-6 py-2 rounded-lg hover:bg-[#F47B20] hover:text-white transition"
                  >
                    Start from a Template
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2C3E50] mb-2">Delete Project?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
    }
