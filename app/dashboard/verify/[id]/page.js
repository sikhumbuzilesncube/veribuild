'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const IMPORTANT_FIELDS = ['floor_area', 'rooms', 'wall_length', 'doors', 'windows'];

// Soil types common in Zimbabwe with default foundation depths
const SOIL_TYPES = [
  { value: 'stable_red',   label: 'Stable red soil / sandy loam',        defaultDepth: 0.6 },
  { value: 'black_cotton', label: 'Black cotton / expansive clay',       defaultDepth: 1.0 },
  { value: 'sandy',        label: 'Sandy soil',                          defaultDepth: 0.8 },
  { value: 'soft_clay',    label: 'Soft clay / waterlogged',             defaultDepth: 1.5 },
  { value: 'rock',         label: 'Rock / very hard ground',             defaultDepth: 0.5 },
  { value: 'sloping',      label: 'Sloping site (stepped foundation)',   defaultDepth: 1.2 },
  { value: 'not_sure',     label: 'Not sure / standard assumption',      defaultDepth: 0.6 },
  { value: 'other',        label: 'Other / custom',                      defaultDepth: null },
];

export default function VerifyPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [originalData, setOriginalData] = useState({});

  const [formData, setFormData] = useState({
    floor_area: '',
    rooms: '',
    room_labels: '',
    wall_length: '',
    wall_height: '2.7',
    wall_thickness: '230',
    foundation_type: 'strip',
    soil_type: 'not_sure',
    foundation_depth: '0.6',
    foundation_width: '0.4',
    slab_type: 'ground',
    slab_thickness: '0.15',
    concrete_grade: 'C20',
    storeys: '1',
    roof_type: 'ibr',
    roof_pitch: '22.5',
    doors: '',
    door_details: '',
    windows: '',
    window_details: '',
    electrical_points: '',
    plumbing_points: '',
    red_wall_length: '',
    green_concrete_area: '',
    yellow_timber_length: '',
    brown_sewer_length: '',
    blue_water_length: '',
    plan_scale: '1:100',
  });

  useEffect(() => {
    async function loadProject() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError || !data) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      setProject(data);

      const soilType = data.soil_type || 'not_sure';
      const soilDefault = SOIL_TYPES.find((s) => s.value === soilType)?.defaultDepth;

      const detected = {
        floor_area: data.floor_area || '85',
        rooms: data.rooms || '4',
        room_labels: data.room_labels || '',
        wall_length: data.wall_length || '63',
        wall_height: data.wall_height || '2.7',
        wall_thickness: '230',
        foundation_type: data.foundation_type || 'strip',
        soil_type: soilType,
        foundation_depth: data.foundation_depth || (soilDefault ?? 0.6),
        foundation_width: data.foundation_width || '0.4',
        slab_type: data.slab_type || 'ground',
        slab_thickness: data.slab_thickness || '0.15',
        concrete_grade: data.concrete_grade || 'C20',
        storeys: '1',
        roof_type: 'ibr',
        roof_pitch: '22.5',
        doors: data.doors || '4',
        door_details: data.door_details || '',
        windows: data.windows || '2',
        window_details: data.window_details || '',
        electrical_points: data.electrical_points || '8',
        plumbing_points: data.plumbing_points || '3',
        red_wall_length: data.red_wall_length || '',
        green_concrete_area: data.green_concrete_area || '',
        yellow_timber_length: data.yellow_timber_length || '',
        brown_sewer_length: data.brown_sewer_length || '',
        blue_water_length: data.blue_water_length || '',
        plan_scale: data.plan_scale || '1:100',
      };

      setFormData(detected);
      setOriginalData(detected);
      setLoading(false);
    }

    if (projectId) loadProject();
  }, [projectId, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSoilTypeChange = (e) => {
    const soilType = e.target.value;
    const soil = SOIL_TYPES.find((s) => s.value === soilType);

    // Auto-fill depth only if a numeric default exists
    if (soil && soil.defaultDepth !== null) {
      setFormData({
        ...formData,
        soil_type: soilType,
        foundation_depth: soil.defaultDepth.toFixed(1),
      });
    } else {
      setFormData({ ...formData, soil_type: soilType });
    }
  };

  function trackCorrections(userData, aiData) {
    const corrections = [];
    const fieldsToTrack = [
      'windows', 'doors', 'floor_area', 'rooms', 'room_labels',
      'wall_length', 'foundation_type', 'soil_type', 'slab_type',
      'red_wall_length', 'green_concrete_area', 'yellow_timber_length',
    ];

    for (const field of fieldsToTrack) {
      const aiValue = aiData[field] || '';
      const userValue = userData[field] || '';
      if (String(userValue).trim() !== String(aiValue).trim()) {
        corrections.push({
          field,
          ai_value: String(aiValue).trim(),
          user_value: String(userValue).trim(),
        });
      }
    }
    return corrections;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const missing = IMPORTANT_FIELDS.filter((f) => !formData[f]);
    if (missing.length > 0) {
      setError(`Please complete the following required fields: ${missing.join(', ')}`);
      setSaving(false);
      return;
    }

    // Special case: soil_type = 'other' requires a depth entered manually
    if (formData.soil_type === 'other' && !formData.foundation_depth) {
      setError('Foundation depth is required when soil type is set to "Other / custom"');
      setSaving(false);
      return;
    }

    try {
      const updateData = {
        floor_area: parseFloat(formData.floor_area),
        rooms: parseInt(formData.rooms, 10),
        room_labels: formData.room_labels || null,
        wall_length: parseFloat(formData.wall_length),
        wall_height: parseFloat(formData.wall_height) || 2.7,
        foundation_type: formData.foundation_type || 'strip',
        soil_type: formData.soil_type || 'not_sure',
        foundation_depth: parseFloat(formData.foundation_depth) || 0.6,
        foundation_width: parseFloat(formData.foundation_width) || 0.4,
        slab_type: formData.slab_type || 'ground',
        slab_thickness: parseFloat(formData.slab_thickness) || 0.15,
        concrete_grade: formData.concrete_grade || 'C20',
        doors: parseInt(formData.doors, 10),
        door_details: formData.door_details || null,
        windows: parseInt(formData.windows, 10),
        window_details: formData.window_details || null,
        electrical_points: parseInt(formData.electrical_points, 10) || 0,
        plumbing_points: parseInt(formData.plumbing_points, 10) || 0,
        red_wall_length: parseFloat(formData.red_wall_length) || 0,
        green_concrete_area: parseFloat(formData.green_concrete_area) || 0,
        yellow_timber_length: parseFloat(formData.yellow_timber_length) || 0,
        brown_sewer_length: parseFloat(formData.brown_sewer_length) || 0,
        blue_water_length: parseFloat(formData.blue_water_length) || 0,
        plan_scale: formData.plan_scale || '1:100',
        status: 'completed',
      };

      const { error: updateError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (updateError) {
        setError(`Failed to save: ${updateError.message}`);
        setSaving(false);
        return;
      }

      const corrections = trackCorrections(formData, originalData);
      if (corrections.length > 0) {
        for (const c of corrections) {
          await supabase.from('ai_learning').insert({
            plan_id: projectId,
            code_type: 'correction',
            code_value: c.field,
            detected: c.ai_value,
            confirmed: c.user_value,
            corrected: c.user_value,
            confidence: 0.5,
          });
        }
      }

      router.push(`/dashboard/boq/${projectId}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        <div className="mb-6">
          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            Analysis complete
          </div>
          <div className="text-sm text-gray-500 mb-2">Step 2 of 3: Verify &amp; correct</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            Verify Project Data
          </h1>
          <p className="text-gray-600 text-sm">
            Review the detected information below. Fields marked with an asterisk are required.
            Any changes you make will help improve future plan readings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <FieldGroup title="Building Information">
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Floor Area (m²)"
                name="floor_area"
                value={formData.floor_area}
                onChange={handleChange}
                type="number"
                step="0.1"
                required
                original={originalData.floor_area}
              />
              <Field
                label="Number of Rooms"
                name="rooms"
                value={formData.rooms}
                onChange={handleChange}
                type="number"
                required
                original={originalData.rooms}
              />
              <div className="md:col-span-2">
                <Field
                  label="Room Labels"
                  name="room_labels"
                  value={formData.room_labels}
                  onChange={handleChange}
                  placeholder="Lounge, Kitchen, Garage, Bedroom 1, Bedroom 2, Bathroom"
                  original={originalData.room_labels}
                />
              </div>
              <Field
                label="Number of Storeys"
                name="storeys"
                value={formData.storeys}
                onChange={handleChange}
                type="number"
                min="1"
              />
              <Field
                label="Plan Scale"
                name="plan_scale"
                value={formData.plan_scale}
                onChange={handleChange}
                type="select"
                options={['1:50', '1:100', '1:200', '1:500']}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Walls">
            <div className="grid md:grid-cols-3 gap-4">
              <Field
                label="Total Wall Length (m)"
                name="wall_length"
                value={formData.wall_length}
                onChange={handleChange}
                type="number"
                step="0.1"
                required
                original={originalData.wall_length}
              />
              <Field
                label="Wall Height (m)"
                name="wall_height"
                value={formData.wall_height}
                onChange={handleChange}
                type="number"
                step="0.1"
              />
              <Field
                label="Wall Thickness (mm)"
                name="wall_thickness"
                value={formData.wall_thickness}
                onChange={handleChange}
                type="select"
                options={[
                  { value: '115', label: '115 mm (half brick)' },
                  { value: '230', label: '230 mm (one brick)' },
                ]}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Foundation & Slab">
            <div className="grid md:grid-cols-3 gap-4">
              <Field
                label="Foundation Type"
                name="foundation_type"
                value={formData.foundation_type}
                onChange={handleChange}
                type="select"
                options={[
                  { value: 'strip', label: 'Strip Foundation' },
                  { value: 'raft', label: 'Raft Foundation' },
                  { value: 'pad', label: 'Pad Foundation' },
                ]}
                original={originalData.foundation_type}
              />
              <Field
                label="Soil Type"
                name="soil_type"
                value={formData.soil_type}
                onChange={handleSoilTypeChange}
                type="select"
                options={SOIL_TYPES}
                original={originalData.soil_type}
              />
              <Field
                label="Foundation Depth (m)"
                name="foundation_depth"
                value={formData.foundation_depth}
                onChange={handleChange}
                type="number"
                step="0.1"
                placeholder={formData.soil_type === 'other' ? 'Required for custom' : ''}
              />
              <Field
                label="Foundation Width (m)"
                name="foundation_width"
                value={formData.foundation_width}
                onChange={handleChange}
                type="number"
                step="0.1"
              />
              <Field
                label="Slab Type"
                name="slab_type"
                value={formData.slab_type}
                onChange={handleChange}
                type="select"
                options={[
                  { value: 'ground', label: 'Ground Slab' },
                  { value: 'suspended', label: 'Suspended Slab' },
                  { value: 'raft', label: 'Raft Slab' },
                ]}
                original={originalData.slab_type}
              />
              <Field
                label="Slab Thickness (m)"
                name="slab_thickness"
                value={formData.slab_thickness}
                onChange={handleChange}
                type="number"
                step="0.01"
              />
              <Field
                label="Concrete Grade"
                name="concrete_grade"
                value={formData.concrete_grade}
                onChange={handleChange}
                type="select"
                options={[
                  { value: 'C15', label: 'C15 / G15 (Foundation)' },
                  { value: 'C20', label: 'C20 / G20 (General)' },
                  { value: 'C25', label: 'C25 / G25 (Structural)' },
                  { value: 'C30', label: 'C30 / G30 (High Strength)' },
                ]}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Depth is auto-set from soil type. Adjust manually if you have a geotechnical report.
              The default 0.6m is a standard assumption for stable ground in Zimbabwe.
            </p>
          </FieldGroup>

          <FieldGroup title="Roof">
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Roof Type"
                name="roof_type"
                value={formData.roof_type}
                onChange={handleChange}
                type="select"
                options={[
                  { value: 'ibr', label: 'IBR Sheet' },
                  { value: 'chromadek', label: 'Chromadek Sheet' },
                  { value: 'concrete', label: 'Concrete Tiles' },
                  { value: 'clay', label: 'Clay Tiles' },
                ]}
              />
              <Field
                label="Roof Pitch (degrees)"
                name="roof_pitch"
                value={formData.roof_pitch}
                onChange={handleChange}
                type="select"
                options={[
                  { value: '15', label: '15°' },
                  { value: '20', label: '20°' },
                  { value: '22.5', label: '22.5°' },
                  { value: '25', label: '25°' },
                  { value: '30', label: '30°' },
                  { value: '35', label: '35°' },
                  { value: '40', label: '40°' },
                ]}
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Doors &amp; Windows">
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Number of Doors"
                name="doors"
                value={formData.doors}
                onChange={handleChange}
                type="number"
                required
                original={originalData.doors}
              />
              <Field
                label="Number of Windows"
                name="windows"
                value={formData.windows}
                onChange={handleChange}
                type="number"
                required
                original={originalData.windows}
              />
              <div className="md:col-span-2">
                <Field
                  label="Door Codes (if shown on plan)"
                  name="door_details"
                  value={formData.door_details}
                  onChange={handleChange}
                  placeholder="e.g. D1, D1, DD, D2"
                />
              </div>
              <div className="md:col-span-2">
                <Field
                  label="Window Codes (if shown on plan)"
                  name="window_details"
                  value={formData.window_details}
                  onChange={handleChange}
                  placeholder="e.g. PT1212, PT1212, HS1512"
                />
              </div>
            </div>
          </FieldGroup>

          <FieldGroup title="Services">
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Electrical Points"
                name="electrical_points"
                value={formData.electrical_points}
                onChange={handleChange}
                type="number"
              />
              <Field
                label="Plumbing Points"
                name="plumbing_points"
                value={formData.plumbing_points}
                onChange={handleChange}
                type="number"
              />
            </div>
          </FieldGroup>

          <FieldGroup title="Measured Elements from Plan">
            <div className="grid md:grid-cols-3 gap-4">
              <Field
                label="Walls (red line) - m"
                name="red_wall_length"
                value={formData.red_wall_length}
                onChange={handleChange}
                type="number"
                step="0.1"
                original={originalData.red_wall_length}
              />
              <Field
                label="Concrete (green line) - m²"
                name="green_concrete_area"
                value={formData.green_concrete_area}
                onChange={handleChange}
                type="number"
                step="0.1"
                original={originalData.green_concrete_area}
              />
              <Field
                label="Timber (yellow line) - m"
                name="yellow_timber_length"
                value={formData.yellow_timber_length}
                onChange={handleChange}
                type="number"
                step="0.1"
                original={originalData.yellow_timber_length}
              />
              <Field
                label="Sewer (brown line) - m"
                name="brown_sewer_length"
                value={formData.brown_sewer_length}
                onChange={handleChange}
                type="number"
                step="0.1"
              />
              <Field
                label="Water (blue line) - m"
                name="blue_water_length"
                value={formData.blue_water_length}
                onChange={handleChange}
                type="number"
                step="0.1"
              />
            </div>
          </FieldGroup>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
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
              {saving ? 'Saving...' : 'Generate Bill of Quantities'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          Corrections to detected values are logged to improve future readings.
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-base font-bold text-[#2C3E50] mb-4 pb-2 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  step,
  min,
  required,
  placeholder,
  options,
  original,
}) {
  const isCorrected =
    original !== undefined &&
    String(value).trim() !== String(original).trim() &&
    original !== '';

  const inputClass = `w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition text-sm ${
    required && !value
      ? 'border-red-400 bg-red-50'
      : isCorrected
      ? 'border-yellow-400 bg-yellow-50'
      : 'border-gray-300'
  }`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'select' ? (
        <select name={name} value={value} onChange={onChange} className={inputClass}>
          {(options || []).map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          step={step}
          min={min}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      {isCorrected && (
        <p className="text-xs text-yellow-700 mt-1">
          Changed from detected value: {original}
        </p>
      )}
    </div>
  );
    }
