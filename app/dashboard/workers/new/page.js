'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CITIES } from '@/lib/cities';
import Sidebar from '@/components/Sidebar';

export default function WorkerDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Worker listing load error:', error);
      }

      if (data) {
        setListing(data);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  const cityName = listing
    ? (CITIES.find((c) => c.id === listing.city_id)?.name || '')
    : '';

  const isSubscribed =
    listing && listing.subscription_status && listing.subscription_status !== 'none';

  const rateValue = listing ? Number(listing.daily_rate_usd) : 0;
  const hasRate = rateValue > 0;

  const reviewCount = listing ? Number(listing.reviews_count || 0) : 0;
  const hasReviews = reviewCount > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-1">
              Worker Dashboard
            </h1>
            <p className="text-gray-600 text-sm">
              Manage your profile and BOQ placement.
            </p>
          </div>

          {!listing && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
              <h2 className="text-lg font-bold text-[#2C3E50] mb-3">
                Your Worker Profile
              </h2>
              <p className="text-gray-600 text-sm max-w-xl mx-auto mb-6 leading-relaxed">
                Create a profile to appear in the marketplace. Once you choose a
                plan, you will also appear on BOQ documents delivered to clients
                in your city.
              </p>
              <button
                onClick={() => router.push('/dashboard/workers/new')}
                className="bg-[#F47B20] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition"
              >
                Create Your Profile
              </button>
            </div>
          )}

          {listing && (
            <div className="space-y-6">

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-gray-100">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-[#2C3E50] truncate">
                      {listing.full_name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {listing.trade}
                      {listing.sub_trade ? ` · ${listing.sub_trade}` : ''}
                    </p>
                  </div>
                  <AvailabilityPill value={listing.availability} />
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <Row label="City" value={cityName || '—'} />
                  <Row
                    label="Experience"
                    value={
                      listing.years_experience
                        ? `${listing.years_experience} years`
                        : '—'
                    }
                  />
                  {hasRate && (
                    <Row
                      label="Daily rate"
                      value={`$${rateValue.toFixed(2)} / day`}
                    />
                  )}
                  {hasReviews && (
                    <Row
                      label="Rating"
                      value={`${Number(listing.rating).toFixed(1)} (${reviewCount} ${
                        reviewCount === 1 ? 'review' : 'reviews'
                      })`}
                    />
                  )}
                  {listing.phone && <Row label="Phone" value={listing.phone} />}
                  {listing.email && <Row label="Email" value={listing.email} />}
                </dl>

                {listing.about_me && (
                  <p className="text-sm text-gray-700 mt-4 pt-4 border-t border-gray-100 leading-relaxed whitespace-pre-line">
                    {listing.about_me}
                  </p>
                )}

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push('/dashboard/workers/new')}
                    className="text-sm font-medium text-[#F47B20] hover:text-[#E06B10] transition"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              {isSubscribed ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#2C3E50] mb-1">
                        Subscription
                      </p>
                      <p className="text-sm text-gray-600">
                        {[
                          listing.subscription_tier
                            ? capitalize(listing.subscription_tier)
                            : null,
                          listing.subscription_coverage
                            ? capitalize(listing.subscription_coverage)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Active'}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 whitespace-nowrap">
                      Listed on BOQ
                    </span>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <Link
                      href="/dashboard/subscription"
                      className="text-sm font-medium text-[#F47B20] hover:text-[#E06B10] transition"
                    >
                      Manage Subscription
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F47B20] rounded-lg shadow-sm p-4 sm:p-6 text-white">
                  <p className="text-base font-bold mb-2">
                    Promote Your Profile
                  </p>
                  <p className="text-sm text-white/95 mb-5 leading-relaxed max-w-2xl">
                    Your profile is live in the marketplace. Choose a plan to
                    also appear on BOQ documents delivered to clients in your
                    city.
                  </p>
                  <Link
                    href="/dashboard/subscription"
                    className="inline-block bg-white text-[#F47B20] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition"
                  >
                    View Plans
                  </Link>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 sm:block">
      <dt className="text-gray-500 text-xs sm:text-sm">{label}</dt>
      <dd className="text-gray-800 font-medium text-right sm:text-left sm:mt-0.5">
        {value}
      </dd>
    </div>
  );
}

function AvailabilityPill({ value }) {
  const map = {
    available: {
      label: 'Available now',
      cls: 'bg-green-100 text-green-800',
    },
    limited: {
      label: 'Limited availability',
      cls: 'bg-amber-100 text-amber-800',
    },
    unavailable: {
      label: 'Not available',
      cls: 'bg-gray-100 text-gray-700',
    },
  };
  const item = map[value] || map.unavailable;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${item.cls}`}
    >
      {item.label}
    </span>
  );
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
          }
