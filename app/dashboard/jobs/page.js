'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CITIES } from '@/lib/cities';

const PROJECT_TRADES = [
  'Builder', 'Carpenter', 'Electrician', 'Plumber',
  'Painter', 'General Labourer', 'Supervisor',
  'Tiler', 'Plasterer', 'Welder', 'Scaffolder', 'Glazier', 'Other',
];

const URGENT_TRADES = [
  'Mason', 'Carpenter', 'Plumber', 'Electrician', 'Tiler',
  'Painter', 'Roofer', 'Welder', 'Steel fixer',
  'General labourer', 'Site supervisor', 'Other',
];

const URGENCY_OPTIONS = [
  { value: 'asap', label: 'ASAP', hours: 48 },
  { value: 'today', label: 'Today', hours: 24 },
  { value: 'this_week', label: 'This Week', hours: 168 },
];

function getUrgencyHours(urgency) {
  const opt = URGENCY_OPTIONS.find((o) => o.value === urgency);
  return opt ? opt.hours : 24;
}

function getUrgencyLabel(urgency) {
  const opt = URGENCY_OPTIONS.find((o) => o.value === urgency);
  return opt ? opt.label : urgency;
}

function getUrgencyBadgeClass(urgency) {
  if (urgency === 'asap') return 'bg-red-100 text-red-700';
  if (urgency === 'today') return 'bg-orange-100 text-orange-700';
  return 'bg-gray-100 text-gray-700';
}

function getStatusBadgeClass(status) {
  if (status === 'open') return 'bg-green-100 text-green-700';
  if (status === 'claimed') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
}

function isExpired(job) {
  if (!job || job.status !== 'open') return false;
  const hours = getUrgencyHours(job.urgency);
  const created = new Date(job.created_at).getTime();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return created < cutoff;
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function toWhatsAppNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  cleaned = cleaned.replace(/^\+/, '');
  if (cleaned.startsWith('0')) {
    cleaned = '263' + cleaned.slice(1);
  }
  return cleaned;
}

export default function JobsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('project');
  const [userId, setUserId] = useState(null);
  const [metadata, setMetadata] = useState({});

  // Project jobs state
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectMessage, setProjectMessage] = useState(null);

  const [projectForm, setProjectForm] = useState({
    project_id: '',
    title: '',
    description: '',
    trade_required: 'Builder',
    location: '',
    budget_estimate: '',
  });

  // Urgent jobs state
  const [urgentJobs, setUrgentJobs] = useState([]);
  const [showUrgentForm, setShowUrgentForm] = useState(false);
  const [urgentSubmitting, setUrgentSubmitting] = useState(false);
  const [urgentMessage, setUrgentMessage] = useState(null);

  const [urgentForm, setUrgentForm] = useState({
    trade: 'Plumber',
    description: '',
    city_id: '1',
    location: '',
    urgency: 'today',
    contact_phone: '',
  });

  const loadProjectJobs = useCallback(async (uid) => {
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*, projects(project_name)')
      .eq('client_id', uid)
      .order('posted_date', { ascending: false });
    setJobs(jobsData || []);
  }, []);

  const loadUrgentJobs = useCallback(async (uid) => {
    const { data } = await supabase
      .from('job_requests')
      .select('*')
      .eq('client_user_id', uid)
      .order('created_at', { ascending: false });
    setUrgentJobs(data || []);
  }, []);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUserId(session.user.id);
      const meta = session.user.user_metadata || {};
      setMetadata(meta);

      setUrgentForm((prev) => ({
        ...prev,
        contact_phone: meta.phone || '',
      }));

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, project_name, status')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      setProjects(projectsData || []);

      await Promise.all([
        loadProjectJobs(session.user.id),
        loadUrgentJobs(session.user.id),
      ]);

      setLoading(false);
    }
    loadData();
  }, [router, loadProjectJobs, loadUrgentJobs]);

  // ============ PROJECT JOBS HANDLERS ============

  const handleProjectChange = (e) => {
    setProjectForm({ ...projectForm, [e.target.name]: e.target.value });
  };

  const handleProjectSelect = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    const project = projects.find((p) => p.id === parseInt(projectId));
    if (project) {
      setProjectForm((prev) => ({
        ...prev,
        project_id: projectId,
        title: `${project.project_name} - Construction Job`,
        description: `Work needed for ${project.project_name}`,
      }));
    } else {
      setProjectForm((prev) => ({ ...prev, project_id: projectId }));
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setProjectSubmitting(true);
    setProjectMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setProjectMessage({ type: 'error', text: 'You must be logged in to post a job.' });
        setProjectSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('jobs')
        .insert({
          project_id: parseInt(projectForm.project_id),
          client_id: session.user.id,
          title: projectForm.title,
          description: projectForm.description,
          trade_required: projectForm.trade_required,
          location: projectForm.location || null,
          budget_estimate: parseFloat(projectForm.budget_estimate) || null,
          status: 'open',
        });

      if (error) {
        setProjectMessage({ type: 'error', text: error.message });
      } else {
        setProjectMessage({ type: 'success', text: 'Job posted successfully.' });
        setShowProjectForm(false);
        setProjectForm({
          project_id: '',
          title: '',
          description: '',
          trade_required: 'Builder',
          location: '',
          budget_estimate: '',
        });
        setSelectedProject('');
        await loadProjectJobs(session.user.id);
      }
    } catch (err) {
      setProjectMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    }
    setProjectSubmitting(false);
  };

  const handleMatchWorkers = (jobId) => {
    router.push(`/dashboard/jobs/${jobId}/match`);
  };

  // ============ URGENT JOBS HANDLERS ============

  const handleUrgentChange = (e) => {
    setUrgentForm({ ...urgentForm, [e.target.name]: e.target.value });
  };

  const handleUrgentSubmit = async (e) => {
    e.preventDefault();
    setUrgentSubmitting(true);
    setUrgentMessage(null);

    if (!urgentForm.description.trim()) {
      setUrgentMessage({ type: 'error', text: 'Please describe the job.' });
      setUrgentSubmitting(false);
      return;
    }

    if (!urgentForm.contact_phone.trim()) {
      setUrgentMessage({ type: 'error', text: 'A contact phone number is required so the worker can reach you.' });
      setUrgentSubmitting(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUrgentMessage({ type: 'error', text: 'You must be logged in to post a job.' });
        setUrgentSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('job_requests')
        .insert({
          client_user_id: session.user.id,
          trade: urgentForm.trade,
          description: urgentForm.description.trim(),
          city_id: parseInt(urgentForm.city_id, 10) || 1,
          location: urgentForm.location.trim() || null,
          urgency: urgentForm.urgency,
          contact_phone: urgentForm.contact_phone.trim(),
          status: 'open',
        });

      if (error) {
        setUrgentMessage({ type: 'error', text: error.message });
      } else {
        setUrgentMessage({ type: 'success', text: 'Urgent job posted. Workers in your trade and city will see it.' });
        setShowUrgentForm(false);
        setUrgentForm({
          trade: 'Plumber',
          description: '',
          city_id: '1',
          location: '',
          urgency: 'today',
          contact_phone: metadata.phone || '',
        });
        await loadUrgentJobs(session.user.id);
      }
    } catch (err) {
      setUrgentMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    }
    setUrgentSubmitting(false);
  };

  const handleCancelUrgent = async (jobId) => {
    if (!confirm('Cancel this urgent job? Workers will no longer see it.')) return;

    const { error } = await supabase
      .from('job_requests')
      .update({ status: 'cancelled' })
      .eq('id', jobId);

    if (error) {
      setUrgentMessage({ type: 'error', text: `Could not cancel: ${error.message}` });
      return;
    }

    if (userId) await loadUrgentJobs(userId);
  };

  // ============ RENDER ============

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

  const visibleUrgent = urgentJobs.filter((j) => !isExpired(j) || j.status !== 'open');
  const openUrgentCount = urgentJobs.filter((j) => j.status === 'open' && !isExpired(j)).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">Jobs</h1>
            <p className="text-gray-600">Post jobs and find skilled workers</p>
          </div>
          <button
            onClick={() =>
              activeTab === 'project'
                ? setShowProjectForm(!showProjectForm)
                : setShowUrgentForm(!showUrgentForm)
            }
            className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
          >
            {activeTab === 'project'
              ? showProjectForm ? 'Cancel' : '+ Post a Job'
              : showUrgentForm ? 'Cancel' : '+ Post Urgent Job'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('project')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'project'
                ? 'bg-[#2C3E50] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Project Jobs
            <span className={`ml-2 text-xs ${activeTab === 'project' ? 'text-gray-200' : 'text-gray-500'}`}>
              ({jobs.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('urgent')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'urgent'
                ? 'bg-[#2C3E50] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Urgent Jobs
            <span className={`ml-2 text-xs ${activeTab === 'urgent' ? 'text-gray-200' : 'text-gray-500'}`}>
              ({openUrgentCount} open)
            </span>
          </button>
        </div>

        {/* ============ PROJECT JOBS TAB ============ */}
        {activeTab === 'project' && (
          <>
            {projectMessage && (
              <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                projectMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {projectMessage.text}
              </div>
            )}

            {showProjectForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Post a New Job</h2>
                <form onSubmit={handleProjectSubmit} className="space-y-4">
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
                      value={projectForm.title}
                      onChange={handleProjectChange}
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
                      value={projectForm.description}
                      onChange={handleProjectChange}
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
                      value={projectForm.trade_required}
                      onChange={handleProjectChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                      required
                    >
                      {PROJECT_TRADES.map((trade) => (
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
                      value={projectForm.location}
                      onChange={handleProjectChange}
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
                      value={projectForm.budget_estimate}
                      onChange={handleProjectChange}
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                      placeholder="Enter estimated budget"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={projectSubmitting}
                    className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50"
                  >
                    {projectSubmitting ? 'Posting...' : 'Post Job'}
                  </button>
                </form>
              </div>
            )}

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
                  <div className="text-5xl mb-4 text-gray-300">[ ]</div>
                  <p className="text-gray-500">No jobs posted yet</p>
                  <button
                    onClick={() => setShowProjectForm(true)}
                    className="mt-4 text-[#F47B20] hover:underline font-medium"
                  >
                    Post your first job
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ============ URGENT JOBS TAB ============ */}
        {activeTab === 'urgent' && (
          <>
            <div className="bg-[#2C3E50] text-white rounded-xl p-5 mb-6">
              <h2 className="text-lg font-bold mb-1">Need someone urgently?</h2>
              <p className="text-sm text-gray-200">
                Post a job and the first available tradesperson to claim it gets the work.
                Workers in your trade and city see it immediately.
              </p>
            </div>

            {urgentMessage && (
              <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
                urgentMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {urgentMessage.text}
              </div>
            )}

            {showUrgentForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Post an Urgent Job</h2>
                <form onSubmit={handleUrgentSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trade Needed <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="trade"
                        value={urgentForm.trade}
                        onChange={handleUrgentChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                        required
                      >
                        {URGENT_TRADES.map((trade) => (
                          <option key={trade} value={trade}>{trade}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urgency <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="urgency"
                        value={urgentForm.urgency}
                        onChange={handleUrgentChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                        required
                      >
                        {URGENCY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What do you need done? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={urgentForm.description}
                      onChange={handleUrgentChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                      placeholder="e.g., Burst pipe in the kitchen, water leaking under the sink"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="city_id"
                        value={urgentForm.city_id}
                        onChange={handleUrgentChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                        required
                      >
                        {CITIES.map((c) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suburb or Area (optional)
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={urgentForm.location}
                        onChange={handleUrgentChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                        placeholder="e.g., Mbare"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="contact_phone"
                      value={urgentForm.contact_phone}
                      onChange={handleUrgentChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                      placeholder="+263 78 123 4567"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The worker who claims your job will see this number.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={urgentSubmitting}
                    className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50"
                  >
                    {urgentSubmitting ? 'Posting...' : 'Post Urgent Job'}
                  </button>
                </form>
              </div>
            )}

            {visibleUrgent.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-4 text-gray-300">[ ]</div>
                <p className="text-gray-500">No urgent jobs posted yet</p>
                <button
                  onClick={() => setShowUrgentForm(true)}
                  className="mt-4 text-[#F47B20] hover:underline font-medium"
                >
                  Post an urgent job
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleUrgent.map((job) => {
                  const expired = isExpired(job);
                  const cityName = CITIES.find((c) => c.id === job.city_id)?.name || '';
                  const claimedById = job.claimed_by_worker_id;
                  return (
                    <UrgentJobCard
                      key={job.id}
                      job={job}
                      expired={expired}
                      cityName={cityName}
                      claimedById={claimedById}
                      onCancel={() => handleCancelUrgent(job.id)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="mt-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-[#2C3E50] transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function UrgentJobCard({ job, expired, cityName, claimedById, onCancel }) {
  const [worker, setWorker] = useState(null);
  const [loadingWorker, setLoadingWorker] = useState(false);

  useEffect(() => {
    async function loadWorker() {
      if (!claimedById) return;
      setLoadingWorker(true);
      const { data } = await supabase
        .from('workers')
        .select('id, full_name, trade, phone, avatar_url')
        .eq('id', claimedById)
        .maybeSingle();
      setWorker(data || null);
      setLoadingWorker(false);
    }
    loadWorker();
  }, [claimedById]);

  const effectiveStatus = expired ? 'expired' : job.status;
  const whatsappNumber = worker ? toWhatsAppNumber(worker.phone) : '';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-[#2C3E50]">{job.trade}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${getUrgencyBadgeClass(job.urgency)}`}>
            {getUrgencyLabel(job.urgency)}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeClass(effectiveStatus)}`}>
            {effectiveStatus}
          </span>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {timeAgo(job.created_at)}
        </span>
      </div>

      <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{job.description}</p>

      <div className="text-xs text-gray-500 mb-4">
        {cityName && (
          <span>
            {cityName}
            {job.location ? ` — ${job.location}` : ''}
          </span>
        )}
      </div>

      {job.status === 'claimed' && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
          {loadingWorker ? (
            <p className="text-sm text-blue-700">Loading worker details...</p>
          ) : worker ? (
            <>
              <p className="text-sm text-blue-900 mb-2">
                Claimed by <span className="font-semibold">{worker.full_name}</span>
                {worker.trade ? ` — ${worker.trade}` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {worker.phone && (
                  <a
                    href={`tel:${worker.phone}`}
                    className="bg-[#F47B20] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#E06B10] transition"
                  >
                    Call {worker.phone}
                  </a>
                )}
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1ebe5a] transition"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-blue-700">Claimed — worker details unavailable.</p>
          )}
        </div>
      )}

      {job.status === 'open' && !expired && (
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
          >
            Cancel Job
          </button>
        </div>
      )}

      {expired && (
        <p className="text-xs text-gray-400 italic">
          This job expired without being claimed. Post a new one if you still need help.
        </p>
      )}
    </div>
  );
  }
