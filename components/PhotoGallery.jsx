'use client';

import { useState } from 'react';

export default function PhotoGallery({ photos, title = 'Gallery' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <h2 className="text-base font-bold text-[#2C3E50] mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {photos.map((url, idx) => (
          <button
            key={idx}
            onClick={() => setLightboxIndex(idx)}
            className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-[#F47B20] transition"
          >
            <img
              src={url}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white text-3xl font-light hover:text-gray-300"
            aria-label="Close"
          >
            ×
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(
                    lightboxIndex === 0 ? photos.length - 1 : lightboxIndex - 1
                  );
                }}
                className="absolute left-4 text-white text-4xl font-light hover:text-gray-300"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(
                    lightboxIndex === photos.length - 1 ? 0 : lightboxIndex + 1
                  );
                }}
                className="absolute right-4 text-white text-4xl font-light hover:text-gray-300"
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}

          <img
            src={photos[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
