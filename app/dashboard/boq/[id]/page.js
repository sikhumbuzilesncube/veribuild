'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateFullBOQ } from '@/lib/boq/engine';
import { round2 } from '@/lib/boq/utils';

export default function BOQPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [boq, setBoq] = useState(null);
  const [hardwareStores, setHardwareStores] = useState([]);
  const [constructionCompanies, setConstructionCompanies] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBOQ() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      setProject(projectData);

      let generated;
      try {
        generated = generateFullBOQ(projectData, {
          includeContingency: true,
          contingencyRate: 0.05,
        });
        setBoq(generated);
      } catch (err) {
        console.error('BOQ generation error:', err);
        setError(`Failed to generate BOQ: ${err.message}`);
        setLoading(false);
        return;
      }

      setSaving(true);
      try {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            total_cost: generated.totalCost,
            status: 'completed',
          })
          .eq('id', projectId);
        if (updateError) {
          console.error('Failed to save total cost:', updateError);
        }
      } catch (err) {
        console.error('Error saving total cost:', err);
      }
      setSaving(false);

      await fetchHardwareStores(generated.items);
      const constructionData = await fetchConstructionCompanies();
      setConstructionCompanies(constructionData);
      const workerData = await fetchWorkers();
      setWorkers(workerData);

      setLoading(false);
    }

    loadBOQ();
  }, [projectId, router]);

  async function fetchHardwareStores(boqItems) {
    try {
      const { data: activeStores } = await supabase
        .from('hardware_stores')
        .select('id, store_name, contact_person, phone, location, email, subscription_status')
        .eq('subscription_status', 'active');

      if (!activeStores || activeStores.length === 0) {
        setHardwareStores([]);
        return;
      }

      const storeIds = activeStores.map((s) => s.id);

      const { data: materialsData } = await supabase
        .from('materials')
        .select('name, price_usd, unit, hardware_store_id')
        .in('hardware_store_id', storeIds);

      const storesWithPrices = activeStores.map((store) => {
        const storeMaterials =
          materialsData?.filter((m) => m.hardware_store_id === store.id) || [];

        const matched = [];
        let storeTotal = 0;

        for (const item of boqItems) {
          if (item.section === 'F') continue;
          if (item.isHeader) continue;

          const material = storeMaterials.find(
            (m) => m.name.toLowerCase() === item.name.toLowerCase()
          );
          if (!material) continue;

          const total = round2(item.qty * material.price_usd);
          storeTotal += total;
          matched.push({
            code: item.code,
            name: item.name,
            qty: item.qty,
            unit: material.unit || item.unit,
            price: material.price_usd,
            total,
          });
        }

        return { ...store, materials: matched, total: round2(storeTotal) };
      });

      storesWithPrices.sort((a, b) => a.total - b.total);
      setHardwareStores(storesWithPrices);
    } catch (err) {
      console.error('Error fetching hardware stores:', err);
      setHardwareStores([]);
    }
  }

  async function fetchConstructionCompanies() {
    try {
      const { data, error } = await supabase
        .from('construction_companies')
        .select('*')
        .eq('subscription_status', 'active')
        .eq('is_verified', true);
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }

  async function fetchWorkers() {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('subscription_status', 'active')
        .eq('is_verified', true)
        .eq('availability', 'available')
        .order('rating', { ascending: false });
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }

  // --------------------------------------------------------
  // Roll up child amounts into parent header rows
  // --------------------------------------------------------
  function rollUpHeaderAmounts(sectionItems) {
    const cloned = sectionItems.map((it) => ({ ...it }));

    for (const parent of cloned) {
      if (!parent.isHeader) continue;
      let rollup = 0;
      for (const child of cloned) {
        if (child.code === parent.code) continue;
        if (child.code.startsWith(parent.code + '.')) {
          rollup += child.amount || 0;
        }
      }
      parent.rolledUpAmount = round2(rollup);
    }

    return cloned;
  }

  // --------------------------------------------------------
  // CSV export
  // --------------------------------------------------------
  function downloadCSV() {
    if (!boq) return;

    const rows = [];
    rows.push(['Item', 'Description', 'Unit', 'Qty', 'Rate (USD)', 'Amount (USD)']);
    rows.push(['', `Project: ${project.project_name}`, '', '', '', '']);
    rows.push([
      '',
      `Date: ${new Date().toISOString().split('T')[0]}`,
      '',
      '',
      '',
      '',
    ]);
    rows.push([]);

    for (const section of boq.sections) {
      rows.push([
        `SECTION ${section.letter}`,
        section.title.toUpperCase(),
        '',
        '',
        '',
        '',
      ]);

      const rolled = rollUpHeaderAmounts(section.items);
      for (const item of rolled) {
        const isHeader = item.isHeader;
        const isLabour = item.labour;

        const rateCell = isHeader
          ? ''
          : item.rate != null && item.rate > 0
          ? item.rate.toFixed(2)
          : '';

        let amountCell = '';
        if (isHeader && item.rolledUpAmount != null) {
          amountCell = item.rolledUpAmount.toFixed(2);
        } else if (isLabour) {
          amountCell = 'see Section F';
        } else if (item.amount != null) {
          amountCell = item.amount.toFixed(2);
        }

        rows.push([
          item.code,
          item.description,
          item.unit,
          item.qty,
          rateCell,
          amountCell,
        ]);
      }

      rows.push([
        '',
        `Subtotal ${section.letter}`,
        '',
        '',
        '',
        section.subtotal.toFixed(2),
      ]);
      rows.push([]);
    }

    rows.push(['', 'Subtotal all sections', '', '', '', boq.summary.subtotal.toFixed(2)]);
    rows.push([
      '',
      `Contingency (${(boq.summary.contingencyRate * 100).toFixed(0)}%)`,
      '',
      '',
      '',
      boq.summary.contingency.toFixed(2),
    ]);
    rows.push(['', 'GRAND TOTAL', '', '', '', boq.summary.grandTotal.toFixed(2)]);

    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? '');
            return s.includes(',') || s.includes('"')
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOQ_${project.project_name.replace(/\s+/g, '_')}_${new Date()
      .toISOString()
      .split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // --------------------------------------------------------
  // Loading and error states
  // --------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Generating Bill of Quantities...</p>
        </div>
      </div>
    );
  }

  if (error || !project || !boq) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4 text-gray-300 font-bold">BOQ</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">
            {error || 'Unable to load project'}
          </h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 bg-[#F47B20] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">

        {/* Document header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="border-b-2 border-[#2C3E50] pb-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] uppercase tracking-wide">
              Bill of Quantities
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="grid grid-cols-[120px_1fr] gap-2 mb-1">
                <span className="text-gray-500">Project:</span>
                <span className="font-medium text-[#2C3E50]">{project.project_name}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 mb-1">
                <span className="text-gray-500">Location:</span>
                <span className="font-medium text-[#2C3E50]">
                  {boq.summary.cityId ? `City ID ${boq.summary.cityId}` : 'Not specified'}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 mb-1">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium text-[#2C3E50] capitalize">
                  {project.plan_type || 'residential'}
                </span>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-[120px_1fr] gap-2 mb-1">
                <span className="text-gray-500">Date:</span>
                <span className="font-medium text-[#2C3E50]">
                  {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 mb-1">
                <span className="text-gray-500">Currency:</span>
                <span className="font-medium text-[#2C3E50]">USD</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 mb-1">
                <span className="text-gray-500">Floor area:</span>
                <span className="font-medium text-[#2C3E50]">
                  {project.floor_area || 0} m²
                </span>
              </div>
            </div>
          </div>

          {boq.validation && boq.validation.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <div className="font-semibold mb-1">Input notes:</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {boq.validation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* BOQ sections */}
        {boq.sections.map((section) => {
          const rolled = rollUpHeaderAmounts(section.items);

          return (
            <div
              key={section.letter}
              className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden"
            >
              <div className="bg-[#2C3E50] text-white px-4 sm:px-6 py-3">
                <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
                  Section {section.letter} — {section.title}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="text-left px-3 py-2 w-20 font-semibold">Item</th>
                      <th className="text-left px-3 py-2 font-semibold">Description</th>
                      <th className="text-left px-3 py-2 w-16 font-semibold">Unit</th>
                      <th className="text-right px-3 py-2 w-20 font-semibold">Qty</th>
                      <th className="text-right px-3 py-2 w-24 font-semibold">Rate</th>
                      <th className="text-right px-3 py-2 w-28 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolled.map((item) => {
                      const isHeader = item.isHeader;
                      const isSubLine = !!item.parentCode;
                      const isLabour = item.labour;

                      return (
                        <tr
                          key={item.code}
                          className={
                            isHeader
                              ? 'bg-gray-50 border-b border-gray-200'
                              : 'border-b border-gray-100 hover:bg-gray-50'
                          }
                        >
                          <td
                            className={`px-3 py-2 font-mono text-xs ${
                              isHeader
                                ? 'font-semibold text-[#2C3E50]'
                                : 'text-gray-500'
                            }`}
                          >
                            {item.code}
                          </td>
                          <td
                            className={`px-3 py-2 ${
                              isHeader
                                ? 'font-semibold text-[#2C3E50]'
                                : isSubLine
                                ? 'pl-8 text-gray-700'
                                : 'text-gray-800'
                            }`}
                          >
                            {item.description}
                            {isLabour && item.gangDays != null && (
                              <span className="block text-xs text-gray-500 mt-0.5">
                                {item.gangDays} gang-days (crew of {item.gangSize})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-600 text-xs">
                            {item.unit}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-800 text-xs">
                            {item.qty}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600 text-xs">
                            {isHeader
                              ? ''
                              : isLabour
                              ? ''
                              : item.rate != null && item.rate > 0
                              ? `$${item.rate.toFixed(2)}`
                              : ''}
                          </td>
                          <td
                            className={`px-3 py-2 text-right text-xs ${
                              isHeader
                                ? 'font-semibold text-[#2C3E50]'
                                : 'font-medium text-[#2C3E50]'
                            }`}
                          >
                            {isHeader
                              ? item.rolledUpAmount != null
                                ? `$${item.rolledUpAmount.toFixed(2)}`
                                : '—'
                              : isLabour
                              ? 'see Section F'
                              : item.amount != null
                              ? `$${item.amount.toFixed(2)}`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td
                        colSpan="5"
                        className="px-3 py-3 text-right font-semibold text-gray-700"
                      >
                        Subtotal {section.letter}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-[#2C3E50]">
                        ${section.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-[#2C3E50] mb-6 overflow-hidden">
          <div className="bg-[#2C3E50] text-white px-4 sm:px-6 py-3">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
              Summary
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-600">Subtotal (all sections)</td>
                  <td className="py-2 text-right font-medium text-[#2C3E50]">
                    ${boq.summary.subtotal.toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-600">
                    Contingency ({(boq.summary.contingencyRate * 100).toFixed(0)}%)
                  </td>
                  <td className="py-2 text-right font-medium text-[#2C3E50]">
                    ${boq.summary.contingency.toFixed(2)}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 font-bold text-[#2C3E50] uppercase text-base">
                    Grand Total
                  </td>
                  <td className="py-3 text-right font-bold text-[#2C3E50] text-lg">
                    ${boq.summary.grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {boq.summary.cityMultiplier !== 1.0 && (
              <p className="text-xs text-gray-500 mt-3">
                Prices adjusted by regional factor{' '}
                {boq.summary.cityMultiplier.toFixed(2)}.
              </p>
            )}
          </div>
        </div>

        {/* Hardware store comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2C3E50] mb-1">
            Hardware Store Comparison
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Prices from subscribed hardware stores. Only stocked items are compared.
          </p>

          {hardwareStores && hardwareStores.length > 0 ? (
            <div className="space-y-4">
              {hardwareStores.map((store) => (
                <div key={store.id} className="border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start p-4 bg-gray-50 border-b border-gray-200">
                    <div>
                      <h3 className="font-bold text-[#2C3E50]">{store.store_name}</h3>
                      <p className="text-xs text-gray-500">
                        {store.location || 'Location not set'} ·{' '}
                        {store.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Matched subtotal</div>
                      <div className="text-lg font-bold text-[#2C3E50]">
                        ${store.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {store.materials.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-gray-500">
                          <tr>
                            <th className="text-left px-3 py-2">Item</th>
                            <th className="text-right px-3 py-2">Qty</th>
                            <th className="text-left px-3 py-2">Unit</th>
                            <th className="text-right px-3 py-2">Unit Price</th>
                            <th className="text-right px-3 py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {store.materials.map((m, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-3 py-2">{m.name}</td>
                              <td className="px-3 py-2 text-right">{m.qty}</td>
                              <td className="px-3 py-2">{m.unit}</td>
                              <td className="px-3 py-2 text-right">
                                ${m.price.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                ${m.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="p-4 text-xs text-gray-400">
                      No matching items found in this store&apos;s inventory.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 text-sm">
              No hardware stores are currently subscribed.
            </div>
          )}
        </div>

        {/* Construction companies */}
        {constructionCompanies && constructionCompanies.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2C3E50] mb-4">
              Construction Companies
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {constructionCompanies.map((company) => (
                <div
                  key={company.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-bold text-[#2C3E50]">{company.company_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {company.ad_text || 'No description available'}
                  </p>
                  <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                    {company.phone && <div>Tel: {company.phone}</div>}
                    {company.email && <div>Email: {company.email}</div>}
                    {company.location && <div>Location: {company.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workers */}
        {workers && workers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Available Workers</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold text-[#2C3E50]">{worker.full_name}</h3>
                      <p className="text-sm text-gray-600">{worker.trade}</p>
                      {worker.sub_trade && (
                        <p className="text-xs text-gray-500">{worker.sub_trade}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>Rating: {worker.rating || 0}</div>
                      <div>Rate: ${worker.daily_rate_usd || 0}/day</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {worker.location || 'Location not set'} ·{' '}
                    {worker.years_experience || 0} years
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={downloadCSV}
            className="bg-[#F47B20] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition"
          >
            Download CSV
          </button>
          <button
            onClick={() => window.print()}
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Print
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="border-2 border-[#F47B20] text-[#F47B20] px-6 py-3 rounded-lg font-semibold hover:bg-[#F47B20] hover:text-white transition"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
