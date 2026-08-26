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
    doors: '',
    windows: '',
    wall_length: '',
    electrical_points: '',
    plumbing_points: '',
    plan_scale: '',
    ceiling_height: '',
    foundation_type: '',
  });

  // Fields that are "important" (must be verified)
  const importantFields = ['floor_area', 'rooms', 'doors', 'windows', 'wall_length'];

  useEffect(() => {
    async function loadProject() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Get project details
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

      // Simulate AI analysis - in reality, this would call an API
      // For now, let's populate with some sample detected data
      const detectedData = {
        floor_area: Math.round((Math.random() * 100 + 20) * 10) / 10,
        rooms: Math.floor(Math.random() * 4) + 2,
        doors: Math.floor(Math.random() * 4) + 1,
        windows: Math.floor(Math.random() * 5) + 2,
        wall_length: Math.round((Math.random() * 60 + 20) * 10) / 10,
        electrical_points: Math.floor(Math.random() * 8) + 3,
        plumbing_points: Math.floor(Math.random() * 4) + 1,
        plan_scale: '1:100',
        ceiling_height: '',
        foundation_type: '',
      };

      setFormData(detectedData);
      setLoading(false);
    }

    if (projectId) {
      loadProject();
    }
  }, [projectId, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      // Update project with verified data
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          floor_area: parseFloat(formData.floor_area),
          rooms: parseInt(formData.rooms),
          doors: parseInt(formData.doors),
          windows: parseInt(formData.windows),
          wall_length: parseFloat(formData.wall_length),
          electrical_points: parseInt(formData.electrical_points) || 0,
          plumbing_points: parseInt(formData.plumbing_points) || 0,
          plan_scale: formData.plan_scale || '1:100',
          status: 'completed',
        })
        .eq('id', projectId);

      if (updateError) {
        setError('Failed to save verification data');
        setSaving(false);
        return;
      }

      // Redirect to BOQ results
      router.push(`/dashboard/boq/${projectId}`);
      
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
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
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Floor Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📐 Floor Area (m²) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="floor_area"
                  value={formData.floor_area}
                  onChange={handleChange}
                  step="0.1"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                    !formData.floor_area ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 45.0"
                  required
                />
                {!formData.floor_area && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Required - Please enter floor area</p>
                )}
              </div>

              {/* Rooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏠 Rooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="rooms"
                  value={formData.rooms}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                    !formData.rooms ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 3"
                  required
                />
                {!formData.rooms && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Required - Please enter number of rooms</p>
                )}
              </div>

              {/* Doors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🚪 Doors <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="doors"
                  value={formData.doors}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                    !formData.doors ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 2"
                  required
                />
                {!formData.doors && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Required - Please enter number of doors</p>
                )}
              </div>

              {/* Windows */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🪟 Windows <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="windows"
                  value={formData.windows}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                    !formData.windows ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 4"
                  required
                />
                {!formData.windows && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Required - Please enter number of windows</p>
                )}
              </div>

              {/* Wall Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🧱 Wall Length (m) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="wall_length"
                  value={formData.wall_length}
                  onChange={handleChange}
                  step="0.1"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition ${
                    !formData.wall_length ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 38.0"
                  required
                />
                {!formData.wall_length && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Required - Please enter wall length</p>
                )}
              </div>

              {/* Plan Scale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📏 Plan Scale
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

              {/* Electrical Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ⚡ Electrical Points
                </label>
                <input
                  type="number"
                  name="electrical_points"
                  value={formData.electrical_points}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  placeholder="e.g., 6"
                />
              </div>

              {/* Plumbing Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💧 Plumbing Points
                </label>
                <input
                  type="number"
                  name="plumbing_points"
                  value={formData.plumbing_points}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  placeholder="e.g., 2"
                />
              </div>

              {/* Ceiling Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📐 Ceiling Height (m)
                </label>
                <input
                  type="number"
                  name="ceiling_height"
                  value={formData.ceiling_height}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                  placeholder="e.g., 2.7"
                />
              </div>

              {/* Foundation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏗️ Foundation Type
                </label>
                <select
                  name="foundation_type"
                  value={formData.foundation_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                >
                  <option value="">Select type</option>
                  <option value="strip">Strip Foundation</option>
                  <option value="raft">Raft Foundation</option>
                  <option value="piled">Piled Foundation</option>
                  <option value="pad">Pad Foundation</option>
                </select>
              </div>
            </div>

            {/* Plan Preview */}
            {project?.file_url && (
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">📄 Uploaded Plan</h3>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  {project.file_url.includes('.pdf') ? (
                    <a 
                      href={project.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#F47B20] hover:underline font-medium"
                    >
                      📄 View PDF Plan
                    </a>
                  ) : (
                    <img 
                      src={project.file_url} 
                      alt="Floor Plan" 
                      className="max-h-48 mx-auto rounded-lg shadow"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
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

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          <strong>⚠️ Important:</strong> Please verify all highlighted fields marked with <span className="text-red-500">*</span>.
          Incorrect measurements will affect your BOQ accuracy.
        </div>
      </div>
    </div>
  );
}
