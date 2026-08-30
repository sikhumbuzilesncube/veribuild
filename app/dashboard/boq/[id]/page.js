'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ============================================================
// WINDOW CODE DECODER - WITH SYMBOLS & STEEL WINDOWS
// ============================================================
function decodeWindowCode(code) {
  const windowCodes = {
    'PT66': { height: 600, width: 600, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PT99': { height: 900, width: 900, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PT129': { height: 1200, width: 900, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PT1212': { height: 1200, width: 1200, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PT1515': { height: 1500, width: 1500, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PTT1212': { height: 1200, width: 1200, type: 'top-hung', vents: 2, category: 'PT Series' },
    'PTT1515': { height: 1500, width: 1500, type: 'top-hung', vents: 2, category: 'PT Series' },
    'PTT915': { height: 900, width: 1500, type: 'top-hung', vents: 2, category: 'PT Series' },
    'P4T1815': { height: 1800, width: 1500, type: 'top-hung', vents: 4, category: 'PT Series' },
    'PS69': { height: 600, width: 900, type: 'side-hung', vents: 1, category: 'PS Series' },
    'PS1212': { height: 1200, width: 1200, type: 'side-hung', vents: 1, category: 'PS Series' },
    'PSS1212': { height: 1200, width: 1200, type: 'side-hung', vents: 2, category: 'PS Series' },
    'PSS1512': { height: 1500, width: 1200, type: 'side-hung', vents: 2, category: 'PS Series' },
    'HS1212': { height: 1200, width: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
    'HS1512': { height: 1500, width: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
    'HS1812': { height: 1800, width: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
    'HS2415': { height: 2400, width: 1500, type: 'sliding', vents: 1, category: 'HS Series' },
    'HS306': { height: 3000, width: 600, type: 'sliding', vents: 1, category: 'HS Series' },
  };

  const steelWindowTypes = {};
  for (let i = 1; i <= 233; i++) {
    steelWindowTypes[`N${i}`] = { 
      height: 303, 
      width: 303, 
      type: 'steel', 
      vents: 1, 
      category: 'Steel Window' 
    };
  }

  if (windowCodes[code]) return windowCodes[code];
  if (steelWindowTypes[code]) return steelWindowTypes[code];
  
  const match = code.match(/^([A-Z]+)(\d{2})(\d{2})$/);
  if (match) {
    const [, type, h, w] = match;
    const height = parseInt(h) * 100;
    const width = parseInt(w) * 100;
    let vents = 1;
    if (type.includes('TT')) vents = 2;
    if (type.includes('4T')) vents = 4;
    if (type.includes('SS')) vents = 2;
    return {
      height,
      width,
      type: type.includes('HS') ? 'sliding' : 
            type.includes('PS') ? 'side-hung' : 'top-hung',
      vents,
      category: 'Custom',
      isCustom: true
    };
  }
  return null;
}

function decodeDoorCode(code) {
  const doorCodes = {
    'D1': { leafWidth: 813, leafHeight: 2032, type: 'single', category: 'Standard' },
    'D2': { leafWidth: 762, leafHeight: 2032, type: 'single', category: 'Standard' },
    'DD': { leafWidth: 1626, leafHeight: 2032, type: 'double', category: 'Standard' },
    'FD1': { leafWidth: 900, leafHeight: 2100, type: 'fire', category: 'Specialty' },
    'PD1': { leafWidth: 1200, leafHeight: 2100, type: 'pivot', category: 'Specialty' },
  };
  if (doorCodes[code]) return doorCodes[code];
  return null;
}

// ============================================================
// MAIN BOQ PAGE
// ============================================================
export default function BOQPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [boqItems, setBoqItems] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [hardwareStores, setHardwareStores] = useState([]);
  const [workerSuggestions, setWorkerSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);

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

      // Generate BOQ items with quantities (NO PRICES)
      const items = generateFullBOQ(projectData);
      setBoqItems(items);
      
      const total = items.reduce((sum, item) => sum + item.total, 0);
      setTotalCost(total);

      // Fetch hardware stores with their prices
      await fetchHardwareStores(items);

      const workers = generateWorkerSuggestions(projectData);
      setWorkerSuggestions(workers);

      setSaving(true);
      try {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            total_cost: total,
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
      setLoading(false);
    }

    loadBOQ();
  }, [projectId, router]);

  // ============================================================
  // FETCH HARDWARE STORES WITH PRICES
  // ============================================================
  async function fetchHardwareStores(items) {
    try {
      // Get all active hardware stores
      const { data: stores, error } = await supabase
        .from('hardware_stores')
        .select(`
          id,
          store_name,
          contact_person,
          phone,
          location,
          email,
          materials (
            name,
            price_usd,
            unit
          )
        `)
        .eq('subscription_status', 'active');

      if (error) {
        console.error('Error fetching hardware stores:', error);
        return;
      }

      // For each store, find matching materials
      const storesWithPrices = stores.map(store => {
        const matchedMaterials = [];
        for (const item of items) {
          // More flexible matching
const material = store.materials?.find(m => {
  const matName = m.name.toLowerCase();
  const itemName = item.name.toLowerCase();
  // Check if one contains the other
  return matName.includes(itemName) || itemName.includes(matName);
});
          if (material) {
            matchedMaterials.push({
              name: item.name,
              qty: item.qty,
              unit: material.unit || item.unit,
              price: material.price_usd,
              total: Math.round(item.qty * material.price_usd * 100) / 100
            });
          }
        }
        return {
          ...store,
          materials: matchedMaterials,
          total: matchedMaterials.reduce((sum, m) => sum + m.total, 0)
        };
      });

      setHardwareStores(storesWithPrices);
    } catch (err) {
      console.error('Error fetching hardware stores:', err);
    }
  }

  // ============================================================
  // BOQ GENERATION (Quantities only, NO PRICES)
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
    
    const yellowTimber = project.yellow_timber_length || 35;
    const brownSewer = project.brown_sewer_length || 12;
    const blueWater = project.blue_water_length || 18;

    const items = [];

    // Extract window codes
    const windowDetails = project.window_details || '';
    const windowCodes = windowDetails.match(/[A-Z]{2,4}\d{4,6}/g) || [];
    const uniqueWindowCodes = [...new Set(windowCodes)];

    const doorDetails = project.door_details || '';
    const doorCodes = doorDetails.match(/D\d+|DD|FD\d+|PD\d+|SD\d{4}/g) || [];
    const uniqueDoorCodes = [...new Set(doorCodes)];

    // ============================================================
    // SECTION A: FOUNDATION (Quantities only)
    // ============================================================
    const foundationVolume = wallLength * foundationWidth * foundationDepth;
    
    items.push({
      id: 'A1',
      name: 'Foundation Excavation',
      qty: Math.round(foundationVolume * 1.1 * 10) / 10,
      unit: 'm³',
      category: 'Foundation'
    });

    items.push({
      id: 'A2',
      name: 'Concrete Mix',
      qty: Math.round(foundationVolume * 1.05 * 10) / 10,
      unit: 'm³',
      category: 'Foundation'
    });

    const cementForFoundation = foundationVolume * 1.05 * 6;
    items.push({
      id: 'A3',
      name: 'Cement 50kg',
      qty: Math.round(cementForFoundation * 10) / 10,
      unit: 'bags',
      category: 'Foundation'
    });

    const sandForFoundation = foundationVolume * 1.05 * 0.5;
    items.push({
      id: 'A4',
      name: 'River Sand',
      qty: Math.round(sandForFoundation * 10) / 10,
      unit: 'tonnes',
      category: 'Foundation'
    });

    const stoneForFoundation = foundationVolume * 1.05 * 0.8;
    items.push({
      id: 'A5',
      name: 'Crushed Stone',
      qty: Math.round(stoneForFoundation * 10) / 10,
      unit: 'tonnes',
      category: 'Foundation'
    });

    const rebarForFoundation = wallLength * 0.8;
    items.push({
      id: 'A6',
      name: 'Steel Rebar 12mm',
      qty: Math.round(rebarForFoundation * 10) / 10,
      unit: 'pieces',
      category: 'Foundation'
    });

    const foundationBricks = wallLength * 8;
    items.push({
      id: 'A7',
      name: 'Foundation Bricks',
      qty: Math.round(foundationBricks),
      unit: 'pieces',
      category: 'Foundation'
    });

    // ============================================================
    // SECTION B: SLAB
    // ============================================================
    const slabVolume = area * slabThickness;
    
    items.push({
      id: 'B1',
      name: 'Concrete Mix',
      qty: Math.round(slabVolume * 1.05 * 10) / 10,
      unit: 'm³',
      category: 'Slab'
    });

    const cementForSlab = slabVolume * 1.05 * 6;
    items.push({
      id: 'B2',
      name: 'Cement 50kg',
      qty: Math.round(cementForSlab * 10) / 10,
      unit: 'bags',
      category: 'Slab'
    });

    const sandForSlab = slabVolume * 1.05 * 0.5;
    items.push({
      id: 'B3',
      name: 'River Sand',
      qty: Math.round(sandForSlab * 10) / 10,
      unit: 'tonnes',
      category: 'Slab'
    });

    const stoneForSlab = slabVolume * 1.05 * 0.8;
    items.push({
      id: 'B4',
      name: 'Crushed Stone',
      qty: Math.round(stoneForSlab * 10) / 10,
      unit: 'tonnes',
      category: 'Slab'
    });

    const meshForSlab = area * 1.1;
    items.push({
      id: 'B5',
      name: 'Steel Mesh',
      qty: Math.round(meshForSlab * 10) / 10,
      unit: 'sheets',
      category: 'Slab'
    });

    // ============================================================
    // SECTION C: WALLS
    // ============================================================
    const wallArea = wallLength * wallHeight;
    const wallVolume = wallArea * 0.2;

    const wallBricks = wallArea * 65;
    items.push({
      id: 'C1',
      name: 'Standard Bricks',
      qty: Math.round(wallBricks),
      unit: 'pieces',
      category: 'Walls'
    });

    const cementForWalls = wallVolume * 4;
    items.push({
      id: 'C2',
      name: 'Cement 50kg',
      qty: Math.round(cementForWalls * 10) / 10,
      unit: 'bags',
      category: 'Walls'
    });

    const sandForWalls = wallVolume * 0.3;
    items.push({
      id: 'C3',
      name: 'River Sand',
      qty: Math.round(sandForWalls * 10) / 10,
      unit: 'tonnes',
      category: 'Walls'
    });

    // ============================================================
    // SECTION D: TIMBER
    // ============================================================
    items.push({
      id: 'D1',
      name: 'Timber 50x50mm',
      qty: Math.round(yellowTimber * 0.8 * 10) / 10,
      unit: 'pieces',
      category: 'Timber'
    });

    items.push({
      id: 'D2',
      name: 'Timber 100x50mm',
      qty: Math.round(yellowTimber * 0.6 * 10) / 10,
      unit: 'pieces',
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
      category: 'Roofing'
    });

    items.push({
      id: 'E2',
      name: 'Roofing Nails',
      qty: Math.round((roofArea / 3) * 0.2 * 10) / 10,
      unit: 'kg',
      category: 'Roofing'
    });

    // ============================================================
    // SECTION F: WINDOWS
    // ============================================================
    for (const code of uniqueWindowCodes) {
      const decoded = decodeWindowCode(code);
      if (decoded) {
        const sizeInfo = `${decoded.height}×${decoded.width}mm`;
        const typeInfo = decoded.category || decoded.type;
        items.push({
          id: `WIN-${code}`,
          name: `Window ${code} (${typeInfo}) - ${sizeInfo}`,
          qty: 1,
          unit: 'window',
          category: 'Windows'
        });
      }
    }

    if (uniqueWindowCodes.length === 0 && windows > 0) {
      items.push({
        id: 'WIN-DEFAULT',
        name: `Windows (${windows} windows)`,
        qty: windows,
        unit: 'windows',
        category: 'Windows'
      });
    }

    // ============================================================
    // SECTION G: DOORS
    // ============================================================
    for (const code of uniqueDoorCodes) {
      const decoded = decodeDoorCode(code);
      if (decoded) {
        items.push({
          id: `DOOR-${code}`,
          name: `Door ${code} (${decoded.category}) - ${decoded.leafWidth}×${decoded.leafHeight}mm`,
          qty: 1,
          unit: 'door',
          category: 'Doors'
        });
      }
    }

    if (uniqueDoorCodes.length === 0 && doors > 0) {
      items.push({
        id: 'DOOR-DEFAULT',
        name: `Doors (${doors} doors)`,
        qty: doors,
        unit: 'doors',
        category: 'Doors'
      });
    }

    // ============================================================
    // SECTION H: FINISHES
    // ============================================================
    items.push({
      id: 'H1',
      name: 'Floor Tiles',
      qty: Math.round(area * 1.05 * 10) / 10,
      unit: 'm²',
      category: 'Finishes'
    });

    const paintArea = wallArea * 2 + area;
    items.push({
      id: 'H2',
      name: 'Wall Paint 20L',
      qty: Math.round(paintArea / 8 * 10) / 10,
      unit: 'litres',
      category: 'Finishes'
    });

    items.push({
      id: 'H3',
      name: 'Ceiling Boards',
      qty: Math.round(area / 3 * 10) / 10,
      unit: 'sheets',
      category: 'Finishes'
    });

    // ============================================================
    // SECTION I: SEWER
    // ============================================================
    if (brownSewer > 0) {
      items.push({
        id: 'I1',
        name: 'Sewer Pipe 100mm',
        qty: Math.round(brownSewer / 6 * 10) / 10,
        unit: 'pieces',
        category: 'Sewer'
      });
      
      items.push({
        id: 'I2',
        name: 'Sewer Fittings',
        qty: 1,
        unit: 'lot',
        category: 'Sewer'
      });
    }

    // ============================================================
    // SECTION J: WATER
    // ============================================================
    if (blueWater > 0) {
      items.push({
        id: 'J1',
        name: 'Water Pipe 50mm',
        qty: Math.round(blueWater / 6 * 10) / 10,
        unit: 'pieces',
        category: 'Water'
      });
      
      items.push({
        id: 'J2',
        name: 'Water Fittings',
        qty: 1,
        unit: 'lot',
        category: 'Water'
      });
    }

    // ============================================================
    // SECTION K: ELECTRICAL
    // ============================================================
    const electricalPoints = project.electrical_points || 8;
    if (electricalPoints > 0) {
      items.push({
        id: 'K1',
        name: 'Cable 2.5mm²',
        qty: Math.round(electricalPoints * 2 / 100 * 10) / 10,
        unit: 'rolls',
        category: 'Electrical'
      });
      
      items.push({
        id: 'K2',
        name: 'Electrical Boxes & Switches',
        qty: electricalPoints,
        unit: 'sets',
        category: 'Electrical'
      });
    }

    // ============================================================
    // SECTION L: LABOUR (Quantities only)
    // ============================================================
    const labourDays = Math.round((rooms * 3 + doors + windows + 2) * 10) / 10;
    const masonDays = Math.round((rooms * 2 + doors + windows) * 10) / 10;
    const supervisorDays = Math.round((rooms * 0.8 + 2) * 10) / 10;

    items.push({
      id: 'L1',
      name: 'General Labourers',
      qty: labourDays,
      unit: 'days',
      category: 'Labour'
    });

    items.push({
      id: 'L2',
      name: 'Skilled Masons',
      qty: masonDays,
      unit: 'days',
      category: 'Labour'
    });

    items.push({
      id: 'L3',
      name: 'Carpenters',
      qty: Math.round(masonDays * 0.6 * 10) / 10,
      unit: 'days',
      category: 'Labour'
    });

    items.push({
      id: 'L4',
      name: 'Plumbers',
      qty: Math.round((doors + windows) * 0.5 * 10) / 10,
      unit: 'days',
      category: 'Labour'
    });

    items.push({
      id: 'L5',
      name: 'Electricians',
      qty: Math.round(electricalPoints * 0.5 * 10) / 10,
      unit: 'days',
      category: 'Labour'
    });

    items.push({
      id: 'L6',
      name: 'Supervisors',
      qty: supervisorDays,
      unit: 'days',
      category: 'Labour'
    });

    // Calculate total (using default prices for now)
    return items.map(item => ({
      ...item,
      unitPrice: 0, // No price in BOQ
      total: 0 // No price in BOQ
    }));
  }

  // ============================================================
  // WORKER SUGGESTIONS
  // ============================================================
  function generateWorkerSuggestions(project) {
    const rooms = project.rooms || 4;
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

  const categories = {};
  boqItems.forEach(item => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
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
            {hardwareStores.length > 0 && hardwareStores[0]?.total < totalCost && (
              <p className="text-sm text-green-600 font-semibold mt-2">
                💰 Save ${(totalCost - hardwareStores[0].total).toFixed(2)} with {hardwareStores[0].store_name}
              </p>
            )}
          </div>
        </div>

        {/* BOQ Table - Quantities Only */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2C3E50] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Material</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Qty</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(categories).map((cat) => (
                  <>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan="4" className="px-4 py-2 text-[#2C3E50]">{cat.toUpperCase()}</td>
                    </tr>
                    {categories[cat].map((item, idx) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#2C3E50]">{item.name}</td>
                        <td className="px-4 py-3 text-sm">{item.qty}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hardware Stores Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">🏪 Hardware Store Prices</h2>
          <p className="text-sm text-gray-500 mb-4">Compare prices from subscribed hardware stores</p>
          
          {hardwareStores.length > 0 ? (
            <div className="space-y-6">
              {hardwareStores.map((store) => (
                <div key={store.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-[#2C3E50]">{store.store_name}</h3>
                      <p className="text-sm text-gray-500">{store.location || 'No location'}</p>
                      <p className="text-sm text-gray-500">📞 {store.phone || 'No phone'}</p>
                      <p className="text-sm text-gray-500">📧 {store.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-[#2C3E50]">${store.total.toFixed(2)}</p>
                      {store.total < totalCost && (
                        <span className="text-xs text-green-600 font-semibold">Save ${(totalCost - store.total).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  
                  {store.materials.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b">
                            <th className="pb-2">Product</th>
                            <th className="pb-2">Qty</th>
                            <th className="pb-2">Unit</th>
                            <th className="pb-2">Price</th>
                            <th className="pb-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {store.materials.map((mat, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-2 font-medium">{mat.name}</td>
                              <td className="py-2">{mat.qty}</td>
                              <td className="py-2">{mat.unit}</td>
                              <td className="py-2">${mat.price.toFixed(2)}</td>
                              <td className="py-2 font-bold">${mat.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No matching materials found in this store's inventory.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🏪</div>
              <p className="text-gray-500">No hardware stores subscribed yet</p>
              <p className="text-sm text-gray-400">Check back later for price comparisons</p>
            </div>
          )}
        </div>

        {/* Worker Suggestions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-4">👷 Suggested Workers</h2>
          <div className="grid md:grid-cols-2 gap-4">
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

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => {
              const headers = ['Material', 'Category', 'Qty', 'Unit'];
              const rows = boqItems.map(item => [
                item.name, item.category, item.qty, item.unit
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
