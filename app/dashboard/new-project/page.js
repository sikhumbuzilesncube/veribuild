'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { readPlan } from '@/app/actions/readPlan';
import { CITIES } from '@/lib/cities';

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <NewProject />
    </Suspense>
  );
}

function NewProject() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const progressInterval = useRef(null);

  const retryProjectId = searchParams.get('retryProject');
  const isRetry = !!retryProjectId;
  const modeParam = searchParams.get('mode');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [planType, setPlanType] = useState('residential');
  const [cityId, setCityId] = useState(1);
  const [uploadMethod, setUploadMethod] = useState(modeParam === 'file' ? 'file' : 'camera');
  
  // Progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    async function loadRetryProject() {
      if (!retryProjectId) return;

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', retryProjectId)
        .single();

      if (fetchError || !data) return;

      setProjectName(data.project_name || '');
      setPlanType(data.plan_type || 'residential');
      setCityId(data.city_id || 1);
    }
    loadRetryProject();
    
    // Cleanup interval on unmount
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [retryProjectId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size exceeds 20MB limit');
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF, JPEG, or PNG file');
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleCameraCapture = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size exceeds 20MB limit');
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please upload a floor plan or take a photo');
      return;
    }

    if (!projectName && !isRetry) {
      setError('Please enter a project name');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(10);
    setStatusText('Connecting to secure storage...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const userId = session.user.id;

      // Simulate upload progress since we can't get real Supabase progress easily
      setStatusText('Uploading floor plan...');
      progressInterval.current = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('plans')
        .upload(fileName, file);

      if (uploadError) {
        clearInterval(progressInterval.current);
        console.error('Upload error:', uploadError);
        setError('Failed to upload file. Please try again.');
        setLoading(false);
        setUploadProgress(0);
        setStatusText('');
        return;
      }

      clearInterval(progressInterval.current);
      setUploadProgress(100);
      setStatusText('File uploaded successfully');

      const { data: urlData } = supabase.storage
        .from('plans')
        .getPublicUrl(fileName);

      let projectId;

      if (isRetry) {
        setStatusText('Updating project...');
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            file_url: urlData.publicUrl,
            status: 'processing',
            notes: null,
          })
          .eq('id', retryProjectId);

        if (updateError) {
          setError(`Failed to update project: ${updateError.message}`);
          setLoading(false);
          setUploadProgress(0);
          setStatusText('');
          return;
        }
        projectId = retryProjectId;
      } else {
        setStatusText('Creating project...');
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert([
            {
              user_id: userId,
              project_name: projectName,
              city_id: cityId,
              plan_type: planType,
              status: 'processing',
              file_url: urlData.publicUrl,
            },
          ])
          .select();

        if (projectError) {
          setError(`Failed to create project: ${projectError.message}`);
          setLoading(false);
          setUploadProgress(0);
          setStatusText('');
          return;
        }
        projectId = projectData[0].id;
      }

      // Now we wait for AI. Simulating a slow progress bar while waiting.
      setStatusText('AI is reading your plan...');
      setUploadProgress(30); // Drop back to 30% to show the AI phase
      
      progressInterval.current = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + 1;
        });
      }, 500);

      try {
        const result = await readPlan(projectId, urlData.publicUrl);
        clearInterval(progressInterval.current);
        setUploadProgress(100);

        if (result.success) {
          setStatusText(`Detected: ${result.windowsFound || 0} windows, ${result.doorsFound || 0} doors`);
        } else {
          setStatusText('Plan read with low confidence. Manual entry may be needed.');
        }
      } catch (planError) {
        clearInterval(progressInterval.current);
        console.error('Server action error:', planError);
        setStatusText('AI reading skipped. Proceeding to manual entry.');
      }

      setTimeout(() => {
        router.push(`/dashboard/verify/${projectId}`);
      }, 1000);

    } catch (err) {
      clearInterval(progressInterval.current);
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
      setUploadProgress(0);
      setStatusText('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-800 mb-3 inline-block"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            {isRetry ? 'Retake Photo' : 'New BOQ'}
          </h1>
          <p className="text-gray-600 text-sm">
            {isRetry
              ? 'Capture or upload a clearer plan for this project'
              : 'Upload your floor plan and generate a professional BOQ'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {!isRetry && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                    placeholder="e.g., 3-Bedroom House"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={planType}
                      onChange={(e) => setPlanType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                    >
                      <option value="residential">Residential - $10</option>
                      <option value="townhouse">Townhouse - $10</option>
                      <option value="commercial">Commercial - $30</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={cityId}
                      onChange={(e) => setCityId(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                    >
                      {CITIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {isRetry && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                Re-uploading to project: <strong>{projectName}</strong>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Floor Plan <span className="text-red-500">*</span>
              </label>

              <div className="flex p-1 bg-gray-100 rounded-lg mb-4 w-full sm:w-64">
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                    uploadMethod === 'file'
                      ? 'bg-white text-[#2C3E50] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('camera')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                    uploadMethod === 'camera'
                      ? 'bg-white text-[#2C3E50] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Take Photo
                </button>
              </div>

              {!file ? (
                <div className="flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10 hover:border-[#F47B20] transition bg-gray-50">
                  <div className="text-center">
                    {uploadMethod === 'camera' ? (
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <div className="mt-4 text-sm text-gray-600">
                      <label
                        htmlFor={uploadMethod === 'camera' ? 'camera-upload' : 'file-upload'}
                        className="relative cursor-pointer rounded-md font-semibold text-[#F47B20] focus-within:outline-none hover:text-[#E06B10]"
                      >
                        <span>{uploadMethod === 'camera' ? 'Open Camera' : 'Choose a file'}</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadMethod === 'camera' ? 'Take a clear photo of the plan' : 'PDF, JPG, PNG up to 20MB'}
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      id="file-upload"
                    />

                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleCameraCapture}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      id="camera-upload"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                      <svg className="w-6 h-6 text-[#F47B20]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 bg-white border border-red-200 px-3 py-1.5 rounded-md shadow-sm transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* NEW: Progress Bar Area */}
            {loading && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-[#2C3E50]">{statusText}</span>
                  <span className="text-sm font-bold text-[#F47B20]">{Math.min(100, Math.round(uploadProgress))}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-[#F47B20] h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${Math.min(100, uploadProgress)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed text-lg flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                isRetry ? 'Retake & Read Plan' : 'Upload & Generate BOQ'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
    }
