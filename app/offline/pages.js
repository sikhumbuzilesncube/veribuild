import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-[#F47B20] rounded-2xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6">
          V
        </div>
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-4">You're Offline</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Please check your internet connection and try again.
        </p>
        <Link
          href="/"
          className="bg-[#F47B20] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#E06B10] transition inline-block"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
    }
