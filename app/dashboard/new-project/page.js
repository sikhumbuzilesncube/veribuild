'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CITIES } from '@/lib/cities';

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    project_name: '',
    plan_type: 'residential',
    city_id: '1',
    file: null,
  });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      setLoading(false);
    }
    load();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size (Max 10MB)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, JPG, PNG, or WebP file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      return;
    }

    setError('');
    setFormData({ ...formData, file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Please upload a floor plan.');
      return;
    }
    if (!formData.project_name.trim()) {
      setError('Please enter a project name.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `plans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('plans')
        .upload(filePath, formData.file);

      if (uploadError) throw new Error('Failed to upload file. Please try again.');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('plans')
        .getPublicUrl(filePath);

      // 2. Create the project in the database
      const { data: project, error: dbError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          project_name: formData.project_name.trim(),
          plan_type: formData.plan_type,
          city_id: parseInt(formData.city_id, 10),
          file_url: publicUrl,
          status: 'processing',
        })
        .select()
        .single();

      if (dbError) throw new Error('Failed to create project. Please try again.');

      // 3. Trigger the AI Vision API (this usually happens on the verify page)
      // Redirect to the verify page where the AI extraction takes place
      router.push(`/dashboard/verify/${project.id}`);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-800 mb-3 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            Upload a Floor Plan
          </h1>
          <p className="text-gray-600 text-sm">
            Our AI will read your plan and extract all the measurements to generate your BOQ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          
          <div className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                placeholder="e.g., 3-Bedroom House in Borrowdale"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="plan_type"
                  value={formData.plan_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                >
                  <option value="residential">Residential - $10</option>
                  <option value="rural">Rural / Cottage - $10</option>
                  <option value="commercial">Commercial - $10</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Location <span className="text-red-500">*</span>
                </label>
                <select
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Floor Plan <span className="text-red-500">*</span>
              </label>
              
              {/* Upload Area */}
              {!formData.file ? (
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10 hover:border-[#F47B20] transition relative bg-gray-50">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                    </svg>
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-[#F47B20] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F47B20] focus-within:ring-offset-2 hover:text-[#E06B10]">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.webp" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-500">PDF, PNG, JPG, WebP up to 10MB</p>
                  </div>
                </div>
              ) : (
                /* File Preview */
                <div className="mt-2 flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                      <svg className="w-6 h-6 text-[#F47B20]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{formData.file.name}</p>
                      <p className="text-xs text-gray-500">{(formData.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, file: null })}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 bg-white border border-red-200 px-3 py-1 rounded-md shadow-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mt-8">
            <button
              type="submit"
              disabled={processing || !formData.file}
              className="w-full bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading & Extracting...
                </>
              ) : (
                'Generate BOQ'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
    }
