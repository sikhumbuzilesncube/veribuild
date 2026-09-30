'use client';

import { useRouter } from 'next/navigation';

export default function ArchitectsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-800 mb-3"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-2">
            Architects
          </h1>
          <p className="text-gray-600 text-sm">
            Find Zimbabwean architects and draftsmen who can prepare approved
            drawings for your project.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <div className="text-5xl mb-4 text-gray-300">[ ]</div>
          <h2 className="text-lg font-bold text-[#2C3E50] mb-2">
            Architect directory is coming soon
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
            We are onboarding architects and drafting firms across Zimbabwe.
            If you would like to be contacted when the directory is live, or
            if you are an architect who would like to be listed, get in touch.
          </p>

          <a
            href="https://wa.me/263777803517"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#F47B20] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition"
          >
            Contact VeriBuild
          </a>

          <p className="text-xs text-gray-500 mt-4">
            Update the WhatsApp number above with your own contact before
            deploying.
          </p>
        </div>
      </div>
    </div>
  );
              }
