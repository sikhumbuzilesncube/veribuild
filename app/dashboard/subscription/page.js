'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_CATEGORIES, planToDbFields } from '@/lib/subscriptions';

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get('category');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(preselect || 'construction');
  const [userListings, setUserListings] = useState({});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const listings = {};
      for (const cat of SUBSCRIPTION_CATEGORIES) {
        const { data, error: fetchError } = await supabase
          .from(cat.table)
          .select('id, subscription_tier, subscription_coverage, subscription_status')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (fetchError) {
          console.error(`Error loading ${cat.table}:`, fetchError);
        }

        if (data) {
          listings[cat.key] = data;
        }
      }
      setUserListings(listings);
      setLoading(false);
    }
    load();
  }, [router]);

  const handleSelectPlan = async (categoryKey, planKey) => {
    setSaving(true);
    setError('');
    setStatus('');

    const cat = SUBSCRIPTION_CATEGORIES.find((c) => c.key === categoryKey);
    if (!cat) {
      setError('Invalid category');
      setSaving(false);
      return;
    }

    const dbFields = planToDbFields(categoryKey, planKey);
    if (!dbFields) {
      setError('Invalid plan');
      setSaving(false);
      return;
    }

    const existing = userListings[categoryKey];

    if (!existing) {
      setError(
        `You do not have a ${cat.label} listing yet. Create one first from your ${cat.label} dashboard, then return here to choose a plan.`
      );
      setSaving(false);
      return;
    }

    setStatus('Saving your plan selection...');

    try {
      // Only send columns that exist in all four tables
      const updateFields = {
        subscription_tier: dbFields.subscription_tier,
        subscription_coverage: dbFields.subscription_coverage,
        subscription_status: dbFields.subscription_status,
        featured_city_ids: dbFields.featured_city_ids,
      };

      const { error: updateError } = await supabase
        .from(cat.table)
        .update(updateFields)
        .eq('id', existing.id);

      if (updateError) {
        setError(`Failed to save: ${updateError.message}`);
        setSaving(false);
        setStatus('');
        return;
      }

      setStatus(
        `Plan selected: ${cat.label} — ${planKey.replace('_', ' ')}. Payment gateway is not yet connected. This plan will be charged when billing launches.`
      );

      setUserListings({
        ...userListings,
        [categoryKey]: {
          ...existing,
          subscription_tier: dbFields.subscription_tier,
          subscription_coverage: dbFields.subscription_coverage,
        },
      });

      setSaving(false);
    } catch (err) {
      console.error('Plan selection error:', err);
      setError('Something went wrong. Please try again.');
      setSaving(false);
      setStatus('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  const currentCategory = SUBSCRIPTION_CATEGORIES.find((c) => c.key === selectedCategory);
  const userHasListing = !!userListings[selectedCategory];
  const currentListing = userListings[selectedCategory];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">

        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-800 mb-3"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            Subscription Plans
          </h1>
          <p className="text-gray-600 text-sm">
            Choose how you want your business to appear on VeriBuild. Plans are
            shown in USD per month. Payment gateway is not yet connected — your
            selection is recorded and will be charged when billing launches.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6 flex flex-wrap gap-2">
          {SUBSCRIPTION_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            const hasListing = !!userListings[cat.key];
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#2C3E50] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.label}
                {hasListing && (
                  <span className={`ml-2 text-xs ${isActive ? 'text-gray-200' : 'text-green-600'}`}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!userHasListing && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
            <div className="font-semibold mb-1">
              You do not have a {currentCategory.label} listing yet
            </div>
            <p>
              To subscribe to a plan, you first need a listing. Create one from your
              {' '}{currentCategory.label} dashboard, then return here to select a plan.
            </p>
          </div>
        )}

        {userHasListing && currentListing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            <div className="font-semibold mb-1">Your current plan</div>
            <p>
              {currentListing.subscription_tier === 'premium' ? 'Premium' : 'Standard'}
              {' · '}
              {currentListing.subscription_coverage === 'national' ? 'All cities' : 'One city'}
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {currentCategory.plans.map((plan) => {
            const isCurrent =
              currentListing &&
              currentListing.subscription_tier === (plan.placement === 'boq' ? 'premium' : 'standard') &&
              currentListing.subscription_coverage === plan.coverage;

            return (
              <div
                key={plan.key}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 flex flex-col ${
                  isCurrent ? 'border-green-500' : 'border-gray-200'
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#2C3E50]">{plan.label}</h3>
                  <div className="text-3xl font-bold text-[#F47B20] mt-2">
                    ${plan.priceUsd}
                    <span className="text-sm text-gray-500 font-normal"> / month</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {plan.coverage === 'national' ? 'All 47 cities' : 'One city'}
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-[#F47B20] flex-shrink-0 mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(currentCategory.key, plan.key)}
                  disabled={saving || !userHasListing || isCurrent}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    isCurrent
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : userHasListing
                      ? 'bg-[#F47B20] text-white hover:bg-[#E06B10]'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : userHasListing
                    ? 'Select This Plan'
                    : 'Create Listing First'}
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {status && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
            {status}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <div className="font-semibold mb-1">About subscriptions during beta</div>
          <p>
            The platform is in beta. You can select a plan now, and it will be
            recorded against your listing. When payment launches, you will be
            charged the selected amount. You can change or cancel before then.
          </p>
        </div>

      </div>
    </div>
  );
    }
