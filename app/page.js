'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [showSample, setShowSample] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#2C3E50] text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#F47B20]">🏗️ VeriBuild</h1>
            <p className="text-sm text-gray-300">A product of GatekeeperAI</p>
          </div>
          <div className="space-x-4">
            <Link href="/login" className="hover:text-[#F47B20] transition">Login</Link>
            <Link href="/register" className="bg-[#F47B20] px-4 py-2 rounded hover:bg-[#E06B10] transition">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-[#2C3E50] mb-6">
            Generate Professional BOQ from Floor Plans
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            in 3 minutes and get material costs from local hardwares
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/register" className="bg-[#F47B20] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#E06B10] transition">
              Get Started →
            </Link>
            <button 
              onClick={() => setShowSample(!showSample)}
              className="border-2 border-[#F47B20] text-[#F47B20] px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#F47B20] hover:text-white transition"
            >
              View Sample BOQ
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-[#2C3E50] mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-5xl mb-4">📤</div>
              <h4 className="text-xl font-bold mb-2">Upload Your Plan</h4>
              <p className="text-gray-600">Upload a PDF, JPEG, or PNG of your floor plan</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-5xl mb-4">🔍</div>
              <h4 className="text-xl font-bold mb-2">AI Reads Your Plan</h4>
              <p className="text-gray-600">Extracts rooms, dimensions, doors, and windows</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-5xl mb-4">📋</div>
              <h4 className="text-xl font-bold mb-2">Get Your BOQ</h4>
              <p className="text-gray-600">Professional BOQ with hardware prices and worker suggestions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample BOQ */}
      {showSample && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-[#2C3E50] mb-6">Sample BOQ Preview</h3>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">3-Bedroom Residential House</span>
                <span className="text-sm text-gray-600">Harare, Zimbabwe</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-[#2C3E50] text-white">
                  <tr>
                    <th className="p-2 text-left">Material</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Price (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-2">Cement 50kg</td><td>45</td><td>bags</td><td>$540</td></tr>
                  <tr className="border-b"><td className="p-2">Standard Brick</td><td>450</td><td>pieces</td><td>$180</td></tr>
                  <tr className="border-b"><td className="p-2">Steel Rebar 12mm</td><td>28</td><td>pieces</td><td>$392</td></tr>
                  <tr className="border-b"><td className="p-2">Wall Paint 20L</td><td>20</td><td>litres</td><td>$400</td></tr>
                  <tr className="font-bold"><td className="p-2">Total</td><td></td><td></td><td>$4,850</td></tr>
                </tbody>
              </table>
              <div className="mt-4 text-center">
                <a href="/sample-boq.pdf" className="text-[#F47B20] hover:underline">📥 Download Full Sample BOQ (PDF)</a>
              </div>
            </div>
            <div className="text-center mt-4">
              <button onClick={() => setShowSample(false)} className="text-gray-500 hover:text-gray-700">
                Close Preview ✕
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#2C3E50] text-white p-6 text-center">
        <p>© 2026 VeriBuild. A product of GatekeeperAI. All rights reserved.</p>
        <p className="text-sm text-gray-400 mt-2">Zimbabwe's #1 BOQ Generation Platform</p>
      </footer>
    </div>
  );
    }
