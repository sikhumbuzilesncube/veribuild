'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function PhotoUploader({ photos, onChange, userId }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleChoose = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    if (!userId) {
      setError('You must be logged in.');
      return;
    }

    if (photos.length >= MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Each photo must be under 5 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, or WebP photos allowed.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/gallery-${Date.now()}.${ext}`;

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
      onChange([...photos, data.publicUrl]);
      setUploading(false);
    } catch (err) {
      console.error('Unexpected upload error:', err);
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleRemove = async (url) => {
    const marker = '/gallery/';
    const idx = url.indexOf(marker);
    if (idx >= 0) {
      const path = url.slice(idx + marker.length);
      await supabase.storage.from('gallery').remove([path]);
    }
    onChange(photos.filter((p) => p !== url));
  };

  const handleMove = (index, direction) => {
    const next = [...photos];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const canAddMore = photos.length < MAX_PHOTOS && !uploading;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-gray-500">
          {photos.length} of {MAX_PHOTOS} photos
        </p>
        <button
          type="button"
          onClick={handleChoose}
          disabled={!canAddMore}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            canAddMore
              ? 'bg-[#F47B20] text-white hover:bg-[#E06B10]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {uploading ? 'Uploading...' : '+ Add Photo'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <p className="text-xs text-gray-500">
            No photos yet. Add up to {MAX_PHOTOS} photos of your work.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((url, idx) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
            >
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1">
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
              {photos.length > 1 && (
                <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                      idx === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === photos.length - 1}
                    className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                      idx === photos.length - 1
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  }
