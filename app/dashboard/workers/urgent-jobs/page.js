'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CITIES } from '@/lib/cities';

const URGENCY_OPTIONS = [
  { value: 'asap', label: 'ASAP', hours: 48, rank: 0 },
  { value: 'today', label: 'Today', hours: 24, rank: 1 },
  { value: 'this_week', label: 'This Week', hours: 168, rank: 2 },
];

function getUrgencyOption(urgency) {
  return URGENCY_OPTIONS.find((o) => o.value === urgency) || URGENCY_OPTIONS[1];
}

function getUrgencyBadgeClass(urgency) {
  if (urgency === 'asap') return 'bg-red-100 text-red-700';
  if (urgency === 'today') return 'bg-orange-100 text-orange-700';
  return 'bg-gray-100 text-gray-700';
}

function isExpired(job) {
  if (!job || job.status !== 'open') return false;
  const hours = getUrgencyOption(job.urgency).hours;
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

function sortJobs(list) {
  const copy = [...list];
  copy.sort((a, b) => {
    const rankA = getUrgencyOption(a.urgency).rank;
    const rankB = getUrgencyOption(b.urgency).rank;
    if (rankA !== rankB) return rankA - rankB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return copy;
}

export default function WorkerUrgentJobsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null);

  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [cityFilter, setCityFilter] = useState('my_city');
  const [claimingId, setClaimingId] = useState(null);

  const loadJobs = useCallback(async (workerRow, filter) => {
    if (!workerRow) return;

    let query = supabase
      .from('job_requests')
      .select('*')
      .eq('status', 'open')
      .eq('trade', workerRow.trade)
      .order('created_at', { ascending: false });

    if (filter === 'my_city') {
      query = query.eq('city_id', workerRow.city_id);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error loading urgent jobs:', fetchError);
      setError(fetchError.message);
      setJobs([]);
      return;
    }

    const fresh = (data || []).filter((j) => !isExpired(j));
    setJobs(sortJobs(fresh));
    setError('');
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: workerRow, error: workerError } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (workerError || !workerRow) {
        setError('You need a worker profile to see urgent jobs.');
        setLoading(false);
        return;
      }

      setWorker(workerRow);
      await loadJobs(workerRow, cityFilter);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Re-fetch when the filter changes (does not touch Realtime)
  useEffect(() => {
    if (!worker) return;
    loadJobs(worker, cityFilter);
  }, [cityFilter, worker, loadJobs]);

  // Realtime subscription
  useEffect(() => {
    if (!worker || !worker.trade || !worker.city_id) return;

    const matchesFilter = (job) => {
      if (cityFilter === 'my_city') {
        return job.city_id === worker.city_id;
      }
      return true;
    };

    const channel = supabase
      .channel('worker-urgent-jobs-board')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_requests' },
        (payload) => {
          const job = payload.new;
          if (
            job &&
            job.status === 'open' &&
            job.trade === worker.trade &&
            matchesFilter(job) &&
            !isExpired(job)
          ) {
            // Prepend and re-sort
            setJobs((prev) => {
              if (prev.some((j) => j.id === job.id)) return prev;
              return sortJobs([job, ...prev]);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'job_requests' },
        (payload) => {
          const job = payload.new;
          if (!job) return;

          // If it became non-open, remove it from the board
          if (job.status !== 'open') {
            setJobs((prev) => prev.filter((j) => j.id !== job.id));
            return;
          }

          // If it is still open and matches, update it in place (or add if missing)
          if (job.trade === worker.trade && matchesFilter(job) && !isExpired(job)) {
            setJobs((prev) => {
              const exists = prev.some((j) => j.id === job.id);
              if (!exists) return sortJobs([job, ...prev]);
              return sortJobs(prev.map((j) => (j.id === job.id ? job : j)));
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [worker, cityFilter]);

  const handleRefresh = async () => {
    if (!worker) return;
    setRefreshing(true);
    await loadJobs(worker, cityFilter);
    setRefreshing(false);
  };

  const handleClaim = async (job) => {
    if (!worker) return;

    const confirmed = confirm(
      `Claim this job?\n\n${job.trade} — ${job.description}\n\nYou will be the only one able to take it, and the client will see your name and phone number.`
    );
    if (!confirmed) return;

    setClaimingId(job.id);
    setMessage(null);

    try {
      const { data: updated, error: claimError } = await supabase
        .from('job_requests')
        .update({
          status: 'claimed',
          claimed_by_worker_id: worker.id,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('status', 'open')
        .select();

      if (claimError) {
        console.error('Claim error:', claimError);
        setMessage({ type: 'error', text: `Could not claim: ${claimError.message}` });
        setClaimingId(null);
        return;
      }

      if (!updated || updated.length === 0) {
        setMessage({
          type: 'error',
          text: 'This job was just taken by another worker. Refreshing the list.',
        });
        await loadJobs(worker, cityFilter);
        setClaimingId(null);
        return;
      }

      setMessage({
        type: 'success',
        text: 'Job claimed. Call the client now to confirm the details.',
      });

      // Remove locally; the UPDATE subscription would also remove it, but doing
      // it immediately gives an instant visual response.
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err) {
      console.error('Unexpected claim error:', err);
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    }

    setClaimingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading urgent jobs...</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
              Worker profile required
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {error || 'Create your worker profile first to see urgent jobs in your trade.'}
            </p>
            <Link
              href="/dashboard/workers/new"
              className="inline-block bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
            >
              Create Worker Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const workerCityName = CITIES.find((c) => c.id === worker.city_id)?.name || 'your city';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <Link
            href="/dashboard/workers"
            className="text-sm text-gray-600 hover:text-gray-800 mb-3 inline-block"
          >
            Back to My Profile
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            Urgent Jobs
          </h1>
          <p className="text-gray-600 text-sm">
            Open {worker.trade} jobs posted by clients near you. First to claim gets the work.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Show jobs in:
          </label>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none text-sm"
          >
            <option value="my_city">My city ({workerCityName})</option>
            <option value="all">All cities</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-auto text-sm text-[#F47B20] hover:underline disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <span className="text-xs text-gray-500">
            {jobs.length} open
          </span>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {error && !message && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4 text-gray-300">[ ]</div>
            <p className="text-gray-500 mb-2">
              No open urgent jobs right now.
            </p>
            <p className="text-xs text-gray-400">
              {cityFilter === 'my_city'
                ? `Try switching to "All cities" if you are willing to travel.`
                : 'Check back soon.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const urgencyOpt = getUrgencyOption(job.urgency);
              const cityName = CITIES.find((c) => c.id === job.city_id)?.name || '';
              const isClaimingThis = claimingId === job.id;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-[#2C3E50]">
                      {job.trade}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getUrgencyBadgeClass(job.urgency)}`}>
                      {urgencyOpt.label}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">
                      {timeAgo(job.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                    {job.description}
                  </p>

                  <div className="text-xs text-gray-500 mb-4">
                    {cityName}
                    {job.location ? ` — ${job.location}` : ''}
                  </div>

                  <button
                    onClick={() => handleClaim(job)}
                    disabled={isClaimingThis}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold transition ${
                      isClaimingThis
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#F47B20] text-white hover:bg-[#E06B10]'
                    }`}
                  >
                    {isClaimingThis ? 'Claiming...' : 'Claim This Job'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
      }
