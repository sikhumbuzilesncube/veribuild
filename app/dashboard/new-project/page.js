'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewProject() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [planType, setPlanType] = useState('residential');
  const [cityId, setCityId] = useState(1);
  const [uploadMethod, setUploadMethod] = useState('file');
  const [apiStatus, setApiStatus] = useState('');

  const cities = [
    { id: 1, name: 'Harare' },
    { id: 2, name: 'Bulawayo' },
    { id: 3, name: 'Mutare' },
    { id: 4, name: 'Gweru' },
    { id: 5, name: 'Kwekwe' },
    { id: 6, name: 'Masvingo' },
    { id: 7, name: 'Chinhoyi' },
    { id: 8, name: 'Marondera' },
  ];

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

    if (!projectName) {
      setError('Please enter a project name');
      return;
    }

    setLoading(true);
    setError('');
    setApiStatus('📤 Uploading...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const userId = session.user.id;

      // STEP 1: Upload file to Supabase Storage
      setApiStatus('📤 Uploading file...');
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('plans')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload file. Please try again.');
        setLoading(false);
        setApiStatus('');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('plans')
        .getPublicUrl(fileName);

      // STEP 2: Create project in database
      setApiStatus('📝 Creating project...');
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
        console.error('Project error:', projectError);
        setError(`Failed to create project: ${projectError.message}`);
        setLoading(false);
        setApiStatus('');
        return;
      }

      const projectId = projectData[0].id;

      // STEP 3: Call the read-plan API
      setApiStatus('📄 Reading plan with AI...');
      try {
        console.log('📄 Calling read-plan API for project:', projectId);
        
        const planResponse = await fetch('/api/read-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: projectId,
            fileUrl: urlData.publicUrl
          })
        });
        
        const planResult = await planResponse.json();
        console.log('📄 API Response:', planResult);
        
        if (planResult && planResult.success) {
          setApiStatus('✅ Plan data extracted!');
          console.log('📊 Extracted data:', planResult.data);
        } else {
          setApiStatus('⚠️ Could not read plan automatically');
          console.warn('⚠️ Plan reading issue:', planResult?.error || 'Unknown');
        }
      } catch (planError) {
        console.error('❌ API call error:', planError);
        setApiStatus('⚠️ Manual verification needed');
        // Continue anyway
      }

      // STEP 4: Redirect to verification
      setApiStatus('🔄 Redirecting to verification...');
      setTimeout(() => {
        router.push(`/dashboard/verify/${projectId}`);
      }, 1000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
      setApiStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">New BOQ</h1>
        <p className="text-gray-600 mb-8">Upload your floor plan and generate a professional BOQ</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
                placeholder="e.g., 3-Bedroom House"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Type <span className="text-red-500">*</span>
              </label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none transition"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Floor Plan <span className="text-red-500">*</span>
              </label>

              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    uploadMethod === 'file'
                      ? 'bg-[#F47B20] text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  📤 Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('camera')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    uploadMethod === 'camera'
                      ? 'bg-[#F47B20] text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  📷 Take Photo
                </button>
              </div>

              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                  file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-[#F47B20]'
                }`}
              >
                {!file ? (
                  <>
                    <div className="text-5xl mb-4">
                      {uploadMethod === 'camera' ? '📷' : '📤'}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {uploadMethod === 'camera' 
                        ? 'Take a photo of your floor plan' 
                        : 'Click to upload your plan'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {uploadMethod === 'camera' 
                        ? 'Use your phone camera to capture the plan' 
                        : 'Supported: PDF, JPEG, PNG (Max 20MB)'}
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

                    <label
                      htmlFor={uploadMethod === 'camera' ? 'camera-upload' : 'file-upload'}
                      className="inline-block mt-4 px-6 py-2 bg-[#F47B20] text-white rounded-lg font-semibold cursor-pointer hover:bg-[#E06B10] transition"
                    >
                      {uploadMethod === 'camera' ? '📷 Open Camera' : '📤 Choose File'}
                    </label>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">📄</span>
                      <div className="text-left">
                        <p className="font-medium text-gray-700">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            {apiStatus && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                {apiStatus}
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
              className="w-full bg-[#F47B20] text-white py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Processing...' : 'Upload & Generate BOQ →'}
            </button>
          </form>
        </div>

        <div className="mt-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-800 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
     }
