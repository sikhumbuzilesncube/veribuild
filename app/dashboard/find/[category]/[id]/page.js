'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { CITIES } from '@/lib/cities';

const CATEGORY_CONFIG = {
  hardware: {
    table: 'hardware_stores',
    nameField: 'store_name',
    label: 'Hardware Store',
    backHref: '/dashboard/find?category=hardware',
  },
  construction: {
    table: 'construction_companies',
    nameField: 'company_name',
    label: 'Construction Company',
    backHref: '/dashboard/find?category=construction',
  },
  architects: {
    table: 'architects',
    nameField: 'firm_name',
    label: 'Architect',
    backHref: '/dashboard/find?category=architects',
  },
  workers: {
    table: 'workers',
    nameField: 'full_name',
    label: 'Skilled Worker',
    backHref: '/dashboard/find?category=workers',
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

function getTierLabel(item) {
  if (!item || item.subscription_status !== 'active') return 'Not Subscribed';
  if (item.subscription_tier === 'premium') {
    return item.subscription_coverage === 'national'
      ? 'Premium · National'
      : 'Premium · Local';
  }
  return 'Standard';
}

function getTierBadgeClass(item) {
  if (!item || item.subscription_status !== 'active') {
    return 'bg-gray-100 text-gray-700';
  }
  if (item.subscription_tier === 'premium') {
    return 'bg-[#F47B20] text-white';
  }
  return 'bg-blue-100 text-blue-800';
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
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-6xl mb-4 text-gray-300">[ ]</div>
              <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
                {error || 'Provider not found'}
              </h2>
              <button
                onClick={() => router.push(config ? config.backHref : '/dashboard/find')}
                className="mt-4 bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="md:ml-64 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">

          <div className="mb-6">
            <button
              onClick={() => router.push(config.backHref)}
              className="text-sm text-gray-600 hover:text-gray-800 mb-3"
            >
              ← Back to {config.label}s
            </button>
          </div>

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  {config.label}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mt-1">
                  {displayName}
                </h1>
                {provider.contact_person && (
                  <p className="text-sm text-gray-600 mt-1">
                    Contact: {provider.contact_person}
                  </p>
                )}
              </div>
              <span className={`text-xs px-3 py-1.5 rounded ${getTierBadgeClass(provider)}`}>
                {getTierLabel(provider)}
              </span>
            </div>

            {/* Contact buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="bg-[#F47B20] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#E06B10] transition text-sm"
                >
                  Call
                </a>
              )}
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#1ebe5a] transition text-sm"
                >
                  WhatsApp
                </a>
              )}
              {provider.email && (
                <a
                  href={`mailto:${provider.email}`}
                  className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
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
                      className="text-[#F47B20] hover:underline"
                    >
                      {provider.website}
                    </a>
                  }
                />
              )}
            </DetailGrid>
          </Section>

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

              {provider.portfolio_link && (
                <Section title="Portfolio">
                  <a
                    href={provider.portfolio_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#F47B20] hover:underline break-all"
                  >
                    {provider.portfolio_link}
                  </a>
                </Section>
              )}

              {provider.references_text && (
                <Section title="References">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {provider.references_text}
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <h2 className="text-base font-bold text-[#2C3E50] mb-4 pb-2 border-b border-gray-100">
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
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-800 mt-0.5">{value}</div>
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
              <td className="py-2 text-gray-800">{p.name}</td>
              <td className="py-2 text-gray-600">{p.unit}</td>
              <td className="py-2 text-right text-gray-800">
                ${Number(p.price_usd).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
    }
