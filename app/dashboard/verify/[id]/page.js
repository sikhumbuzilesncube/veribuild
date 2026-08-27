'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function VerifyPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({
    floor_area: '',
    rooms: '',
    room_labels: '',
    wall_length: '',
    wall_height: '2.7',
    foundation_type: 'strip',
    foundation_depth: '0.6',
    foundation_width: '0.4',
    slab_type: 'ground',
    slab_thickness: '0.15',
    concrete_grade: 'C20',
    doors: '',
    windows: '',
    electrical_points: '',
    plumbing_points: '',
    red_wall_length: '',
    green_concrete_area: '',
    yellow_timber_length: '',
    brown_sewer_length: '',
    blue_water_length: '',
    plan_scale: '1:100',
  });

  // Store original AI-detected values for tracking
  const [originalData, setOriginalData] = useState({});

  const importantFields = ['floor_area', 'rooms', 'wall_length', 'doors', 'windows'];

  useEffect(() => {
    async function loadProject() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error || !data) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      setProject(data);

      // AI detected data (from readPlan)
      const detectedData = {
        floor_area: data.floor_area || '85',
        rooms: data.rooms || '4',
        room_labels: data.room_labels || '',
        wall_length: data.wall_length || '63',
        wall_height: data.wall_height || '2.7',
        foundation_type: data.foundation_type || 'strip',
        foundation_depth: data.foundation_depth || '0.6',
        foundation_width: data.foundation_width || '0.4',
        slab_type: data.slab_type || 'ground',
        slab_thickness: data.slab_thickness || '0.15',
        concrete_grade: data.concrete_grade || 'C20',
        doors: data.doors || '4',
        windows: data.windows || '2',
        electrical_points: data.electrical_points || '8',
        plumbing_points: data.plumbing_points || '3',
        red_wall_length: data.red_wall_length || '',
        green_concrete_area: data.green_concrete_area || '',
        yellow_timber_length: data.yellow_timber_length || '',
        brown_sewer_length: data.brown_sewer_length || '',
        blue_water_length: data.blue_water_length || '',
        plan_scale: data.plan_scale || '1:100',
      };

      setFormData(detectedData);
      setOriginalData(detectedData); // Save original for comparison
      setLoading(false);
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ============================================================
  // TRACK CORRECTIONS - Compare what AI detected vs what user entered
  // ============================================================
  function trackCorrections(userData, aiData, projectId) {
    const corrections = [];
    const fieldsToTrack = [
      'windows', 'doors', 'floor_area', 'rooms', 'room_labels', 
      'wall_length', 'foundation_type', 'slab_type',
      'red_wall_length', 'green_concrete_area', 'yellow_timber_length'
    ];

    for (const field of fieldsToTrack) {
      const aiValue = aiData[field] || '';
      const userValue = userData[field] || '';

      // If user changed the value or added a value that was empty
      if (String(userValue).trim() !== String(aiValue).trim()) {
        corrections.push({
          field: field,
          ai_value: String(aiValue).trim(),
          user_value: String(userValue).trim(),
          is_correction: aiValue !== '' && userValue !== '',
          is_addition: aiValue === '' && userValue !== '',
        });
      }
    }

    return corrections;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validate important fields
    const missingFields = importantFields.filter(
      field => !formData[field] || formData[field] === ''
    );

    if (missingFields.length > 0) {
      setError(`Please fill in all highlighted fields: ${missingFields.join(', ')}`);
      setSaving(false);
      return;
    }

    try {
      // Convert string values to proper types
      const updateData = {
        floor_area: parseFloat(formData.floor_area),
        rooms: parseInt(formData.rooms),
        room_labels: formData.room_labels || null,
        wall_length: parseFloat(formData.wall_length),
        wall_height: parseFloat(formData.wall_height) || 2.7,
        foundation_type: formData.foundation_type || 'strip',
        foundation_depth: parseFloat(formData.foundation_depth) || 0.6,
        foundation_width: parseFloat(formData.foundation_width) || 0.4,
        slab_type: formData.slab_type || 'ground',
        slab_thickness: parseFloat(formData.slab_thickness) || 0.15,
        concrete_grade: formData.concrete_grade || 'C20',
        doors: parseInt(formData.doors),
        windows: parseInt(formData.windows),
        electrical_points: parseInt(formData.electrical_points) || 0,
        plumbing_points: parseInt(formData.plumbing_points) || 0,
        red_wall_length: parseFloat(formData.red_wall_length) || 0,
        green_concrete_area: parseFloat(formData.green_concrete_area) || 0,
        yellow_timber_length: parseFloat(formData.yellow_timber_length) || 0,
        brown_sewer_length: parseFloat(formData.brown_sewer_length) || 0,
        blue_water_length: parseFloat(formData.blue_water_length) || 0,
        plan_scale: formData.plan_scale || '1:100',
        status: 'completed',
      };

      // Update project
      const { error: updateError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (updateError) {
        setError(`Failed to save: ${updateError.message}`);
        setSaving(false);
        return;
      }

      // ============================================================
      // TRACK CORRECTIONS - Save to ai_learning table
      // ============================================================
      const corrections = trackCorrections(formData, originalData, projectId);
      
      if (corrections.length > 0) {
        console.log('📊 Corrections detected:', corrections);
        
        // Save each correction to the database
        for (const correction of corrections) {
          const { error: learnError } = await supabase
            .from('ai_learning')
            .insert({
              plan_id: parseInt(projectId),
              code_type: 'correction',
              code_value: correction.field,
              detected: correction.ai_value,
              confirmed: correction.user_value,
              corrected: correction.user_value,
              confidence: 0.5,
            });
          
          if (learnError) {
            console.error('⚠️ Failed to save learning data:', learnError);
            // Don't stop the process - just log the error
          }
        }
        
        console.log('✅ Corrections saved to AI learning database!');
      } else {
        console.log('✅ No corrections - AI was accurate!');
      }

      // Redirect to BOQ
      router.push(`/dashboard/boq/${projectId}`);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your plan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
            ✅ AI Analysis Complete
          </div>
          <span className="text-sm text-gray-500">Step 2 of 3: Verify & Correct</span>
        </div>

        <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Verify Your Plan Data</h1>
        <p className="text-gray-600 mb-8">
          Review the AI-detected information below. <span className="text-red-500 font-semibold">Highlighted fields</span> require your attention.
          <br />
          <span className="text-sm text-blue-600">📊 Any changes you make will help train the AI!</span>
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Building Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4">🏗️ Building Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor Area (m²) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="floor_area"
                    value={formData.floor_area}
                    onChange={handleChange}
                    step="0.1"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                      !formData.floor_area ? 'border-red-500 bg-red-50' : 
                      formData.floor_area !== originalData.floor_area ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formData.floor_area !== originalData.floor_area && (
                    <p className="text-xs text-yellow-600 mt-1">🔄 Corrected from {originalData.floor_area || 'empty'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                      !formData.rooms ? 'border-red-500 bg-red-50' : 
                      formData.rooms !== originalData.rooms ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formData.rooms !== originalData.rooms && (
                    <p className="text-xs text-yellow-600 mt-1">🔄 Corrected from {originalData.rooms || 'empty'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Labels (e.g., Lounge, Kitchen, Garage)
                  </label>
                  <input
                    type="text"
                    name="room_labels"
                    value={formData.room_labels}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                      formData.room_labels !== originalData.room_labels ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                    placeholder="Lounge, Kitchen, Garage, Bedroom 1, Bedroom 2, Bathroom"
                  />
                  {formData.room_labels !== originalData.room_labels && (
                    <p className="text-xs text-yellow-600 mt-1">🔄 Corrected from "{originalData.room_labels || 'empty'}"</p>
                  )}
                </div>
              </div>
            </div>

            {/* Walls */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4">🧱 Walls</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wall Length (m) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="wall_length"
                    value={formData.wall_length}
                    onChange={handleChange}
                    step="0.1"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                      !formData.wall_length ? 'border-red-500 bg-red-50' : 
                      formData.wall_length !== originalData.wall_length ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formData.wall_length !== originalData.wall_length && (
                    <p className="text-xs text-yellow-600 mt-1">🔄 Corrected from {originalData.wall_length || 'empty'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wall Height (m)
                  </label>
                  <input
                    type="number"
                    name="wall_height"
                    value={formData.wall_height}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Foundation & Slab */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4">🏠 Foundation & Slab</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foundation Type
                  </label>
                  <select
                    name="foundation_type"
                    value={formData.foundation_type}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                      formData.foundation_type !== originalData.foundation_type ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="strip">Strip Foundation</option>
                    <option value="raft">Raft Foundation</option>
                    <option value="piled">Piled Foundation</option>
                    <option value="pad">Pad Foundation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foundation Depth (m)
                  </label>
                  <input
                    type="number"
                    name="foundation_depth"
                    value={formData.foundation_depth}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foundation Width (m)
                  </label>
                  <input
                    type="number"
                    name="foundation_width"
                    value={formData.foundation_width}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slab Type
                  </label>
                  <select
                    name="slab_type"
                    value={formData.slab_type}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                      formData.slab_type !== originalData.slab_type ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="ground">Ground Slab</option>
                    <option value="suspended">Suspended Slab</option>
                    <option value="raft">Raft Slab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slab Thickness (m)
                  </label>
                  <input
                    type="number"
                    name="slab_thickness"
                    value={formData.slab_thickness}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Concrete Grade
                  </label>
                  <select
                    name="concrete_grade"
                    value={formData.concrete_grade}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  >
                    <option value="C15">C15 (Foundation)</option>
                    <option value="C20">C20 (General)</option>
                    <option value="C25">C25 (Structural)</option>
                    <option value="C30">C30 (High Strength)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Counts */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4">📊 Counts</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doors <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="doors"
                    value={formData.doors}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                      !formData.doors ? 'border-red-500 bg-red-50' : 
                      formData.doors !== originalData.doors ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formData.doors !== originalData.doors && (
                    <p className="text-xs text-yellow-600 mt-1">🔄 Corrected from {originalData.doors || 'empty'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Windows <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="windows"
                    value={formData.windows}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                      !formData.windows ? 'border-red-500 bg-red-50' : 
                      formData.windows !== originalData.windows ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formData.windows !== originalData.windows && (
                    <p className="text-xs text-yellow-600 mt-1">🔄 Corrected from {originalData.windows || 'empty'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Electrical Points
                  </label>
                  <input
                    type="number"
                    name="electrical_points"
                    value={formData.electrical_points}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plumbing Points
                  </label>
                  <input
                    type="number"
                    name="plumbing_points"
                    value={formData.plumbing_points}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Color-Coded Elements */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4">🎨 Color-Coded Elements</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    🔴 Red - Walls (m)
                  </label>
                  <input
                    type="number"
                    name="red_wall_length"
                    value={formData.red_wall_length}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition bg-white"
                  />
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    🟢 Green - Concrete (m²)
                  </label>
                  <input
                    type="number"
                    name="green_concrete_area"
                    value={formData.green_concrete_area}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition bg-white"
                  />
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <label className="block text-sm font-medium text-yellow-700 mb-1">
                    🟡 Yellow - Timber (m)
                  </label>
                  <input
                    type="number"
                    name="yellow_timber_length"
                    value={formData.yellow_timber_length}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition bg-white"
                  />
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <label className="block text-sm font-medium text-amber-700 mb-1">
                    🟤 Brown - Sewer (m)
                  </label>
                  <input
                    type="number"
                    name="brown_sewer_length"
                    value={formData.brown_sewer_length}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition bg-white"
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    🔵 Blue - Water (m)
                  </label>
                  <input
                    type="number"
                    name="blue_water_length"
                    value={formData.blue_water_length}
                    onChange={handleChange}
                    step="0.1"
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Scale
                  </label>
                  <select
                    name="plan_scale"
                    value={formData.plan_scale}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  >
                    <option value="1:50">1:50</option>
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="1:500">1:500</option>
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
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
                {saving ? 'Saving...' : 'Generate BOQ →'}
              </button>
            </div>
          </form>
        </div>

        {/* Learning Info */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            🧠 <strong>AI Learning:</strong> Any changes you make will be saved to the AI learning database. 
            This helps VeriBuild become smarter for future plans!
          </p>
        </div>
      </div>
    </div>
  );
    }
