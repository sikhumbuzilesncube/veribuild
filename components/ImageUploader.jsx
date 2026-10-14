'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Avatar from './Avatar';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export default function ImageUploader({
  imageUrl,
  onChange,
  userId,
  prefix = 'avatar',
  displayName = '',
  shape = 'circle',
  label = 'Upload an image',
  hint = '',
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleChoose = () => {
    inputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    if (!userId) {
      setError('You must be logged in.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 2 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, or WebP images allowed.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Remove the old file if it exists
      if (imageUrl) {
        const marker = '/gallery/';
        const idx = imageUrl.indexOf(marker);
        if (idx >= 0) {
          const oldPath = imageUrl.slice(idx + marker.length);
          await supabase.storage.from('gallery').remove([oldPath]);
        }
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/${prefix}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
      onChange(data.publicUrl);
      setUploading(false);
    } catch (err) {
      console.error('Unexpected upload error:', err);
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!imageUrl) return;

    const marker = '/gallery/';
    const idx = imageUrl.indexOf(marker);
    if (idx >= 0) {
      const path = imageUrl.slice(idx + marker.length);
      await supabase.storage.from('gallery').remove([path]);
    }

    onChange(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="flex items-center gap-4">
        <Avatar
          name={displayName}
          imageUrl={imageUrl}
          size={80}
          shape={shape}
        />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleChoose}
              disabled={uploading}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                uploading
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#F47B20] text-white hover:bg-[#E06B10]'
              }`}
            >
              {uploading ? 'Uploading...' : imageUrl ? 'Change' : 'Upload'}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
              >
                Remove
              </button>
            )}
          </div>
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}
    </div>
  );
      }
