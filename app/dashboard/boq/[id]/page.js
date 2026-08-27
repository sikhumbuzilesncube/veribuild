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
      const items = generateFullBOQ(projectData);
      setBoqItems(items);
      
      const total = items.reduce((sum, item) => sum + item.total, 0);
      setTotalCost(total);

      const suppliers = generateSupplierComparison(total);
      setSupplierComparison(suppliers);
      setBestPrice(suppliers[0]);

      const workers = generateWorkerSuggestions(projectData);
      setWorkerSuggestions(workers);

      setLoading(false);
    }

    loadBOQ();
  }, [projectId, router]);

  // ============================================================
  // COMPLETE BOQ GENERATION WITH FOUNDATION, SLAB, AND ALL MATERIALS
  // ============================================================
  function generateFullBOQ(project) {
    const area = project.floor_area || 85;
    const rooms = project.rooms || 4;
    const doors = project.doors || 4;
    const windows = project.windows || 2;
    const wallLength = project.wall_length || 63;
    const wallHeight = project.wall_height || 2.7;
    const foundationDepth = project.foundation_depth || 0.6;
    const foundationWidth = project.foundation_width || 0.4;
    const slabThickness = project.slab_thickness || 0.15;
    
    // Color-coded lengths
    const redWalls = project.red_wall_length || wallLength;
    const greenConcrete = project.green_concrete_area || area;
    const yellowTimber = project.yellow_timber_length || 35;
    const brownSewer = project.brown_sewer_length || 12;
    const blueWater = project.blue_water_length || 18;

    const items = [];

    // ============================================================
    // SECTION A: FOUNDATION
    // ============================================================
    const foundationVolume = wallLength * foundationWidth * foundationDepth;
    
    // A1: Excavation
    items.push({
      id: 'A1',
      name: 'Foundation Excavation',
      qty: Math.round(foundationVolume * 1.1 * 10) / 10,
      unit: 'm³',
      unitPrice: 15.00,
      total: Math.round(foundationVolume * 1.1 * 15.00 * 100) / 100,
      category: 'Foundation'
    });

    // A2: Concrete for Foundation
    items.push({
      id: 'A2',
      name: 'Concrete Mix (Foundation)',
      qty: Math.round(foundationVolume * 1.05 * 10) / 10,
      unit: 'm³',
      unitPrice: 85.00,
      total: Math.round(foundationVolume * 1.05 * 85.00 * 100) / 100,
      category: 'Foundation'
    });

    // A3: Cement for Foundation
    const cementForFoundation = foundationVolume * 1.05 * 6;
    items.push({
      id: 'A3',
      name: 'Cement 50kg (Foundation)',
      qty: Math.round(cementForFoundation * 10) / 10,
      unit: 'bags',
      unitPrice: 12.50,
      total: Math.round(cementForFoundation * 12.50 * 100) / 100,
      category: 'Foundation'
    });

    // A4: Sand for Foundation
    const sandForFoundation = foundationVolume * 1.05 * 0.5;
    items.push({
      id: 'A4',
      name: 'River Sand (Foundation)',
      qty: Math.round(sandForFoundation * 10) / 10,
      unit: 'tonnes',
      unitPrice: 15.00,
      total: Math.round(sandForFoundation * 15.00 * 100) / 100,
      category: 'Foundation'
    });

    // A5: Quarry/Stone for Foundation
    const stoneForFoundation = foundationVolume * 1.05 * 0.8;
    items.push({
      id: 'A5',
      name: 'Crushed Stone (Foundation)',
      qty: Math.round(stoneForFoundation * 10) / 10,
      unit: 'tonnes',
      unitPrice: 18.00,
      total: Math.round(stoneForFoundation * 18.00 * 100) / 100,
      category: 'Foundation'
    });

    // A6: Steel Rebar for Foundation
    const rebarForFoundation = wallLength * 0.8;
    items.push({
      id: 'A6',
      name: 'Steel Rebar 12mm (Foundation)',
      qty: Math.round(rebarForFoundation * 10) / 10,
      unit: 'pieces',
      unitPrice: 8.50,
      total: Math.round(rebarForFoundation * 8.50 * 100) / 100,
      category: 'Foundation'
    });

    // A7: Foundation Bricks/Blocks
    const foundationBricks = wallLength * 8;
    items.push({
      id: 'A7',
      name: 'Foundation Bricks',
      qty: Math.round(foundationBricks),
      unit: 'pieces',
      unitPrice: 0.35,
      total: Math.round(foundationBricks * 0.35 * 100) / 100,
      category: 'Foundation'
    });

    // ============================================================
    // SECTION B: SLAB / GROUND FLOOR
    // ============================================================
    const slabVolume = area * slabThickness;
    
    // B1: Concrete for Slab
    items.push({
      id: 'B1',
      name: 'Concrete Mix (Slab)',
      qty: Math.round(slabVolume * 1.05 * 10) / 10,
      unit: 'm³',
      unitPrice: 85.00,
      total: Math.round(slabVolume * 1.05 * 85.00 * 100) / 100,
      category: 'Slab'
    });

    // B2: Cement for Slab
    const cementForSlab = slabVolume * 1.05 * 6;
    items.push({
      id: 'B2',
      name: 'Cement 50kg (Slab)',
      qty: Math.round(cementForSlab * 10) / 10,
      unit: 'bags',
      unitPrice: 12.50,
      total: Math.round(cementForSlab * 12.50 * 100) / 100,
      category: 'Slab'
    });

    // B3: Sand for Slab
    const sandForSlab = slabVolume * 1.05 * 0.5;
    items.push({
      id: 'B3',
      name: 'River Sand (Slab)',
      qty: Math.round(sandForSlab * 10) / 10,
      unit: 'tonnes',
      unitPrice: 15.00,
      total: Math.round(sandForSlab * 15.00 * 100) / 100,
      category: 'Slab'
    });

    // B4: Stone for Slab
    const stoneForSlab = slabVolume * 1.05 * 0.8;
    items.push({
      id: 'B4',
      name: 'Crushed Stone (Slab)',
      qty: Math.round(stoneForSlab * 10) / 10,
      unit: 'tonnes',
      unitPrice: 18.00,
      total: Math.round(stoneForSlab * 18.00 * 100) / 100,
      category: 'Slab'
    });

    // B5: Steel Mesh for Slab
    const meshForSlab = area * 1.1;
    items.push({
      id: 'B5',
      name: 'Steel Mesh (Slab)',
      qty: Math.round(meshForSlab * 10) / 10,
      unit: 'sheets',
      unitPrice: 25.00,
      total: Math.round(meshForSlab * 25.00 * 100) / 100,
      category: 'Slab'
    });

    // ============================================================
    // SECTION C: WALLS (Red in plan)
    // ============================================================
    const wallArea = wallLength * wallHeight;
    const wallVolume = wallArea * 0.2; // 200mm thick walls

    // C1: Wall Bricks/Blocks
    const wallBricks = wallArea * 45;
    items.push({
      id: 'C1',
      name: 'Cement Blocks (Walls)',
      qty: Math.round(wallBricks),
      unit: 'pieces',
      unitPrice: 1.80,
      total: Math.round(wallBricks * 1.80 * 100) / 100,
      category: 'Walls'
    });

    // C2: Cement for Walls
    const cementForWalls = wallVolume * 4;
    items.push({
      id: 'C2',
      name: 'Cement 50kg (Walls)',
      qty: Math.round(cementForWalls * 10) / 10,
      unit: 'bags',
      unitPrice: 12.50,
      total: Math.round(cementForWalls * 12.50 * 100) / 100,
      category: 'Walls'
    });

    // C3: Sand for Walls
    const sandForWalls = wallVolume * 0.3;
    items.push({
      id: 'C3',
      name: 'River Sand (Walls)',
      qty: Math.round(sandForWalls * 10) / 10,
      unit: 'tonnes',
      unitPrice: 15.00,
      total: Math.round(sandForWalls * 15.00 * 100) / 100,
      category: 'Walls'
    });

    // ============================================================
    // SECTION D: TIMBER (Yellow in plan)
    // ============================================================
    // D1: Timber for Roof/Structure
    items.push({
      id: 'D1',
      name: 'Timber 50x50mm (Structure)',
      qty: Math.round(yellowTimber * 0.8 * 10) / 10,
      unit: 'pieces',
      unitPrice: 4.50,
      total: Math.round(yellowTimber * 0.8 * 4.50 * 100) / 100,
      category: 'Timber'
    });

    items.push({
      id: 'D2',
      name: 'Timber 100x50mm (Roof)',
      qty: Math.round(yellowTimber * 0.6 * 10) / 10,
      unit: 'pieces',
      unitPrice: 8.00,
      total: Math.round(yellowTimber * 0.6 * 8.00 * 100) / 100,
      category: 'Timber'
    });

    // ============================================================
    // SECTION E: ROOFING
    // ============================================================
    const roofArea = area * 1.15;
    items.push({
      id: 'E1',
      name: 'Roofing Sheets',
      qty: Math.round(roofArea / 3 * 10) / 10,
      unit: 'sheets',
      unitPrice: 14.00,
      total: Math.round(roofArea / 3 * 14.00 * 100) / 100,
      category: 'Roofing'
    });

    items.push({
      id: 'E2',
      name: 'Roofing Nails',
      qty: Math.round((roofArea / 3) * 0.2 * 10) / 10,
      unit: 'kg',
      unitPrice: 3.50,
      total: Math.round((roofArea / 3) * 0.2 * 3.50 * 100) / 100,
      category: 'Roofing'
    });

    // ============================================================
    // SECTION F: DOORS & WINDOWS
    // ============================================================
    if (doors > 0) {
      items.push({
        id: 'F1',
        name: 'Door Sets',
        qty: doors,
        unit: 'sets',
        unitPrice: 120.00,
        total: doors * 120.00,
        category: 'Doors'
      });
      
      items.push({
        id: 'F2',
        name: 'Door Handles & Locks',
        qty: doors,
        unit: 'sets',
        unitPrice: 25.00,
        total: doors * 25.00,
        category: 'Doors'
      });
    }

    if (windows > 0) {
      items.push({
        id: 'F3',
        name: 'Window Sets',
        qty: windows,
        unit: 'sets',
        unitPrice: 95.00,
        total: windows * 95.00,
        category: 'Windows'
      });
    }

    // ============================================================
    // SECTION G: FINISHES
    // ============================================================
    // G1: Floor Tiles
    items.push({
      id: 'G1',
      name: 'Floor Tiles',
      qty: Math.round(area * 1.05 * 10) / 10,
      unit: 'm²',
      unitPrice: 15.00,
      total: Math.round(area * 1.05 * 15.00 * 100) / 100,
      category: 'Finishes'
    });

    // G2: Paint (Walls + Ceiling)
    const paintArea = wallArea * 2 + area; // 2 coats on walls + ceiling
    items.push({
      id: 'G2',
      name: 'Wall Paint 20L',
      qty: Math.round(paintArea / 8 * 10) / 10,
      unit: 'litres',
      unitPrice: 18.00,
      total: Math.round(paintArea / 8 * 18.00 * 100) / 100,
      category: 'Finishes'
    });

    // G3: Ceiling
    items.push({
      id: 'G3',
      name: 'Ceiling Boards',
      qty: Math.round(area / 3 * 10) / 10,
      unit: 'sheets',
      unitPrice: 12.00,
      total: Math.round(area / 3 * 12.00 * 100) / 100,
      category: 'Finishes'
    });

    // ============================================================
    // SECTION H: SEWER (Brown in plan)
    // ============================================================
    if (brownSewer > 0) {
      items.push({
        id: 'H1',
        name: 'Sewer Pipe 100mm',
        qty: Math.round(brownSewer / 6 * 10) / 10,
        unit: 'pieces',
        unitPrice: 18.00,
        total: Math.round(brownSewer / 6 * 18.00 * 100) / 100,
        category: 'Sewer'
      });
      
      items.push({
        id: 'H2',
        name: 'Sewer Fittings',
        qty: 1,
        unit: 'lot',
        unitPrice: 50.00,
        total: 50.00,
        category: 'Sewer'
      });
    }

    // ============================================================
    // SECTION I: WATER (Blue in plan)
    // ============================================================
    if (blueWater > 0) {
      items.push({
        id: 'I1',
        name: 'Water Pipe 50mm',
        qty: Math.round(blueWater / 6 * 10) / 10,
        unit: 'pieces',
        unitPrice: 12.00,
        total: Math.round(blueWater / 6 * 12.00 * 100) / 100,
        category: 'Water'
      });
      
      items.push({
        id: 'I2',
        name: 'Water Fittings',
        qty: 1,
        unit: 'lot',
        unitPrice: 40.00,
        total: 40.00,
        category: 'Water'
      });
    }

    // ============================================================
    // SECTION J: ELECTRICAL
    // ============================================================
    const electricalPoints = project.electrical_points || 8;
    if (electricalPoints > 0) {
      items.push({
        id: 'J1',
        name: 'Cable 2.5mm²',
        qty: Math.round(electricalPoints * 2 / 100 * 10) / 10,
        unit: 'rolls',
        unitPrice: 45.00,
        total: Math.round(electricalPoints * 2 / 100 * 45.00 * 100) / 100,
        category: 'Electrical'
      });
      
      items.push({
        id: 'J2',
        name: 'Electrical Boxes & Switches',
        qty: electricalPoints,
        unit: 'sets',
        unitPrice: 5.00,
        total: electricalPoints * 5.00,
        category: 'Electrical'
      });
    }

    // ============================================================
    // SECTION K: LABOUR
    // ============================================================
    const labourDays = Math.round((rooms * 3 + doors + windows + 2) * 10) / 10;
    const masonDays = Math.round((rooms * 2 + doors + windows) * 10) / 10;
    const supervisorDays = Math.round((rooms * 0.8 + 2) * 10) / 10;

    items.push({
      id: 'K1',
      name: 'General Labourers',
      qty: labourDays,
      unit: 'days',
      unitPrice: 8.00,
      total: Math.round(labourDays * 8.00 * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'K2',
      name: 'Skilled Masons',
      qty: masonDays,
      unit: 'days',
      unitPrice: 15.00,
      total: Math.round(masonDays * 15.00 * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'K3',
      name: 'Carpenters',
      qty: Math.round(masonDays * 0.6 * 10) / 10,
      unit: 'days',
      unitPrice: 15.00,
      total: Math.round(masonDays * 0.6 * 15.00 * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'K4',
      name: 'Plumbers',
      qty: Math.round((doors + windows) * 0.5 * 10) / 10,
      unit: 'days',
      unitPrice: 18.00,
      total: Math.round((doors + windows) * 0.5 * 18.00 * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'K5',
      name: 'Electricians',
      qty: Math.round(electricalPoints * 0.5 * 10) / 10,
      unit: 'days',
      unitPrice: 18.00,
      total: Math.round(electricalPoints * 0.5 * 18.00 * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'K6',
      name: 'Supervisors',
      qty: supervisorDays,
      unit: 'days',
      unitPrice: 25.00,
      total: Math.round(supervisorDays * 25.00 * 100) / 100,
      category: 'Labour'
    });

    return items;
  }

  // Supplier Comparison
  function generateSupplierComparison(total) {
    const suppliers = [
      { name: 'Builders Warehouse', price: Math.round(total * 0.92 * 100) / 100 },
      { name: 'PPC Zimbabwe', price: Math.round(total * 0.96 * 100) / 100 },
      { name: 'ZimSteel', price: Math.round(total * 0.98 * 100) / 100 },
      { name: 'Local Hardware', price: Math.round(total * 1.0 * 100) / 100 },
    ];
    return suppliers.sort((a, b) => a.price - b.price);
  }

  // Worker Suggestions
  function generateWorkerSuggestions(project) {
    const rooms = project.rooms || 4;
    const area = project.floor_area || 85;

    return [
      { role: 'Skilled Masons', count: 2, days: Math.round(rooms * 3 + 4), rate: 15.00 },
      { role: 'Carpenters', count: 1, days: Math.round(rooms * 2 + 3), rate: 15.00 },
      { role: 'Electricians', count: 1, days: Math.round(rooms * 1 + 2), rate: 18.00 },
      { role: 'Plumbers', count: 1, days: Math.round(rooms * 0.5 + 3), rate: 18.00 },
      { role: 'General Labourers', count: 3, days: Math.round(rooms * 2 + 6), rate: 8.00 },
      { role: 'Supervisors', count: 1, days: Math.round(rooms * 0.8 + 3), rate: 25.00 },
    ];
  }

  // ============================================================
  // RENDER
  // ============================================================
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

  // Group items by category
  const categories = {};
  boqItems.forEach(item => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  });

  const categoryTotals = {};
  Object.keys(categories).forEach(cat => {
    categoryTotals[cat] = categories[cat].reduce((sum, item) => sum + item.total, 0);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">📋 Bill of Quantities</h1>
            <p className="text-gray-600">
              {project.project_name} • {new Date(project.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              {project.plan_type?.charAt(0).toUpperCase() + project.plan_type?.slice(1)} Plan
            </p>
            {project.room_labels && (
              <p className="text-sm text-gray-500">Rooms: {project.room_labels}</p>
            )}
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

        {/* BOQ Table by Category */}
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
                {Object.keys(categories).map((cat, catIndex) => (
                  <>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan="6" className="px-4 py-2 text-[#2C3E50]">
                        {cat.toUpperCase()}
                      </td>
                    </tr>
                    {categories[cat].map((item, idx) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#2C3E50]">{item.name}</td>
                        <td className="px-4 py-3 text-sm">{item.qty}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan="5" className="px-4 py-2 text-right text-[#2C3E50]">
                        {cat} Total
                      </td>
                      <td className="px-4 py-2 text-right text-[#F47B20]">
                        ${categoryTotals[cat].toFixed(2)}
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
              <tfoot className="bg-[#2C3E50] text-white font-bold">
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-right text-lg">GRAND TOTAL</td>
                  <td className="px-4 py-4 text-right text-lg">${totalCost.toFixed(2)}</td>
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
              const headers = ['Material', 'Category', 'Qty', 'Unit', 'Unit Price', 'Total'];
              const rows = boqItems.map(item => [
                item.name,
                item.category,
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
