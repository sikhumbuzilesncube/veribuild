'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const BUILDING_CATEGORIES = [
  { value: 'residential', label: 'Residential' },
  { value: 'rural',       label: 'Rural / Auxiliary' },
];

const RESIDENTIAL_TYPES = [
  { value: 'house',      label: 'House',           multiplier: 1.00 },
  { value: 'cottage',    label: 'Cottage',         multiplier: 0.85 },
  { value: 'outbuilding', label: 'Outbuilding',    multiplier: 0.70 },
  { value: 'commercial', label: 'Commercial',      multiplier: 1.60 },
];

const RURAL_TYPES = [
  { value: 'kitchen_round',  label: 'Kitchen hut (round)',  floorArea: 12,  wallLength: 11, rooms: 1, doors: 1, windows: 1, plumbing: 0, electrical: 0 },
  { value: 'kitchen_square', label: 'Kitchen hut (square)', floorArea: 9,   wallLength: 12, rooms: 1, doors: 1, windows: 1, plumbing: 0, electrical: 1 },
  { value: 'toilet_block',   label: 'Toilet block',          floorArea: 2,   wallLength: 6,  rooms: 1, doors: 1, windows: 0, plumbing: 1, electrical: 0 },
  { value: 'shower',         label: 'Shower enclosure',      floorArea: 2.5, wallLength: 6,  rooms: 1, doors: 1, windows: 0, plumbing: 1, electrical: 0 },
  { value: 'storeroom',      label: 'Storeroom',             floorArea: 12,  wallLength: 14, rooms: 1, doors: 1, windows: 1, plumbing: 0, electrical: 1 },
  { value: 'cottage_1room',  label: 'Single-room cottage',   floorArea: 12,  wallLength: 14, rooms: 1, doors: 2, windows: 2, plumbing: 0, electrical: 2 },
  { value: 'cottage_2room',  label: 'Two-room cottage',      floorArea: 24,  wallLength: 20, rooms: 2, doors: 3, windows: 3, plumbing: 1, electrical: 3 },
  { value: 'workshop',       label: 'Workshop / shed',       floorArea: 20,  wallLength: 18, rooms: 1, doors: 1, windows: 2, plumbing: 0, electrical: 3 },
];

const BEDROOM_OPTIONS = [
  { value: '1', label: '1 bedroom',  baseArea: 45 },
  { value: '2', label: '2 bedrooms', baseArea: 65 },
  { value: '3', label: '3 bedrooms', baseArea: 90 },
  { value: '4', label: '4 bedrooms', baseArea: 120 },
  { value: '5', label: '5+ bedrooms', baseArea: 160 },
];

const BATHROOM_OPTIONS = [
  { value: '1', label: '1 bathroom',  extraArea: 0 },
  { value: '2', label: '2 bathrooms', extraArea: 4 },
  { value: '3', label: '3+ bathrooms', extraArea: 8 },
];

const GARAGE_OPTIONS = [
  { value: 'none',   label: 'No garage',     extraArea: 0,  extraRooms: 0 },
  { value: 'single', label: 'Single garage', extraArea: 18, extraRooms: 1 },
  { value: 'double', label: 'Double garage', extraArea: 36, extraRooms: 1 },
];

const FINISH_OPTIONS = [
  { value: 'basic',    label: 'Basic',    multiplier: 1.00 },
  { value: 'standard', label: 'Standard', multiplier: 1.15 },
  { value: 'premium',  label: 'Premium',  multiplier: 1.30 },
];

const RESIDENTIAL_ROOF_OPTIONS = [
  { value: 'ibr',      label: 'IBR Sheet' },
  { value: 'chromadek', label: 'Chromadek Sheet' },
  { value: 'tile',     label: 'Concrete Tile' },
];

const RURAL_ROOF_OPTIONS = [
  { value: 'ibr',      label: 'IBR Sheet',  multiplier: 1.00 },
  { value: 'asbestos', label: 'Asbestos',   multiplier: 1.10 },
  { value: 'thatch',   label: 'Thatch',     multiplier: 0.90 },
  { value: 'tile',     label: 'Concrete Tile', multiplier: 1.30 },
];

const CITIES = [
  { id: 1, name: 'Harare' },
  { id: 2, name: 'Bulawayo' },
  { id: 3, name: 'Mutare' },
  { id: 4, name: 'Gweru' },
  { id: 5, name: 'Kwekwe' },
  { id: 6, name: 'Masvingo' },
  { id: 7, name: 'Chinhoyi' },
  { id: 8, name: 'Marondera' },
];

export default function TemplatePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState({
    project_name: '',
    category: 'residential',
    building_type: 'house',
    rural_type: 'kitchen_square',
    bedrooms: '3',
    bathrooms: '2',
    garage: 'none',
    finish: 'standard',
    roof: 'ibr',
    city_id: '1',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    // Reset roof when switching categories, since roof options differ
    setFormData({
      ...formData,
      category,
      roof: 'ibr',
    });
  };

  const computeResidentialEstimates = () => {
    const building = RESIDENTIAL_TYPES.find((b) => b.value === formData.building_type);
    const bedrooms = BEDROOM_OPTIONS.find((b) => b.value === formData.bedrooms);
    const bathrooms = BATHROOM_OPTIONS.find((b) => b.value === formData.bathrooms);
    const garage = GARAGE_OPTIONS.find((g) => g.value === formData.garage);
    const finish = FINISH_OPTIONS.find((f) => f.value === formData.finish);

    if (!building || !bedrooms || !bathrooms || !garage || !finish) return null;

    let floorArea = bedrooms.baseArea;
    floorArea += bathrooms.extraArea;
    floorArea += garage.extraArea;
    floorArea *= finish.multiplier;
    floorArea *= building.multiplier;
    floorArea = Math.round(floorArea * 10) / 10;

    const wallLength = Math.round(4 * Math.sqrt(floorArea) * 1.15 * 10) / 10;

    const bedroomCount = formData.bedrooms === '5' ? 5 : parseInt(formData.bedrooms, 10);
    const bathroomCount = formData.bathrooms === '3' ? 3 : parseInt(formData.bathrooms, 10);
    const rooms = bedroomCount + bathroomCount + 3 + garage.extraRooms;
    const doors = bedroomCount + bathroomCount + 3 + garage.extraRooms;
    const windows = bedroomCount + 2 + bathroomCount;
    const electricalPoints = rooms * 2 + 4;
    const plumbingPoints = bathroomCount + 1;

    return {
      floorArea,
      wallLength,
      rooms,
      doors,
      windows,
      electricalPoints,
      plumbingPoints,
      roofType: formData.roof,
      summaryLabel: `${building.label}, ${bedrooms.label}, ${bathrooms.label}, ${garage.label}, ${finish.label} finish, ${formData.roof.toUpperCase()} roof`,
      structureLabel: building.label,
    };
  };

  const computeRuralEstimates = () => {
    const structure = RURAL_TYPES.find((r) => r.value === formData.rural_type);
    const finish = FINISH_OPTIONS.find((f) => f.value === formData.finish);
    const roof = RURAL_ROOF_OPTIONS.find((r) => r.value === formData.roof);

    if (!structure || !finish || !roof) return null;

    // Apply finish multiplier to floor area, and roof multiplier for cost adjustment
    // Floor area is scaled by finish only (finish affects size of structure)
    // Roof multiplier is applied to quantities that depend on roof, and reflected in cost through BOQ
    let floorArea = structure.floorArea * finish.multiplier;
    floorArea = Math.round(floorArea * 10) / 10;

    // Wall length scaled by square root of area ratio, matching finish scale
    const areaRatio = floorArea / structure.floorArea;
    const wallLength = Math.round(structure.wallLength * Math.sqrt(areaRatio) * 10) / 10;

    return {
      floorArea,
      wallLength,
      rooms: structure.rooms,
      doors: structure.doors,
      windows: structure.windows,
      electricalPoints: structure.electrical,
      plumbingPoints: structure.plumbing,
      roofType: formData.roof,
      roofMultiplier: roof.multiplier,
      summaryLabel: `${structure.label}, ${finish.label} finish, ${roof.label} roof`,
      structureLabel: structure.label,
    };
  };

  const computeEstimates = () => {
    if (formData.category === 'rural') {
      return computeRuralEstimates();
    }
    return computeResidentialEstimates();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setStatus('');

    if (!formData.project_name || formData.project_name.trim() === '') {
      setError('Please enter a project name');
      setSaving(false);
      return;
    }

    const estimates = computeEstimates();
    if (!estimates) {
      setError('Could not compute estimates. Please check your selections.');
      setSaving(false);
      return;
    }

    setStatus('Creating project...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const userId = session.user.id;

      const notes = `Generated from template. ${estimates.summaryLabel}. Quantities are typical for this configuration and require verification against actual site conditions.`;

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            user_id: userId,
            project_name: formData.project_name.trim(),
            city_id: parseInt(formData.city_id, 10),
            plan_type: formData.category === 'rural' ? 'rural' : 'residential',
            status: 'processing',
            file_url: null,
            floor_area: estimates.floorArea,
            wall_length: estimates.wallLength,
            rooms: estimates.rooms,
            doors: estimates.doors,
            windows: estimates.windows,
            electrical_points: estimates.electricalPoints,
            plumbing_points: estimates.plumbingPoints,
            wall_height: 2.7,
            foundation_type: 'strip',
            foundation_depth: 0.6,
            foundation_width: 0.4,
            slab_type: 'ground',
            slab_thickness: 0.15,
            concrete_grade: 'C20',
            soil_type: 'not_sure',
            plan_scale: '1:100',
            notes,
          },
        ])
        .select();

      if (projectError) {
        console.error('Template project error:', projectError);
        setError(`Failed to create project: ${projectError.message}`);
        setSaving(false);
        setStatus('');
        return;
      }

      const projectId = projectData[0].id;

      setStatus('Redirecting to verification...');

      setTimeout(() => {
        router.push(`/dashboard/verify/${projectId}`);
      }, 1000);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setSaving(false);
      setStatus('');
    }
  };

  const estimates = computeEstimates();
  const isRural = formData.category === 'rural';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            Template-based BOQ - $5
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            Build a BOQ Without a Plan
          </h1>
          <p className="text-gray-600 text-sm">
            Answer a few questions about the structure you are planning to build.
            We will generate a Bill of Quantities based on typical sizes for that configuration.
            You can review and edit every value before generating the final BOQ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <Section title="Project">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Project Name"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                placeholder="e.g., 3-bed house in Waterfalls"
                required
              />
              <SelectInput
                label="Location"
                name="city_id"
                value={formData.city_id}
                onChange={handleChange}
                options={CITIES.map((c) => ({ value: String(c.id), label: c.name }))}
              />
            </div>
          </Section>

          <Section title="Category">
            <RadioGroup
              name="category"
              value={formData.category}
              onChange={handleCategoryChange}
              options={BUILDING_CATEGORIES}
            />
          </Section>

          {!isRural && (
            <>
              <Section title="Building Type">
                <RadioGroup
                  name="building_type"
                  value={formData.building_type}
                  onChange={handleChange}
                  options={RESIDENTIAL_TYPES.map((b) => ({ value: b.value, label: b.label }))}
                />
              </Section>

              <Section title="Bedrooms">
                <RadioGroup
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  options={BEDROOM_OPTIONS.map((b) => ({ value: b.value, label: b.label }))}
                />
              </Section>

              <Section title="Bathrooms">
                <RadioGroup
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  options={BATHROOM_OPTIONS.map((b) => ({ value: b.value, label: b.label }))}
                />
              </Section>

              <Section title="Garage">
                <RadioGroup
                  name="garage"
                  value={formData.garage}
                  onChange={handleChange}
                  options={GARAGE_OPTIONS.map((g) => ({ value: g.value, label: g.label }))}
                />
              </Section>
            </>
          )}

          {isRural && (
            <>
              <Section title="Structure Type">
                <RadioGroup
                  name="rural_type"
                  value={formData.rural_type}
                  onChange={handleChange}
                  options={RURAL_TYPES.map((r) => ({ value: r.value, label: r.label }))}
                />
              </Section>
            </>
          )}

          <Section title="Finish Level">
            <RadioGroup
              name="finish"
              value={formData.finish}
              onChange={handleChange}
              options={FINISH_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
            />
          </Section>

          <Section title="Roof Type">
            {isRural ? (
              <RadioGroup
                name="roof"
                value={formData.roof}
                onChange={handleChange}
                options={RURAL_ROOF_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
              />
            ) : (
              <RadioGroup
                name="roof"
                value={formData.roof}
                onChange={handleChange}
                options={RESIDENTIAL_ROOF_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
              />
            )}
          </Section>

          {estimates && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <div className="font-semibold text-blue-900 mb-3">
                Estimated Size
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-blue-700">Floor area</div>
                  <div className="font-mono font-medium text-blue-900">{estimates.floorArea} m²</div>
                </div>
                <div>
                  <div className="text-xs text-blue-700">Wall length</div>
                  <div className="font-mono font-medium text-blue-900">{estimates.wallLength} m</div>
                </div>
                <div>
                  <div className="text-xs text-blue-700">Rooms</div>
                  <div className="font-mono font-medium text-blue-900">{estimates.rooms}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-700">Doors</div>
                  <div className="font-mono font-medium text-blue-900">{estimates.doors}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-700">Windows</div>
                  <div className="font-mono font-medium text-blue-900">{estimates.windows}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-700">Electrical points</div>
                  <div className="font-mono font-medium text-blue-900">{estimates.electricalPoints}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-700">Plumbing points</div>
                  <div className="font-mono font-medium text-blue-900">{estimates.plumbingPoints}</div>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-3">
                These are typical sizes. On the next page you can review and edit every value.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {status && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              {status}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Processing...' : 'Generate Template BOQ'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            A template BOQ is an estimate based on typical sizes. For an accurate BOQ based on
            your specific plan, use the standard upload option on the dashboard.
          </p>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-base font-bold text-[#2C3E50] mb-4 pb-2 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Input({ label, name, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition text-sm ${
          required && !value ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      />
    </div>
  );
}

function SelectInput({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const isActive = value === o.value;
        return (
          <label
            key={o.value}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition ${
              isActive
                ? 'bg-[#2C3E50] text-white border-[#2C3E50]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={isActive}
              onChange={onChange}
              className="hidden"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
   }
