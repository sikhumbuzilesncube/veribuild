'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import { CITIES } from '@/lib/cities';

const CATEGORIES = [
  {
    key: 'hardware',
    label: 'Hardware Stores',
    table: 'hardware_stores',
    nameField: 'store_name',
    imageField: 'logo_url',
    shape: 'square',
  },
  {
    key: 'construction',
    label: 'Construction Companies',
    table: 'construction_companies',
    nameField: 'company_name',
    imageField: 'logo_url',
    shape: 'square',
  },
  {
    key: 'architects',
    label: 'Architects',
    table: 'architects',
    nameField: 'firm_name',
    imageField: 'avatar_url',
    shape: 'circle',
  },
  {
    key: 'workers',
    label: 'Skilled Workers',
    table: 'workers',
    nameField: 'full_name',
    imageField: 'avatar_url',
    shape: 'circle',
  },
];

const CATEGORIES_WITH_PROFILE = ['workers', 'architects', 'hardware', 'construction'];

const WORKER_TRADES = [
  'Mason',
  'Carpenter',
  'Plumber',
  'Electrician',
  'Tiler',
  'Painter',
  'Roofer',
  'Welder',
  'Steel fixer',
  'General labourer',
  'Site supervisor',
  'Other',
];

const EXPERIENCE_BUCKETS = [
  { value: '', label: 'Any experience' },
  { value: '1', label: '1+ year' },
  { value: '3', label: '3+ years' },
  { value: '5', label: '5+ years' },
  { value: '10', label: '10+ years' },
];

function getTierRank(item) {
  if (item.subscription_status !== 'active') return 2;
  if (item.subscription_tier === 'premium') return 0;
  return 1;
}

function getTierLabel(item) {
  if (item.subscription_status !== 'active') return 'Not Subscribed';
  if (item.subscription_tier === 'premium') {
    return item.subscription_coverage === 'national'
      ? 'Premium · National'
      : 'Premium · Local';
  }
  return 'Standard';
}

function getTierBadgeClass(item) {
  if (item.subscription_status !== 'active') {
    return 'bg-gray-100 text-gray-700';
  }
  if (item.subscription_tier === 'premium') {
    return 'bg-[#F47B20] text-white';
  }
  return 'bg-blue-100 text-blue-800';
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

export default function FindPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <FindContent />
    </Suspense>
  );
}

function FindContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'hardware';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [allData, setAllData] = useState({});

  // Filters
  const [cityFilter, setCityFilter] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  useEffect(() => {
    async function loadAll() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const result = {};

      for (const cat of CATEGORIES) {
        const { data, error: fetchError } = await supabase
          .from(cat.table)
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error(`Error loading ${cat.table}:`, fetchError);
          result[cat.key] = [];
        } else {
          result[cat.key] = data || [];
        }
      }

      setAllData(result);
      setLoading(false);
    }
    loadAll();
  }, [router]);

  // Reset secondary filters when switching tabs
  useEffect(() => {
    setTradeFilter('');
    setExperienceFilter('');
    setServiceFilter('');
  }, [activeCategory]);

  // Union of all architect services for the filter dropdown
  const architectServices = useMemo(() => {
    const set = new Set();
    (allData.architects || []).forEach((a) => {
      (a.services || []).forEach((s) => {
        if (s && typeof s === 'string') set.add(s);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allData.architects]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading providers...</p>
        </div>
      </div>
    );
  }

  const currentCat = CATEGORIES.find((c) => c.key === activeCategory);
  const rawList = allData[activeCategory] || [];

  // Apply filters
  let filtered = rawList;

  if (cityFilter) {
    filtered = filtered.filter((item) => String(item.city_id) === String(cityFilter));
  }

  if (activeCategory === 'workers') {
    if (tradeFilter) {
      filtered = filtered.filter((item) => item.trade === tradeFilter);
    }
    if (experienceFilter) {
      const min = parseInt(experienceFilter, 10);
      filtered = filtered.filter(
        (item) => (item.years_experience || 0) >= min
      );
    }
  }

  if (activeCategory === 'architects' && serviceFilter) {
    filtered = filtered.filter(
      (item) => Array.isArray(item.services) && item.services.includes(serviceFilter)
    );
  }

  const sorted = [...filtered].sort((a, b) => {
    const rankA = getTierRank(a);
    const rankB = getTierRank(b);
    if (rankA !== rankB) return rankA - rankB;
    const nameA = String(a[currentCat.nameField] || '').toLowerCase();
    const nameB = String(b[currentCat.nameField] || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const showProfileButton = CATEGORIES_WITH_PROFILE.includes(activeCategory);

  const hasActiveFilter =
    cityFilter || tradeFilter || experienceFilter || serviceFilter;

  const clearAllFilters = () => {
    setCityFilter('');
    setTradeFilter('');
    setExperienceFilter('');
    setServiceFilter('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="md:ml-64 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">

          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-800 mb-3"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
              Find Providers
            </h1>
            <p className="text-gray-600 text-sm">
              Browse hardware stores, construction companies, architects, and
              skilled workers across Zimbabwe.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              const count = (allData[cat.key] || []).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#2C3E50] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                  <span className={`ml-2 text-xs ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  City
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none text-sm"
                >
                  <option value="">All cities</option>
                  {CITIES.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeCategory === 'workers' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Trade
                    </label>
                    <select
                      value={tradeFilter}
                      onChange={(e) => setTradeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none text-sm"
                    >
                      <option value="">All trades</option>
                      {WORKER_TRADES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Experience
                    </label>
                    <select
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none text-sm"
                    >
                      {EXPERIENCE_BUCKETS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeCategory === 'architects' && architectServices.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Service
                  </label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none text-sm"
                  >
                    <option value="">All services</option>
                    {architectServices.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              {hasActiveFilter ? (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-[#F47B20] hover:underline"
                >
                  Clear all filters
                </button>
              ) : (
                <span className="text-xs text-gray-400">No filters applied</span>
              )}
              <span className="text-xs text-gray-500">
                {sorted.length} result{sorted.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {sorted.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4 text-gray-300">[ ]</div>
              <p className="text-gray-500 mb-2">
                No {currentCat.label.toLowerCase()} found
                {hasActiveFilter ? ' matching your filters' : ''}.
              </p>
              {hasActiveFilter && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 text-sm text-[#F47B20] hover:underline"
                >
                  Clear all filters
                </button>
              )}
              {!hasActiveFilter && (
                <p className="text-xs text-gray-400">
                  Try a different city or category.
                </p>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sorted.map((item) => (
                <ProviderCard
                  key={item.id}
                  item={item}
                  category={currentCat}
                  showProfileButton={showProfileButton}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ProviderCard({ item, category, showProfileButton }) {
  const router = useRouter();
  const nameField = category.nameField;
  const displayName = item[nameField] || 'Unnamed';
  const cityName = CITIES.find((c) => c.id === item.city_id)?.name || '';
  const whatsappNumber = toWhatsAppNumber(item.phone);
  const imageUrl = category.imageField ? item[category.imageField] : null;

  const handleViewProfile = () => {
    router.push(`/dashboard/find/${category.key}/${item.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar
            name={displayName}
            imageUrl={imageUrl}
            size={48}
            shape={category.shape}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#2C3E50] truncate">{displayName}</h3>
            
            {/* TAGLINE DISPLAYED HERE */}
            {category.key === 'hardware' && item.tagline && (
              <p className="text-xs text-gray-600 mt-0.5 truncate">{item.tagline}</p>
            )}

            {item.contact_person && (
              <p className="text-xs text-gray-500 mt-0.5">Contact: {item.contact_person}</p>
            )}
            {category.key === 'workers' && item.trade && (
              <p className="text-xs text-gray-600 mt-1">
                {item.trade}
                {item.sub_trade ? ` — ${item.sub_trade}` : ''}
              </p>
            )}
            {category.key === 'architects' && item.services && item.services.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">{item.services.join(', ')}</p>
            )}
            {category.key === 'construction' && item.ad_text && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.ad_text}</p>
            )}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getTierBadgeClass(item)}`}>
          {getTierLabel(item)}
        </span>
      </div>

      <div className="text-xs text-gray-500 space-y-0.5 pt-3 border-t border-gray-100">
        {cityName && <div>Location: {cityName}{item.location ? ` — ${item.location}` : ''}</div>}
        {item.phone && <div>Tel: {item.phone}</div>}
        {item.email && <div>Email: {item.email}</div>}
        {item.website && <div>Web: {item.website}</div>}
        {category.key === 'workers' && item.daily_rate_usd != null && (
          <div>Daily rate: ${item.daily_rate_usd}</div>
        )}
        {category.key === 'workers' && item.daily_rate_usd == null && (
          <div>Daily rate: Rate on request</div>
        )}
        {category.key === 'architects' && item.years_experience != null && (
          <div>Experience: {item.years_experience} years</div>
        )}
        {category.key === 'architects' &&
          (item.price_per_m2_min || item.price_per_m2_max) && (
            <div>
              ${item.price_per_m2_min || 0}–${item.price_per_m2_max || 0} per m²
            </div>
          )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {item.phone && (
          <a
            href={`tel:${item.phone}`}
            className="bg-[#F47B20] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#E06B10] transition"
          >
            Call
          </a>
        )}
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#1ebe5a] transition"
          >
            WhatsApp
          </a>
        )}
        {item.email && (
          <a
            href={`mailto:${item.email}`}
            className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
          >
            Email
          </a>
        )}
        {showProfileButton && (
          <button
            onClick={handleViewProfile}
            className="border border-[#F47B20] text-[#F47B20] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#F47B20] hover:text-white transition"
          >
            View Profile
          </button>
        )}
      </div>
    </div>
  );
      }
