'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadProjects() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        setLoading(false);
        return;
      }

      const formatted = (projectsData || []).map(p => ({
        id: p.id,
        name: p.project_name || 'Unnamed Project',
        status: p.status || 'draft',
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A',
        cost: p.total_cost || 0,
        plan_type: p.plan_type || 'residential',
        floor_area: p.floor_area || 0,
        rooms: p.rooms || 0,
        doors: p.doors || 0,
        windows: p.windows || 0,
      }));

      setProjects(formatted);
      setLoading(false);
    }

    loadProjects();
  }, [router]);

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status.toLowerCase() === filter);

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
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">📋 My Projects</h1>
            <p className="text-gray-600">Manage all your BOQ projects</p>
          </div>
          <Link
            href="/dashboard/new-project"
            className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
          >
            + New BOQ
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all' ? 'bg-[#2C3E50] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('processing')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'draft' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Draft
          </button>
        </div>

        {projects.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2C3E50] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Rooms</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Area</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-[#2C3E50]">{project.name}</td>
                      <td className="px-4 py-3 text-sm capitalize">{project.plan_type}</td>
                      <td className="px-4 py-3 text-sm">{project.rooms}</td>
                      <td className="px-4 py-3 text-sm">{project.floor_area}m²</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project.date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#2C3E50]">${project.cost}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/boq/${project.id}`}
                          className="text-[#F47B20] hover:underline text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">No Projects Yet</h2>
            <p className="text-gray-500 mb-6">Upload your first floor plan to generate a BOQ</p>
            <Link
              href="/dashboard/new-project"
              className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
            >
              📤 Create Your First BOQ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
