'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function JobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    trade_required: 'Builder',
    location: '',
    budget_estimate: '',
  });

  const trades = [
    'Builder', 'Carpenter', 'Electrician', 'Plumber', 
    'Painter', 'General Labourer', 'Supervisor', 
    'Tiler', 'Plasterer', 'Welder', 'Scaffolder', 'Glazier', 'Other'
  ];

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      console.log('📊 Session user:', session.user.id);

      // Fetch user's completed projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, project_name, status')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      setProjects(projectsData || []);

      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, projects(project_name)')
        .eq('client_id', session.user.id)
        .order('posted_date', { ascending: false });

      setJobs(jobsData || []);
      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProjectSelect = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    setFormData({ ...formData, project_id: projectId });
    
    const project = projects.find(p => p.id === parseInt(projectId));
    if (project) {
      setFormData(prev => ({
        ...prev,
        project_id: projectId,
        title: `${project.project_name} - Construction Job`,
        description: `Work needed for ${project.project_name}`,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        setMessage({ type: 'error', text: 'You must be logged in to post a job.' });
        setSubmitting(false);
        return;
      }

      const clientId = session.user.id;
      console.log('📊 Posting job with client_id:', clientId);

      // Insert job
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          project_id: parseInt(formData.project_id),
          client_id: clientId,
          title: formData.title,
          description: formData.description,
          trade_required: formData.trade_required,
          location: formData.location || null,
          budget_estimate: parseFloat(formData.budget_estimate) || null,
          status: 'open',
        })
        .select();

      if (error) {
        console.error('❌ Error:', error);
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: '✅ Job posted successfully!' });
        console.log('✅ Job created:', data);
        setShowForm(false);
        setFormData({
          project_id: '',
          title: '',
          description: '',
          trade_required: 'Builder',
          location: '',
          budget_estimate: '',
        });
        // Refresh jobs
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*, projects(project_name)')
          .eq('client_id', session.user.id)
          .order('posted_date', { ascending: false });
        setJobs(jobsData || []);
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    }
    setSubmitting(false);
  };

  const handleMatchWorkers = async (jobId) => {
    router.push(`/dashboard/jobs/${jobId}/match`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">📋 Jobs</h1>
            <p className="text-gray-600">Post jobs and find skilled workers</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
          >
            {showForm ? '✕ Cancel' : '+ Post a Job'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Post Job Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Post a New Job</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Project <span className="text-red-500">*</span>
                </label>
                <select
                  name="project_id"
                  value={selectedProject}
                  onChange={handleProjectSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select a completed project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    No completed projects yet. Generate a BOQ first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="e.g., Mason needed for 3-bedroom house"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="Describe the job details..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trade Required <span className="text-red-500">*</span>
                </label>
                <select
                  name="trade_required"
                  value={formData.trade_required}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  required
                >
                  {trades.map((trade) => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="e.g., Harare, Zimbabwe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Estimate (USD)
                </label>
                <input
                  type="number"
                  name="budget_estimate"
                  value={formData.budget_estimate}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="Enter estimated budget"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Job'}
              </button>
            </form>
          </div>
        )}

        {/* Jobs List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2C3E50] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Job</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Trade</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm font-medium text-[#2C3E50]">{job.title}</td>
                      <td className="px-4 py-3 text-sm">{job.projects?.project_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{job.trade_required}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'open' ? 'bg-green-100 text-green-700' :
                          job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          job.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(job.posted_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleMatchWorkers(job.id)}
                          className="text-[#F47B20] hover:underline text-sm font-medium"
                        >
                          Find Workers
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-500">No jobs posted yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-[#F47B20] hover:underline font-medium"
              >
                Post your first job →
              </button>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-[#2C3E50] transition">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
    }
