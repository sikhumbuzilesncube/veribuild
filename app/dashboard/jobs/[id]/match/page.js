'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function WorkerMatchPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [requiredTrades, setRequiredTrades] = useState([]);
  const [applying, setApplying] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Get job details
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!jobData) {
        setLoading(false);
        return;
      }

      setJob(jobData);

      // Match workers
      const response = await fetch('/api/test-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: jobData.project_id }),
      });

      const result = await response.json();
      
      if (result.success) {
        setWorkers(result.recommended || []);
        setRequiredTrades(result.required_trades || []);
      }

      setLoading(false);
    }

    loadData();
  }, [jobId, router]);

  const handleApply = async (workerId) => {
    setApplying({ ...applying, [workerId]: true });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: parseInt(jobId),
          worker_id: workerId,
          worker_notes: 'Interested in this job',
          status: 'pending',
        });

      if (error) {
        alert('Failed to send application');
      } else {
        alert('Application sent successfully! The worker will be notified.');
      }
    } catch (err) {
      alert('Something went wrong.');
    }

    setApplying({ ...applying, [workerId]: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Finding matching workers...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">Job not found</h2>
          <Link href="/dashboard/jobs" className="text-[#F47B20] hover:underline">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/jobs" className="text-gray-600 hover:text-[#2C3E50] transition">
            ← Back to Jobs
          </Link>
          <h1 className="text-3xl font-bold text-[#2C3E50] mt-2">👷 Find Workers</h1>
          <p className="text-gray-600">{job.title}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
              {job.trade_required}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {job.status}
            </span>
            {job.budget_estimate && (
              <span className="bg-[#F47B20]/10 text-[#F47B20] px-3 py-1 rounded-full text-sm">
                Budget: ${job.budget_estimate}
              </span>
            )}
          </div>
        </div>

        {/* Required Trades */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-2">Required Trades</h2>
          <div className="flex flex-wrap gap-2">
            {requiredTrades.map((trade, index) => (
              <span key={index} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium">
                {trade}
              </span>
            ))}
          </div>
        </div>

        {/* Workers List */}
        {workers.length > 0 ? (
          <div className="space-y-4">
            {workers.map((worker) => (
              <div key={worker.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#F47B20] rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {worker.full_name?.charAt(0) || 'W'}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#2C3E50]">{worker.full_name}</h3>
                        <p className="text-sm text-gray-600">{worker.trade}</p>
                        {worker.sub_trade && (
                          <p className="text-xs text-gray-500">{worker.sub_trade}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <span>⭐ {worker.rating || 0} ({worker.reviews_count || 0} reviews)</span>
                      <span>📍 {worker.location || 'No location'}</span>
                      <span>{worker.years_experience || 0} years exp</span>
                      <span className="text-green-600 font-medium">Available</span>
                    </div>
                    {worker.match_score && (
                      <div className="mt-2">
                        <span className="text-xs font-semibold text-[#F47B20]">
                          Match Score: {worker.match_score}%
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleApply(worker.id)}
                    disabled={applying[worker.id]}
                    className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50"
                  >
                    {applying[worker.id] ? 'Sending...' : '📩 Contact Worker'}
                  </button>
                </div>

                {/* Show About Me and Past Projects */}
                {worker.about_me && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>About:</strong> {worker.about_me}</p>
                  </div>
                )}
                {worker.past_projects && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Past Projects:</strong> {worker.past_projects}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">No Workers Found</h2>
            <p className="text-gray-600">
              No available workers match this job's requirements yet.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Check back later or try posting the job again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
      }
