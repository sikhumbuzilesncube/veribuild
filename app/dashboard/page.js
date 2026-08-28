'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userType, setUserType] = useState('client');
  const [projects, setProjects] = useState([]);
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
      
      setUserName(metadata.full_name || user.email || 'User');
      setUserEmail(user.email || '');
      setUserType(metadata.user_type || 'client');

      // Fetch projects
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

      const formattedProjects = (projectsData || []).map(p => ({
        id: p.id,
        name: p.project_name || 'Unnamed Project',
        status: p.status || 'draft',
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A',
        cost: p.total_cost || 0,
        plan_type: p.plan_type || 'residential',
      }));

      setProjects(formattedProjects);

      const totalProjects = formattedProjects.length;
      const completedProjects = formattedProjects.filter(p => p.status === 'completed' || p.status === 'Completed').length;
      const activeProjects = formattedProjects.filter(p => p.status !== 'completed' && p.status !== 'Completed' && p.status !== 'draft').length;
      
      const completedCosts = formattedProjects
        .filter(p => p.status === 'completed' || p.status === 'Completed')
        .map(p => p.cost || 0);
      
      const totalCost = completedCosts.reduce((sum, cost) => sum + cost, 0);
      const averageCost = completedCosts.length > 0 ? Math.round(totalCost / completedCosts.length) : 0;

      setStats({
        total: totalProjects,
        completed: completedProjects,
        active: activeProjects,
        averageCost: averageCost,
      });

      setLoading(false);
    }

    loadDashboardData();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#2C3E50] text-white p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#F47B20] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <h1 className="text-xl font-bold">VeriBuild</h1>
        </div>

        <nav className="space-y-2">
          <Link href="/dashboard" className="block py-2 px-4 bg-[#F47B20] rounded-lg font-medium">
            🏠 Dashboard
          </Link>
          <Link href="/dashboard/new-project" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
            📤 New BOQ
          </Link>
          <Link href="/dashboard/projects" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
            📋 My Projects
          </Link>
          <Link href="/dashboard/hardware" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
            🏪 Hardware Dashboard
          </Link>
          <Link href="/dashboard/settings" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
            ⚙️ Settings
          </Link>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="block w-full text-left py-2 px-4 hover:bg-red-500/20 rounded-lg transition font-medium mt-8 text-red-300"
          >
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E50]">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {userName}!</p>
            <p className="text-sm text-gray-400">{userEmail}</p>
            {userType === 'hardware' && (
              <p className="text-sm text-blue-600 font-semibold">🏪 Hardware Store Account</p>
            )}
          </div>
          <Link
            href="/dashboard/new-project"
            className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition shadow-lg shadow-orange-200"
          >
            + New BOQ
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Total Projects</p>
            <p className="text-3xl font-bold text-[#2C3E50]">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Completed BOQs</p>
            <p className="text-3xl font-bold text-[#2C3E50]">{stats.completed}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Average Cost</p>
            <p className="text-3xl font-bold text-[#2C3E50]">${stats.averageCost}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Active Projects</p>
            <p className="text-3xl font-bold text-[#2C3E50]">{stats.active}</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Recent Projects</h2>
          {projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-2">Project</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 10).map((project) => (
                    <tr key={project.id} className="border-b last:border-0">
                      <td className="py-3 font-medium text-[#2C3E50]">{project.name}</td>
                      <td className="py-3 text-sm text-gray-500 capitalize">{project.plan_type}</td>
                      <td className="py-3 text-gray-600">{project.date}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-[#2C3E50]">${project.cost}</td>
                      <td className="py-3">
                        <Link href={`/dashboard/boq/${project.id}`} className="text-[#F47B20] hover:underline text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-500">No projects yet</p>
              <Link
                href="/dashboard/new-project"
                className="inline-block mt-4 bg-[#F47B20] text-white px-6 py-2 rounded-lg hover:bg-[#E06B10] transition"
              >
                Create Your First BOQ →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
          }
