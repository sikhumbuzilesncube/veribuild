'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function BOQPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [boqItems, setBoqItems] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [supplierComparison, setSupplierComparison] = useState([]);
  const [workerSuggestions, setWorkerSuggestions] = useState([]);
  const [bestPrice, setBestPrice] = useState(null);

  useEffect(() => {
    async function loadBOQ() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Get project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        setLoading(false);
        return;
      }

      setProject(projectData);

      // Generate BOQ items based on project data
      const items = generateBOQItems(projectData);
      setBoqItems(items);
      
      const total = items.reduce((sum, item) => sum + item.total, 0);
      setTotalCost(total);

      // Generate supplier comparison
      const suppliers = generateSupplierComparison(total);
      setSupplierComparison(suppliers);

      // Find best price
      const best = suppliers.reduce((min, s) => s.price < min.price ? s : min, suppliers[0]);
      setBestPrice(best);

      // Generate worker suggestions
      const workers = generateWorkerSuggestions(projectData);
      setWorkerSuggestions(workers);

      setLoading(false);
    }

    loadBOQ();
  }, [projectId, router]);

  // BOQ Generation Logic
  function generateBOQItems(project) {
    const area = project.floor_area || 50;
    const rooms = project.rooms || 3;
    const doors = project.doors || 2;
    const windows = project.windows || 3;
    const wallLength = project.wall_length || 40;
    const electrical = project.electrical_points || 5;
    const plumbing = project.plumbing_points || 2;

    const items = [];

    // Cement
    const cementQty = Math.round((area * 0.08) * 10) / 10;
    items.push({
      id: 1,
      name: 'Cement 50kg',
      qty: cementQty,
      unit: 'bags',
      unitPrice: 12.50,
      total: Math.round(cementQty * 12.50 * 100) / 100,
      category: 'Cement'
    });

    // Bricks
    const brickQty = Math.round(wallLength * 12);
    items.push({
      id: 2,
      name: 'Standard Brick',
      qty: brickQty,
      unit: 'pieces',
      unitPrice: 0.35,
      total: Math.round(brickQty * 0.35 * 100) / 100,
      category: 'Bricks'
    });

    // Steel Rebar
    const steelQty = Math.round(area * 0.5 * 10) / 10;
    items.push({
      id: 3,
      name: 'Steel Rebar 12mm',
      qty: steelQty,
      unit: 'pieces',
      unitPrice: 8.50,
      total: Math.round(steelQty * 8.50 * 100) / 100,
      category: 'Steel'
    });

    // Timber
    const timberQty = Math.round(wallLength * 0.2 * 10) / 10;
    items.push({
      id: 4,
      name: 'Timber 50x50mm',
      qty: timberQty,
      unit: 'pieces',
      unitPrice: 4.50,
      total: Math.round(timberQty * 4.50 * 100) / 100,
      category: 'Timber'
    });

    // Roofing Sheets
    const roofQty = Math.round((area / 3) * 1.1 * 10) / 10;
    items.push({
      id: 5,
      name: 'Roofing Sheet',
      qty: roofQty,
      unit: 'sheets',
      unitPrice: 14.00,
      total: Math.round(roofQty * 14.00 * 100) / 100,
      category: 'Roofing'
    });

    // Paint
    const paintQty = Math.round((area * 0.4) * 10) / 10;
    items.push({
      id: 6,
      name: 'Wall Paint 20L',
      qty: paintQty,
      unit: 'litres',
      unitPrice: 18.00,
      total: Math.round(paintQty * 18.00 * 100) / 100,
      category: 'Paint'
    });

    // Doors
    if (doors > 0) {
      items.push({
        id: 7,
        name: 'Door Set',
        qty: doors,
        unit: 'sets',
        unitPrice: 50.00,
        total: doors * 50.00,
        category: 'Hardware'
      });
    }

    // Windows
    if (windows > 0) {
      items.push({
        id: 8,
        name: 'Window Set',
        qty: windows,
        unit: 'sets',
        unitPrice: 45.00,
        total: windows * 45.00,
        category: 'Hardware'
      });
    }

    // Electrical
    if (electrical > 0) {
      const cableQty = Math.round((electrical * 10 / 100) * 10) / 10;
      items.push({
        id: 9,
        name: 'Cable 2.5mm²',
        qty: cableQty,
        unit: 'rolls',
        unitPrice: 45.00,
        total: Math.round(cableQty * 45.00 * 100) / 100,
        category: 'Electrical'
      });
    }

    // Plumbing
    if (plumbing > 0) {
      const pipeQty = Math.round((plumbing * 3 / 6) * 10) / 10;
      items.push({
        id: 10,
        name: 'PVC Pipe 50mm',
        qty: pipeQty,
        unit: 'pieces',
        unitPrice: 12.00,
        total: Math.round(pipeQty * 12.00 * 100) / 100,
        category: 'Plumbing'
      });
    }

    // Labour - General
    const labourDays = Math.round((rooms * 2 + doors + windows) * 10) / 10;
    items.push({
      id: 11,
      name: 'General Labourer',
      qty: labourDays,
      unit: 'days',
      unitPrice: 8.00,
      total: Math.round(labourDays * 8.00 * 100) / 100,
      category: 'Labour'
    });

    // Labour - Skilled Mason
    const masonDays = Math.round((rooms * 1.5 + doors) * 10) / 10;
    items.push({
      id: 12,
      name: 'Skilled Mason',
      qty: masonDays,
      unit: 'days',
      unitPrice: 15.00,
      total: Math.round(masonDays * 15.00 * 100) / 100,
      category: 'Labour'
    });

    // Labour - Supervisor
    const supervisorDays = Math.round((rooms * 0.5 + windows) * 10) / 10;
    items.push({
      id: 13,
      name: 'Supervisor',
      qty: supervisorDays,
      unit: 'days',
      unitPrice: 25.00,
      total: Math.round(supervisorDays * 25.00 * 100) / 100,
      category: 'Labour'
    });

    return items;
  }

  // Supplier Comparison Logic
  function generateSupplierComparison(total) {
    const suppliers = [
      { name: 'Builders Warehouse', price: Math.round(total * 0.92 * 100) / 100 },
      { name: 'PPC Zimbabwe', price: Math.round(total * 0.96 * 100) / 100 },
      { name: 'ZimSteel', price: Math.round(total * 0.98 * 100) / 100 },
      { name: 'Local Hardware', price: Math.round(total * 1.0 * 100) / 100 },
    ];
    // Sort by price (cheapest first)
    return suppliers.sort((a, b) => a.price - b.price);
  }

  // Worker Suggestions Logic
  function generateWorkerSuggestions(project) {
    const rooms = project.rooms || 3;
    const area = project.floor_area || 50;

    return [
      { role: 'Skilled Masons', count: 2, days: Math.round(rooms * 3 + 2), rate: 15.00 },
      { role: 'Skilled Carpenters', count: 1, days: Math.round(rooms * 2 + 2), rate: 15.00 },
      { role: 'Electricians', count: 1, days: Math.round(rooms * 1 + 1), rate: 18.00 },
      { role: 'Plumbers', count: 1, days: Math.round(rooms * 0.5 + 2), rate: 18.00 },
      { role: 'General Labourers', count: 3, days: Math.round(rooms * 2 + 4), rate: 8.00 },
      { role: 'Supervisor', count: 1, days: Math.round(rooms * 1 + 3), rate: 25.00 },
    ];
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your BOQ...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">Project not found</h2>
          <p className="text-gray-600">The BOQ you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-[#F47B20] text-white px-6 py-2 rounded-lg hover:bg-[#E06B10] transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">📋 Bill of Quantities</h1>
            <p className="text-gray-600">
              {project.project_name} • {new Date(project.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              {project.plan_type?.charAt(0).toUpperCase() + project.plan_type?.slice(1)} Plan
            </p>
          </div>
          <div className="text-right">
            <div className="bg-[#F47B20] text-white px-6 py-3 rounded-xl">
              <p className="text-sm font-medium">Total Estimated Cost</p>
              <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
            </div>
            {bestPrice && bestPrice.price < totalCost && (
              <p className="text-sm text-green-600 font-semibold mt-2">
                💰 Save ${(totalCost - bestPrice.price).toFixed(2)} with {bestPrice.name}
              </p>
            )}
          </div>
        </div>

        {/* BOQ Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2C3E50] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Material</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Qty</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Unit Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {boqItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#2C3E50]">{item.name}</td>
                    <td className="px-4 py-3 text-sm">{item.qty}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-right text-lg text-[#2C3E50]">TOTAL</td>
                  <td className="px-4 py-4 text-right text-lg text-[#F47B20]">${totalCost.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Supplier Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4">🏪 Supplier Price Comparison</h3>
            <div className="space-y-3">
              {supplierComparison.map((supplier, index) => (
                <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="font-medium text-gray-700">{supplier.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#2C3E50]">${supplier.price.toFixed(2)}</span>
                    {index === 0 && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                        Best Price ✓
                      </span>
                    )}
                    {index > 0 && supplier.price > supplierComparison[0].price && (
                      <span className="text-xs text-red-500">
                        +${(supplier.price - supplierComparison[0].price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Worker Suggestions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4">👷 Suggested Workers</h3>
            <div className="space-y-3">
              {workerSuggestions.map((worker, index) => {
                const totalCost = Math.round(worker.count * worker.days * worker.rate * 100) / 100;
                return (
                  <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <span className="font-medium text-gray-700">{worker.role}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {worker.count} × {worker.days} days
                      </span>
                    </div>
                    <span className="font-bold text-[#2C3E50]">${totalCost.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => {
              // Export as CSV
              const headers = ['Material', 'Qty', 'Unit', 'Unit Price', 'Total'];
              const rows = boqItems.map(item => [
                item.name,
                item.qty,
                item.unit,
                item.unitPrice.toFixed(2),
                item.total.toFixed(2)
              ]);
              const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `BOQ_${project.project_name}_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="bg-[#F47B20] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition"
          >
            📥 Download CSV
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
