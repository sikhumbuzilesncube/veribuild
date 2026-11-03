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
  'Mason', 'Carpenter', 'Plumber', 'Electrician', 'Tiler', 'Painter', 'Roofer', 'Welder', 'Steel fixer', 'General labourer', 'Site supervisor', 'Other',
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

function toWhatsAppNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  cleaned = cleaned.replace(/^\+/, '');
  if (cleaned.startsWith('0')) {
    cleaned = '263' + cleaned.slice(1);
  }
  return cleaned;
}

// Icons
const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const LocationIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const StarBadgeIcon = () => (
  <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const CheckBadgeIcon = () => (
  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);


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
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 overflow-x-hidden">
      <Sidebar />

      <div className="md:ml-64 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">

          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 mb-2">
              Find Providers
            </h1>
            <p className="text-gray-600 text-sm">
              Browse hardware stores, construction companies, architects, and skilled workers across Zimbabwe.
            </p>
          </div>

          {/* Category Tabs - Fixed horizontal scroll */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:bg-white md:rounded-lg md:shadow-sm md:border md:border-gray-200 md:p-2">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              const count = (allData[cat.key] || []).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition md:rounded-lg shrink-0 ${
                    isActive
                      ? 'bg-slate-700 text-white shadow-md md:shadow-none'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 md:border-transparent md:bg-transparent md:hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                  <span className={`ml-2 text-xs ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filters Box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  City
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm bg-gray-50"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm bg-gray-50"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm bg-gray-50"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm bg-gray-50"
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
                  className="text-sm text-brand-500 hover:underline font-medium"
                >
                  Clear all filters
                </button>
              ) : (
                <span className="text-xs text-gray-400">No filters applied</span>
              )}
              <span className="text-xs font-medium text-gray-500">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4 text-gray-200">[ ]</div>
              <p className="text-gray-500 mb-2 font-medium">
                No {currentCat.label.toLowerCase()} found
                {hasActiveFilter ? ' matching your filters' : ''}.
              </p>
              {hasActiveFilter && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 text-sm text-brand-500 hover:underline"
                >
                  Clear all filters
                </button>
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
    if (showProfileButton) {
      router.push(`/dashboard/find/${category.key}/${item.id}`);
    }
  };

  // Subscription Icon Logic
  let SubIcon = null;
  if (item.subscription_status === 'active') {
    if (item.subscription_tier === 'premium') {
      SubIcon = <StarBadgeIcon />;
    } else {
      SubIcon = <CheckBadgeIcon />;
    }
  }

  return (
    <div 
      onClick={handleViewProfile}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition overflow-hidden w-full ${showProfileButton ? 'cursor-pointer hover:shadow-md hover:border-brand-500' : ''}`}
    >
      <div className="flex justify-between items-start mb-3 gap-3 w-full">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Avatar
            name={displayName}
            imageUrl={imageUrl}
            size={56}
            shape={category.shape}
          />
          <div className="flex-1 min-w-0 pt-1">
            
            {/* Name + Subscription Icon */}
            <div className="flex items-center gap-1.5 w-full">
              <h3 className="font-bold text-slate-700 text-base truncate leading-tight max-w-full">{displayName}</h3>
              {SubIcon && (
                <div title={item.subscription_tier === 'premium' ? 'Premium Provider' : 'Standard Provider'} className="shrink-0">
                  {SubIcon}
                </div>
              )}
            </div>

            {category.key === 'hardware' && item.tagline && (
              <p className="text-xs text-gray-500 mt-1 truncate">{item.tagline}</p>
            )}
            {item.contact_person && (
              <p className="text-xs text-gray-500 mt-1 truncate">Contact: {item.contact_person}</p>
            )}
            {category.key === 'workers' && item.trade && (
              <p className="text-xs text-gray-600 font-medium mt-1">
                {item.trade}{item.sub_trade ? ` • ${item.sub_trade}` : ''}
              </p>
            )}
            {category.key === 'architects' && item.services && item.services.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 truncate">{item.services.join(', ')}</p>
            )}
            {category.key === 'construction' && item.ad_text && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 break-words">{item.ad_text}</p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 w-full">
        
        {/* Left side: Location & Rate */}
        <div className="text-xs text-gray-500 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 w-full">
            <LocationIcon />
            <span className="truncate">{cityName}{item.location ? ` — ${item.location}` : ''}</span>
          </div>
          {category.key === 'workers' && (
            <div className="font-medium text-slate-700 mt-1">
              {item.daily_rate_usd != null ? `$${item.daily_rate_usd} / day` : 'Rate on request'}
            </div>
          )}
        </div>

        {/* Right side: Contact Icons */}
        <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {item.phone && (
            <a
              href={`tel:${item.phone}`}
              className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-500 hover:text-white transition"
              title="Call"
            >
              <PhoneIcon />
            </a>
          )}
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition"
              title="WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          )}
          {item.email && (
            <a
              href={`mailto:${item.email}`}
              className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition"
              title="Email"
            >
              <EmailIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  );
  }
