'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import Avatar from '@/components/Avatar';
import PhotoGallery from '@/components/PhotoGallery';
import { CITIES } from '@/lib/cities';

const CATEGORY_CONFIG = {
  hardware: {
    table: 'hardware_stores',
    nameField: 'store_name',
    label: 'Hardware Store',
    backHref: '/dashboard/find?category=hardware',
    imageField: 'logo_url',
    shape: 'square',
    hasGallery: false,
  },
  construction: {
    table: 'construction_companies',
    nameField: 'company_name',
    label: 'Construction Company',
    backHref: '/dashboard/find?category=construction',
    imageField: 'logo_url',
    shape: 'square',
    hasGallery: true,
  },
  architects: {
    table: 'architects',
    nameField: 'firm_name',
    label: 'Architect',
    backHref: '/dashboard/find?category=architects',
    imageField: 'avatar_url',
    shape: 'circle',
    hasGallery: true,
  },
  workers: {
    table: 'workers',
    nameField: 'full_name',
    label: 'Skilled Worker',
    backHref: '/dashboard/find?category=workers',
    imageField: 'avatar_url',
    shape: 'circle',
    hasGallery: true,
  },
};

function toWhatsAppNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  cleaned = cleaned.replace(/^\+/, '');
  if (cleaned.startsWith('0')) {
    cleaned = '263' + cleaned.slice(1);
  }
  return cleaned;
}

// Custom Scalloped Stamp Badge
function SubscriptionBadge({ item }) {
  if (!item) return null;

  let bgColor = '#2C3E50'; // Default Slate for Standard
  let label = 'STANDARD';

  if (item.subscription_status !== 'active') {
    bgColor = '#D1D5DB'; // Gray 300 for Unsubscribed
    label = 'UNSUBSCRIBED';
  } else if (item.subscription_tier === 'premium') {
    bgColor = '#F47B20'; // Brand Orange
    label = 'PREMIUM';
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-16 h-16 shrink-0 opacity-80">
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
        <path 
          fill={bgColor}
          d="M50 0 C54 0 58 4 62 2 C66 0 71 3 74 6 C77 9 82 9 85 13 C88 17 93 19 94 24 C95 29 99 33 98 38 C97 43 99 48 96 52 C93 56 93 62 89 65 C85 68 83 74 78 76 C73 78 70 84 65 84 C60 84 56 88 51 86 C46 84 41 86 37 83 C33 80 27 80 24 75 C21 70 15 68 13 63 C11 58 6 55 6 50 C6 45 10 41 11 36 C12 31 8 26 12 21 C16 16 20 15 23 10 C26 5 32 6 36 3 C40 0 45 0 50 0 Z" 
        />
        <circle cx="50" cy="50" r="32" fill="white" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <svg className="w-3.5 h-3.5 mb-0.5" fill={bgColor} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span style={{ color: bgColor }} className="text-[6px] font-black leading-none tracking-wider text-center px-1">{label}</span>
      </div>
    </div>
  );
}

export default function ProviderProfilePage() {
  const router = useRouter();
  const params = useParams();
  const category = params.category;
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(null);

  const config = CATEGORY_CONFIG[category];

  useEffect(() => {
    async function load() {
      if (!config) {
        setError('Invalid category');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from(config.table)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error('Provider lookup error:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Provider not found');
        setLoading(false);
        return;
      }

      setProvider(data);
      setLoading(false);
    }
    load();
  }, [id, category, config, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="md:ml-64 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-10">
              <div className="text-6xl mb-4 text-gray-200">[ ]</div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">
                {error || 'Provider not found'}
              </h2>
              <button
                onClick={() => router.push(config ? config.backHref : '/dashboard/find')}
                className="mt-4 bg-brand-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-600 transition"
              >
                Back to Directory
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nameField = config.nameField;
  const displayName = provider[nameField] || 'Unnamed';
  const cityName = CITIES.find((c) => c.id === provider.city_id)?.name || '';
  const whatsappNumber = toWhatsAppNumber(provider.phone);
  const imageUrl = config.imageField ? provider[config.imageField] : null;
  
  const photos = Array.isArray(provider.photos) 
    ? provider.photos.filter(url => url && typeof url === 'string' && url.trim() !== '') 
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <Sidebar />

      <div className="md:ml-64 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">

          <div className="mb-4">
            <button
              onClick={() => router.push(config.backHref)}
              className="text-sm text-gray-500 hover:text-slate-700 flex items-center gap-1 font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to {config.label}s
            </button>
          </div>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 mb-6 relative">
            
            {/* Badge absolutely positioned in top right */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
               <SubscriptionBadge item={provider} />
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4 pr-16">
              <Avatar
                name={displayName}
                imageUrl={imageUrl}
                size={80}
                shape={config.shape}
              />
              <div className="flex-1 min-w-0 w-full">
                <span className="inline-block text-[10px] uppercase tracking-wider text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded">
                  {config.label}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-700 mt-2 leading-snug break-words">
                  {displayName}
                </h1>
                {provider.contact_person && (
                  <p className="text-sm text-gray-600 mt-1">
                    Contact: {provider.contact_person}
                  </p>
                )}
              </div>
            </div>

            {/* Contact buttons */}
            <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100">
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="flex-1 sm:flex-none text-center bg-brand-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-600 transition text-sm"
                >
                  Call
                </a>
              )}
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none text-center bg-[#25D366] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#1ebe5a] transition text-sm"
                >
                  WhatsApp
                </a>
              )}
              {provider.email && (
                <a
                  href={`mailto:${provider.email}`}
                  className="flex-1 sm:flex-none text-center border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                >
                  Email
                </a>
              )}
            </div>
          </div>

          {/* Location and contact details */}
          <Section title="Contact Details">
            <DetailGrid>
              {cityName && <Detail label="City" value={cityName} />}
              {provider.location && <Detail label="Location" value={provider.location} />}
              {provider.phone && <Detail label="Phone" value={provider.phone} />}
              {provider.email && <Detail label="Email" value={provider.email} />}
              {provider.website && (
                <Detail
                  label="Website"
                  value={
                    <a
                      href={`https://${provider.website.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:underline break-all"
                    >
                      {provider.website}
                    </a>
                  }
                />
              )}
            </DetailGrid>
          </Section>

          {/* Photo gallery */}
          {config.hasGallery && photos.length > 0 && (
            <PhotoGallery
              photos={photos}
              title={category === 'construction' ? 'Our Work' : 'Work Photos'}
            />
          )}

          {/* Worker-specific */}
          {category === 'workers' && (
            <>
              <Section title="Trade Details">
                <DetailGrid>
                  {provider.trade && <Detail label="Trade" value={provider.trade} />}
                  {provider.sub_trade && (
                    <Detail label="Speciality" value={provider.sub_trade} />
                  )}
                  {provider.years_experience != null && (
                    <Detail
                      label="Experience"
                      value={`${provider.years_experience} year${
                        provider.years_experience === 1 ? '' : 's'
                      }`}
                    />
                  )}
                  {provider.daily_rate_usd != null ? (
                    <Detail label="Daily rate" value={`$${provider.daily_rate_usd}`} />
                  ) : (
                    <Detail label="Daily rate" value="Rate on request" />
                  )}
                  {provider.availability && (
                    <Detail
                      label="Availability"
                      value={
                        provider.availability === 'available'
                          ? 'Available now'
                          : provider.availability === 'limited'
                          ? 'Limited availability'
                          : 'Not available'
                      }
                    />
                  )}
                </DetailGrid>
              </Section>

              {provider.about_me && (
                <Section title="About">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {provider.about_me}
                  </p>
                </Section>
              )}
            </>
          )}

          {/* Architect-specific */}
          {category === 'architects' && (
            <>
              <Section title="Services">
                {provider.services && provider.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No services listed</p>
                )}
              </Section>

              <Section title="Experience and Pricing">
                <DetailGrid>
                  {provider.years_experience != null && (
                    <Detail
                      label="Years of Experience"
                      value={`${provider.years_experience} year${
                        provider.years_experience === 1 ? '' : 's'
                      }`}
                    />
                  )}
                  {(provider.price_per_m2_min || provider.price_per_m2_max) && (
                    <Detail
                      label="Price per m²"
                      value={`$${provider.price_per_m2_min || 0} – $${
                        provider.price_per_m2_max || 0
                      }`}
                    />
                  )}
                </DetailGrid>
              </Section>

              {provider.description && (
                <Section title="About">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {provider.description}
                  </p>
                </Section>
              )}
            </>
          )}

          {/* Hardware-specific */}
          {category === 'hardware' && (
            <Section title="Products">
              <ProductsList storeId={provider.id} />
            </Section>
          )}

          {/* Construction-specific */}
          {category === 'construction' && provider.ad_text && (
            <Section title="About">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {provider.ad_text}
              </p>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      <h2 className="text-base font-bold text-slate-700 mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </div>
  );
}

function DetailGrid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">{children}</div>;
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-slate-700 font-medium">{value}</div>
    </div>
  );
}

function ProductsList({ storeId }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('materials')
        .select('name, unit, price_usd, in_stock')
        .eq('hardware_store_id', storeId)
        .eq('in_stock', true)
        .order('name', { ascending: true });
      setProducts(data || []);
      setLoading(false);
    }
    load();
  }, [storeId]);

  if (loading) {
    return <p className="text-sm text-gray-500">Loading products...</p>;
  }

  if (products.length === 0) {
    return <p className="text-sm text-gray-500">No products listed yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-gray-500 border-b border-gray-100">
          <tr>
            <th className="text-left py-2 font-medium">Product</th>
            <th className="text-left py-2 font-medium">Unit</th>
            <th className="text-right py-2 font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={idx} className="border-b border-gray-50 last:border-0">
              <td className="py-2 text-slate-700">{p.name}</td>
              <td className="py-2 text-gray-500">{p.unit}</td>
              <td className="py-2 text-right font-medium text-slate-700">
                ${Number(p.price_usd).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
      }
