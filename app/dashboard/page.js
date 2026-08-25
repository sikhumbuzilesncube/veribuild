'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    async function loadUser() {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch user data from users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (error) {
        console.error('Error loading user:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setUser(data);
        setUserName(data.full_name || 'User');
      }
      setLoading(false);
    }

    loadUser();
  }, [router]);

  // Demo projects (will be replaced with real projects later)
  const projects = [
    { id: 1, name: '3-Bedroom House', status: 'Completed', date: '2026-08-24', cost: 4850 },
    { id: 2, name: 'Office Renovation', status: 'Draft', date: '2026-08-20', cost: 2300 },
    { id: 3, name: 'Duplex Construction', status: 'Processing', date: '2026-08-15', cost: 12400 },
  ];

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
          <Link href="/profile" className="block py-2 px-4 hover:bg-[#F47B20]/20 rounded-lg transition font-medium">
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
            <p className="text-3xl font-bold text-[#2C3E50]">{projects.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Total BOQs</p>
            <p className="text-3xl font-bold text-[#2C3E50]">{projects.filter(p => p.status === 'Completed').length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Average Cost</p>
            <p className="text-3xl font-bold text-[#2C3E50]">${projects.reduce((sum, p) => sum + p.cost, 0) / projects.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Active Projects</p>
            <p className="text-3xl font-bold text-[#2C3E50]">{projects.filter(p => p.status !== 'Completed').length}</p>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Recent Projects</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-[#2C3E50]">{project.name}</td>
                    <td className="py-3 text-gray-600">{project.date}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        project.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
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
        </div>
      </div>
    </div>
  );
          }
