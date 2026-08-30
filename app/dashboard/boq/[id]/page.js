'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ============================================================
// WINDOW CODE DECODER - WITH SYMBOLS & STEEL WINDOWS
// ============================================================
function decodeWindowCode(code) {
  // SA Standard Window Codes
  const windowCodes = {
    // PT Series - Top Hung
    'PT66': { height: 600, width: 600, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PT99': { height: 900, width: 900, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PT129': { height: 1200, width: 900, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PT1212': { height: 1200, width: 1200, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PT1515': { height: 1500, width: 1500, type: 'top-hung', vents: 1, category: 'PT Series' },
    'PTT1212': { height: 1200, width: 1200, type: 'top-hung', vents: 2, category: 'PT Series' },
    'PTT1515': { height: 1500, width: 1500, type: 'top-hung', vents: 2, category: 'PT Series' },
    'PTT915': { height: 900, width: 1500, type: 'top-hung', vents: 2, category: 'PT Series' },
    'P4T1815': { height: 1800, width: 1500, type: 'top-hung', vents: 4, category: 'PT Series' },
    
    // PS Series - Side Hung
    'PS69': { height: 600, width: 900, type: 'side-hung', vents: 1, category: 'PS Series' },
    'PS1212': { height: 1200, width: 1200, type: 'side-hung', vents: 1, category: 'PS Series' },
    'PSS1212': { height: 1200, width: 1200, type: 'side-hung', vents: 2, category: 'PS Series' },
    'PSS1512': { height: 1500, width: 1200, type: 'side-hung', vents: 2, category: 'PS Series' },
    
    // HS Series - Sliding
    'HS1212': { height: 1200, width: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
    'HS1512': { height: 1500, width: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
    'HS1812': { height: 1800, width: 1200, type: 'sliding', vents: 1, category: 'HS Series' },
    'HS2415': { height: 2400, width: 1500, type: 'sliding', vents: 1, category: 'HS Series' },
    'HS306': { height: 3000, width: 600, type: 'sliding', vents: 1, category: 'HS Series' },
  };

  // Steel Window Types (N1-N230) - From your screenshot
  const steelWindowTypes = {};
  for (let i = 1; i <= 230; i++) {
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

// ============================================================
// DOOR CODE DECODER
// ============================================================
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
// WINDOW SYMBOL DETECTION
// ============================================================
function detectWindowSymbols(text) {
  const symbols = [];
  if (text.match(/─┐|casement|side-hung|opens outward/i)) {
    symbols.push({ type: 'casement', description: 'Casement Window' });
  }
  if (text.match(/═══|sliding|slider|overlapping/i)) {
    symbols.push({ type: 'sliding', description: 'Sliding Window' });
  }
  if (text.match(/───|fixed|non-opening|fixed light/i)) {
    symbols.push({ type: 'fixed', description: 'Fixed Window' });
  }
  if (text.match(/N\d{1,3}/i)) {
    symbols.push({ type: 'steel', description: 'Steel Window' });
  }
  return symbols;
}

// ============================================================
// DOOR SYMBOL DETECTION
// ============================================================
function detectDoorSymbols(text) {
  const symbols = [];
  if (text.match(/single door|door swing|arc/i)) {
    symbols.push({ type: 'single', description: 'Single Door' });
  }
  if (text.match(/double door|two arcs|double swing/i)) {
    symbols.push({ type: 'double', description: 'Double Door' });
  }
  if (text.match(/sliding door|slider|bypass/i)) {
    symbols.push({ type: 'sliding', description: 'Sliding Door' });
  }
  if (text.match(/bifold|folding door|bi-fold/i)) {
    symbols.push({ type: 'bifold', description: 'Bifold Door' });
  }
  if (text.match(/pocket door|hidden|into wall/i)) {
    symbols.push({ type: 'pocket', description: 'Pocket Door' });
  }
  if (text.match(/open doorway|archway|wall opening/i)) {
    symbols.push({ type: 'open', description: 'Open Doorway' });
  }
  return symbols;
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
  const [supplierComparison, setSupplierComparison] = useState([]);
  const [workerSuggestions, setWorkerSuggestions] = useState([]);
  const [bestPrice, setBestPrice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hardwarePrices, setHardwarePrices] = useState({});
  const [windowSymbols, setWindowSymbols] = useState([]);
  const [doorSymbols, setDoorSymbols] = useState([]);

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

      // Detect symbols from project notes
      const notes = projectData.notes || '';
      setWindowSymbols(detectWindowSymbols(notes));
      setDoorSymbols(detectDoorSymbols(notes));

      await fetchAllHardwarePrices();

      const items = generateFullBOQ(projectData);
      setBoqItems(items);
      
      const total = items.reduce((sum, item) => sum + item.total, 0);
      setTotalCost(total);

      const suppliers = await generateSupplierComparison(items);
      setSupplierComparison(suppliers);
      if (suppliers.length > 0) {
        setBestPrice(suppliers[0]);
      }

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
  // FETCH HARDWARE PRICES
  // ============================================================
  async function fetchAllHardwarePrices() {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          name,
          price_usd,
          hardware_store_id,
          hardware_stores (
            store_name,
            subscription_status,
            location,
            phone
          )
        `)
        .eq('hardware_stores.subscription_status', 'active');

      if (error) {
        console.error('Error fetching hardware prices:', error);
        return;
      }

      const priceMap = {};
      for (const item of data || []) {
        const name = item.name;
        if (!priceMap[name]) {
          priceMap[name] = [];
        }
        priceMap[name].push({
          price: item.price_usd,
          store: item.hardware_stores?.store_name || 'Unknown Store',
          location: item.hardware_stores?.location || '',
          phone: item.hardware_stores?.phone || '',
        });
      }

      setHardwarePrices(priceMap);
    } catch (err) {
      console.error('Error fetching hardware prices:', err);
    }
  }

  // ============================================================
  // GET BEST PRICE FOR A MATERIAL
  // ============================================================
  function getBestPriceForMaterial(materialName) {
    const prices = hardwarePrices[materialName] || [];
    if (prices.length === 0) return null;
    const sorted = [...prices].sort((a, b) => a.price - b.price);
    return sorted[0];
  }

  function getAllPricesForMaterial(materialName) {
    return hardwarePrices[materialName] || [];
  }

  // ============================================================
  // GENERATE SUPPLIER COMPARISON
  // ============================================================
  async function generateSupplierComparison(items) {
    const supplierTotals = {};

    for (const item of items) {
      const prices = getAllPricesForMaterial(item.name);
      if (prices.length === 0) continue;

      for (const p of prices) {
        const storeName = p.store;
        if (!supplierTotals[storeName]) {
          supplierTotals[storeName] = 0;
        }
        const ratio = p.price / item.unitPrice;
        supplierTotals[storeName] += item.total * ratio;
      }
    }

    const result = Object.entries(supplierTotals)
      .map(([name, total]) => ({
        name,
        price: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => a.price - b.price);

    if (result.length === 0) {
      const total = items.reduce((sum, item) => sum + item.total, 0);
      return [
        { name: 'Builders Warehouse', price: Math.round(total * 0.92 * 100) / 100 },
        { name: 'PPC Zimbabwe', price: Math.round(total * 0.96 * 100) / 100 },
        { name: 'ZimSteel', price: Math.round(total * 0.98 * 100) / 100 },
        { name: 'Local Hardware', price: Math.round(total * 1.0 * 100) / 100 },
      ];
    }

    return result;
  }

  // ============================================================
  // BOQ GENERATION
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

    // Extract door codes
    const doorDetails = project.door_details || '';
    const doorCodes = doorDetails.match(/D\d+|DD|FD\d+|PD\d+|SD\d{4}/g) || [];
    const uniqueDoorCodes = [...new Set(doorCodes)];

    // ============================================================
    // SECTION A: FOUNDATION
    // ============================================================
    const foundationVolume = wallLength * foundationWidth * foundationDepth;
    
    const foundationPrices = {
      excavation: getBestPriceForMaterial('Foundation Excavation')?.price || 15.00,
      concrete: getBestPriceForMaterial('Concrete Mix')?.price || 85.00,
      cement: getBestPriceForMaterial('Cement 50kg')?.price || 12.50,
      sand: getBestPriceForMaterial('River Sand')?.price || 15.00,
      stone: getBestPriceForMaterial('Crushed Stone')?.price || 18.00,
      rebar: getBestPriceForMaterial('Steel Rebar 12mm')?.price || 8.50,
      bricks: getBestPriceForMaterial('Foundation Bricks')?.price || 0.35,
    };

    items.push({
      id: 'A1',
      name: 'Foundation Excavation',
      qty: Math.round(foundationVolume * 1.1 * 10) / 10,
      unit: 'm³',
      unitPrice: foundationPrices.excavation,
      total: Math.round(foundationVolume * 1.1 * foundationPrices.excavation * 100) / 100,
      category: 'Foundation'
    });

    items.push({
      id: 'A2',
      name: 'Concrete Mix (Foundation)',
      qty: Math.round(foundationVolume * 1.05 * 10) / 10,
      unit: 'm³',
      unitPrice: foundationPrices.concrete,
      total: Math.round(foundationVolume * 1.05 * foundationPrices.concrete * 100) / 100,
      category: 'Foundation'
    });

    const cementForFoundation = foundationVolume * 1.05 * 6;
    items.push({
      id: 'A3',
      name: 'Cement 50kg (Foundation)',
      qty: Math.round(cementForFoundation * 10) / 10,
      unit: 'bags',
      unitPrice: foundationPrices.cement,
      total: Math.round(cementForFoundation * foundationPrices.cement * 100) / 100,
      category: 'Foundation'
    });

    const sandForFoundation = foundationVolume * 1.05 * 0.5;
    items.push({
      id: 'A4',
      name: 'River Sand (Foundation)',
      qty: Math.round(sandForFoundation * 10) / 10,
      unit: 'tonnes',
      unitPrice: foundationPrices.sand,
      total: Math.round(sandForFoundation * foundationPrices.sand * 100) / 100,
      category: 'Foundation'
    });

    const stoneForFoundation = foundationVolume * 1.05 * 0.8;
    items.push({
      id: 'A5',
      name: 'Crushed Stone (Foundation)',
      qty: Math.round(stoneForFoundation * 10) / 10,
      unit: 'tonnes',
      unitPrice: foundationPrices.stone,
      total: Math.round(stoneForFoundation * foundationPrices.stone * 100) / 100,
      category: 'Foundation'
    });

    const rebarForFoundation = wallLength * 0.8;
    items.push({
      id: 'A6',
      name: 'Steel Rebar 12mm (Foundation)',
      qty: Math.round(rebarForFoundation * 10) / 10,
      unit: 'pieces',
      unitPrice: foundationPrices.rebar,
      total: Math.round(rebarForFoundation * foundationPrices.rebar * 100) / 100,
      category: 'Foundation'
    });

    const foundationBricks = wallLength * 8;
    items.push({
      id: 'A7',
      name: 'Foundation Bricks',
      qty: Math.round(foundationBricks),
      unit: 'pieces',
      unitPrice: foundationPrices.bricks,
      total: Math.round(foundationBricks * foundationPrices.bricks * 100) / 100,
      category: 'Foundation'
    });

    // ============================================================
    // SECTION B: SLAB
    // ============================================================
    const slabVolume = area * slabThickness;
    
    const slabPrices = {
      concrete: getBestPriceForMaterial('Concrete Mix')?.price || 85.00,
      cement: getBestPriceForMaterial('Cement 50kg')?.price || 12.50,
      sand: getBestPriceForMaterial('River Sand')?.price || 15.00,
      stone: getBestPriceForMaterial('Crushed Stone')?.price || 18.00,
      mesh: getBestPriceForMaterial('Steel Mesh')?.price || 25.00,
    };

    items.push({
      id: 'B1',
      name: 'Concrete Mix (Slab)',
      qty: Math.round(slabVolume * 1.05 * 10) / 10,
      unit: 'm³',
      unitPrice: slabPrices.concrete,
      total: Math.round(slabVolume * 1.05 * slabPrices.concrete * 100) / 100,
      category: 'Slab'
    });

    const cementForSlab = slabVolume * 1.05 * 6;
    items.push({
      id: 'B2',
      name: 'Cement 50kg (Slab)',
      qty: Math.round(cementForSlab * 10) / 10,
      unit: 'bags',
      unitPrice: slabPrices.cement,
      total: Math.round(cementForSlab * slabPrices.cement * 100) / 100,
      category: 'Slab'
    });

    const sandForSlab = slabVolume * 1.05 * 0.5;
    items.push({
      id: 'B3',
      name: 'River Sand (Slab)',
      qty: Math.round(sandForSlab * 10) / 10,
      unit: 'tonnes',
      unitPrice: slabPrices.sand,
      total: Math.round(sandForSlab * slabPrices.sand * 100) / 100,
      category: 'Slab'
    });

    const stoneForSlab = slabVolume * 1.05 * 0.8;
    items.push({
      id: 'B4',
      name: 'Crushed Stone (Slab)',
      qty: Math.round(stoneForSlab * 10) / 10,
      unit: 'tonnes',
      unitPrice: slabPrices.stone,
      total: Math.round(stoneForSlab * slabPrices.stone * 100) / 100,
      category: 'Slab'
    });

    const meshForSlab = area * 1.1;
    items.push({
      id: 'B5',
      name: 'Steel Mesh (Slab)',
      qty: Math.round(meshForSlab * 10) / 10,
      unit: 'sheets',
      unitPrice: slabPrices.mesh,
      total: Math.round(meshForSlab * slabPrices.mesh * 100) / 100,
      category: 'Slab'
    });

    // ============================================================
    // SECTION C: WALLS
    // ============================================================
    const wallArea = wallLength * wallHeight;
    const wallVolume = wallArea * 0.2;

    const wallPrices = {
      bricks: getBestPriceForMaterial('Standard Brick')?.price || 0.35,
      cement: getBestPriceForMaterial('Cement 50kg')?.price || 12.50,
      sand: getBestPriceForMaterial('River Sand')?.price || 15.00,
    };

    const wallBricks = wallArea * 65;
    items.push({
      id: 'C1',
      name: 'Standard Bricks (Walls)',
      qty: Math.round(wallBricks),
      unit: 'pieces',
      unitPrice: wallPrices.bricks,
      total: Math.round(wallBricks * wallPrices.bricks * 100) / 100,
      category: 'Walls'
    });

    const cementForWalls = wallVolume * 4;
    items.push({
      id: 'C2',
      name: 'Cement 50kg (Walls)',
      qty: Math.round(cementForWalls * 10) / 10,
      unit: 'bags',
      unitPrice: wallPrices.cement,
      total: Math.round(cementForWalls * wallPrices.cement * 100) / 100,
      category: 'Walls'
    });

    const sandForWalls = wallVolume * 0.3;
    items.push({
      id: 'C3',
      name: 'River Sand (Walls)',
      qty: Math.round(sandForWalls * 10) / 10,
      unit: 'tonnes',
      unitPrice: wallPrices.sand,
      total: Math.round(sandForWalls * wallPrices.sand * 100) / 100,
      category: 'Walls'
    });

    // ============================================================
    // SECTION D: TIMBER
    // ============================================================
    const timberPrices = {
      timber1: getBestPriceForMaterial('Timber 50x50mm')?.price || 4.50,
      timber2: getBestPriceForMaterial('Timber 100x50mm')?.price || 8.00,
    };

    items.push({
      id: 'D1',
      name: 'Timber 50x50mm (Structure)',
      qty: Math.round(yellowTimber * 0.8 * 10) / 10,
      unit: 'pieces',
      unitPrice: timberPrices.timber1,
      total: Math.round(yellowTimber * 0.8 * timberPrices.timber1 * 100) / 100,
      category: 'Timber'
    });

    items.push({
      id: 'D2',
      name: 'Timber 100x50mm (Roof)',
      qty: Math.round(yellowTimber * 0.6 * 10) / 10,
      unit: 'pieces',
      unitPrice: timberPrices.timber2,
      total: Math.round(yellowTimber * 0.6 * timberPrices.timber2 * 100) / 100,
      category: 'Timber'
    });

    // ============================================================
    // SECTION E: ROOFING
    // ============================================================
    const roofArea = area * 1.15;
    const roofPrices = {
      sheets: getBestPriceForMaterial('Roofing Sheet')?.price || 14.00,
      nails: getBestPriceForMaterial('Roofing Nails')?.price || 3.50,
    };

    items.push({
      id: 'E1',
      name: 'Roofing Sheets',
      qty: Math.round(roofArea / 3 * 10) / 10,
      unit: 'sheets',
      unitPrice: roofPrices.sheets,
      total: Math.round(roofArea / 3 * roofPrices.sheets * 100) / 100,
      category: 'Roofing'
    });

    items.push({
      id: 'E2',
      name: 'Roofing Nails',
      qty: Math.round((roofArea / 3) * 0.2 * 10) / 10,
      unit: 'kg',
      unitPrice: roofPrices.nails,
      total: Math.round((roofArea / 3) * 0.2 * roofPrices.nails * 100) / 100,
      category: 'Roofing'
    });

    // ============================================================
    // SECTION F: WINDOWS (with Steel N1-N230 support)
    // ============================================================
    for (const code of uniqueWindowCodes) {
      const decoded = decodeWindowCode(code);
      if (decoded) {
        let price = 95;
        if (decoded.type === 'sliding') price = 120;
        else if (decoded.type === 'steel') price = 85;
        else if (decoded.type === 'casement') price = 110;
        
        const sizeInfo = `${decoded.height}×${decoded.width}mm`;
        const typeInfo = decoded.category || decoded.type;
        
        items.push({
          id: `WIN-${code}`,
          name: `Window ${code} (${typeInfo}) - ${sizeInfo}`,
          qty: 1,
          unit: 'window',
          unitPrice: price,
          total: price,
          category: 'Windows'
        });
      }
    }

    // Fallback windows
    if (uniqueWindowCodes.length === 0 && windows > 0) {
      items.push({
        id: 'WIN-DEFAULT',
        name: `Windows (${windows} windows)`,
        qty: windows,
        unit: 'windows',
        unitPrice: 95.00,
        total: windows * 95.00,
        category: 'Windows'
      });
    }

    // ============================================================
    // SECTION G: DOORS
    // ============================================================
    for (const code of uniqueDoorCodes) {
      const decoded = decodeDoorCode(code);
      if (decoded) {
        let price = 120;
        if (decoded.type === 'fire') price = 250;
        else if (decoded.type === 'pivot') price = 300;
        else if (decoded.type === 'double') price = 220;
        
        items.push({
          id: `DOOR-${code}`,
          name: `Door ${code} (${decoded.category}) - ${decoded.leafWidth}×${decoded.leafHeight}mm`,
          qty: 1,
          unit: 'door',
          unitPrice: price,
          total: price,
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
        unitPrice: 120.00,
        total: doors * 120.00,
        category: 'Doors'
      });
    }

    // ============================================================
    // SECTION H: FINISHES
    // ============================================================
    const finishPrices = {
      tiles: getBestPriceForMaterial('Floor Tiles')?.price || 15.00,
      paint: getBestPriceForMaterial('Wall Paint 20L')?.price || 18.00,
      ceiling: getBestPriceForMaterial('Ceiling Board')?.price || 12.00,
    };

    items.push({
      id: 'H1',
      name: 'Floor Tiles',
      qty: Math.round(area * 1.05 * 10) / 10,
      unit: 'm²',
      unitPrice: finishPrices.tiles,
      total: Math.round(area * 1.05 * finishPrices.tiles * 100) / 100,
      category: 'Finishes'
    });

    const paintArea = wallArea * 2 + area;
    items.push({
      id: 'H2',
      name: 'Wall Paint 20L',
      qty: Math.round(paintArea / 8 * 10) / 10,
      unit: 'litres',
      unitPrice: finishPrices.paint,
      total: Math.round(paintArea / 8 * finishPrices.paint * 100) / 100,
      category: 'Finishes'
    });

    items.push({
      id: 'H3',
      name: 'Ceiling Boards',
      qty: Math.round(area / 3 * 10) / 10,
      unit: 'sheets',
      unitPrice: finishPrices.ceiling,
      total: Math.round(area / 3 * finishPrices.ceiling * 100) / 100,
      category: 'Finishes'
    });

    // ============================================================
    // SECTION I: SEWER
    // ============================================================
    if (brownSewer > 0) {
      const sewerPrice = getBestPriceForMaterial('Sewer Pipe 100mm')?.price || 18.00;
      
      items.push({
        id: 'I1',
        name: 'Sewer Pipe 100mm',
        qty: Math.round(brownSewer / 6 * 10) / 10,
        unit: 'pieces',
        unitPrice: sewerPrice,
        total: Math.round(brownSewer / 6 * sewerPrice * 100) / 100,
        category: 'Sewer'
      });
      
      items.push({
        id: 'I2',
        name: 'Sewer Fittings',
        qty: 1,
        unit: 'lot',
        unitPrice: 50.00,
        total: 50.00,
        category: 'Sewer'
      });
    }

    // ============================================================
    // SECTION J: WATER
    // ============================================================
    if (blueWater > 0) {
      const waterPrice = getBestPriceForMaterial('Water Pipe 50mm')?.price || 12.00;
      
      items.push({
        id: 'J1',
        name: 'Water Pipe 50mm',
        qty: Math.round(blueWater / 6 * 10) / 10,
        unit: 'pieces',
        unitPrice: waterPrice,
        total: Math.round(blueWater / 6 * waterPrice * 100) / 100,
        category: 'Water'
      });
      
      items.push({
        id: 'J2',
        name: 'Water Fittings',
        qty: 1,
        unit: 'lot',
        unitPrice: 40.00,
        total: 40.00,
        category: 'Water'
      });
    }

    // ============================================================
    // SECTION K: ELECTRICAL
    // ============================================================
    const electricalPoints = project.electrical_points || 8;
    if (electricalPoints > 0) {
      const cablePrice = getBestPriceForMaterial('Cable 2.5mm²')?.price || 45.00;
      
      items.push({
        id: 'K1',
        name: 'Cable 2.5mm²',
        qty: Math.round(electricalPoints * 2 / 100 * 10) / 10,
        unit: 'rolls',
        unitPrice: cablePrice,
        total: Math.round(electricalPoints * 2 / 100 * cablePrice * 100) / 100,
        category: 'Electrical'
      });
      
      items.push({
        id: 'K2',
        name: 'Electrical Boxes & Switches',
        qty: electricalPoints,
        unit: 'sets',
        unitPrice: 5.00,
        total: electricalPoints * 5.00,
        category: 'Electrical'
      });
    }

    // ============================================================
    // SECTION L: LABOUR
    // ============================================================
    const labourDays = Math.round((rooms * 3 + doors + windows + 2) * 10) / 10;
    const masonDays = Math.round((rooms * 2 + doors + windows) * 10) / 10;
    const supervisorDays = Math.round((rooms * 0.8 + 2) * 10) / 10;

    const labourPrices = {
      general: getBestPriceForMaterial('General Labourer')?.price || 8.00,
      mason: getBestPriceForMaterial('Skilled Mason')?.price || 15.00,
      carpenter: getBestPriceForMaterial('Skilled Carpenter')?.price || 15.00,
      plumber: getBestPriceForMaterial('Skilled Plumber')?.price || 18.00,
      electrician: getBestPriceForMaterial('Skilled Electrician')?.price || 18.00,
      supervisor: getBestPriceForMaterial('Supervisor')?.price || 25.00,
    };

    items.push({
      id: 'L1',
      name: 'General Labourers',
      qty: labourDays,
      unit: 'days',
      unitPrice: labourPrices.general,
      total: Math.round(labourDays * labourPrices.general * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'L2',
      name: 'Skilled Masons',
      qty: masonDays,
      unit: 'days',
      unitPrice: labourPrices.mason,
      total: Math.round(masonDays * labourPrices.mason * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'L3',
      name: 'Carpenters',
      qty: Math.round(masonDays * 0.6 * 10) / 10,
      unit: 'days',
      unitPrice: labourPrices.carpenter,
      total: Math.round(masonDays * 0.6 * labourPrices.carpenter * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'L4',
      name: 'Plumbers',
      qty: Math.round((doors + windows) * 0.5 * 10) / 10,
      unit: 'days',
      unitPrice: labourPrices.plumber,
      total: Math.round((doors + windows) * 0.5 * labourPrices.plumber * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'L5',
      name: 'Electricians',
      qty: Math.round(electricalPoints * 0.5 * 10) / 10,
      unit: 'days',
      unitPrice: labourPrices.electrician,
      total: Math.round(electricalPoints * 0.5 * labourPrices.electrician * 100) / 100,
      category: 'Labour'
    });

    items.push({
      id: 'L6',
      name: 'Supervisors',
      qty: supervisorDays,
      unit: 'days',
      unitPrice: labourPrices.supervisor,
      total: Math.round(supervisorDays * labourPrices.supervisor * 100) / 100,
      category: 'Labour'
    });

    return items;
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

  const categoryTotals = {};
  Object.keys(categories).forEach(cat => {
    categoryTotals[cat] = categories[cat].reduce((sum, item) => sum + item.total, 0);
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
            {/* Show detected symbols */}
            {windowSymbols.length > 0 && (
              <p className="text-xs text-gray-400">Window Symbols: {windowSymbols.map(s => s.description).join(', ')}</p>
            )}
            {doorSymbols.length > 0 && (
              <p className="text-xs text-gray-400">Door Symbols: {doorSymbols.map(s => s.description).join(', ')}</p>
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
                {Object.keys(categories).map((cat) => (
                  <>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan="6" className="px-4 py-2 text-[#2C3E50]">{cat.toUpperCase()}</td>
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
                      <td colSpan="5" className="px-4 py-2 text-right text-[#2C3E50]">{cat} Total</td>
                      <td className="px-4 py-2 text-right text-[#F47B20]">${categoryTotals[cat].toFixed(2)}</td>
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
            {supplierComparison.length > 0 ? (
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
            ) : (
              <p className="text-gray-500">No hardware stores subscribed yet. Check back later!</p>
            )}
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
                item.name, item.category, item.qty, item.unit,
                item.unitPrice.toFixed(2), item.total.toFixed(2)
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
