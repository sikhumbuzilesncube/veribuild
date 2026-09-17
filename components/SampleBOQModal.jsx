// components/SampleBOQModal.jsx
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { IconCheck, IconClose } from '@/components/Icons';

export default function SampleBOQModal({ open, onClose }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sections = [
    {
      code: 'A',
      name: 'Substructure',
      items: [
        ['A.1', 'Excavation to foundation trenches', 'm³', '45.8', '$1,145.00'],
        ['A.2', 'Concrete Grade G20 in foundations', 'm³', '12.4', '$2,080.00'],
        ['A.9', 'High yield steel Y12 reinforcement', 'kg', '944', '$1,699.20'],
        ['A.10', 'Common bricks in foundation walls', 'nr', '3,096', '$599.00'],
      ],
      subtotal: '$4,944.32',
    },
    {
      code: 'B',
      name: 'Superstructure',
      items: [
        ['B.1', 'Concrete Grade G20 ground floor slab, 150mm', 'm³', '12.8', '$1,672.00'],
        ['B.2', 'Steel fabric reinforcement Ref S193', 'sheet', '7', '$315.00'],
        ['B.3', 'Common bricks in walls, 230mm', 'nr', '17,298', '$3,800.00'],
        ['B.6', 'Galvanised hoop iron ties for wall plate', 'nr', '53', '$79.50'],
      ],
      subtotal: '$9,474.93',
    },
    {
      code: 'C',
      name: 'Roof',
      items: [
        ['C.1', 'Roof trusses, timber, at 900mm centres', 'nr', '71', '$6,035.00'],
        ['C.2', 'Sawn timber purlins 50 × 75mm, treated', 'm', '79.3', '$713.70'],
        ['C.3', 'IBR roof sheeting 0.47mm fixed to purlins', 'sheet', '103', '$1,287.50'],
      ],
      subtotal: '$9,020.30',
    },
    {
      code: 'D',
      name: 'Finishes',
      items: [
        ['D.1', 'Cement and sand render to internal walls', 'm²', '158.4', '$429.00'],
        ['D.5', 'Ceramic floor tiles 400 × 400mm, laid', 'm²', '86', '$1,290.00'],
        ['D.10', 'Plasterboard ceiling, 6mm, fixed to brandering', 'sheet', '31', '$341.00'],
      ],
      subtotal: '$4,758.78',
    },
    {
      code: 'E',
      name: 'Services',
      items: [
        ['E.3', 'Sanitary fittings — WC, basin, bath, taps', 'set', '3', '$360.00'],
        ['E.4', 'Electrical installation — wiring, conduit, boxes', 'point', '8', '$360.00'],
      ],
      subtotal: '$1,100.00',
    },
    {
      code: 'F',
      name: 'Labour',
      items: [
        ['F.1', 'Bricklayer + 2 assistants', 'man-day', '130.2', '$1,953.00'],
        ['F.2', 'General labourer', 'man-day', '8.3', '$66.40'],
        ['F.3', 'Plumber + 1 assistant', 'man-day', '2', '$36.00'],
      ],
      subtotal: '$2,055.40',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Sample BOQ output
            </p>
            <h3 className="text-2xl font-bold mt-1 text-slate-700">
              3-Bedroom Residential House
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Borrowdale, Harare · Generated in 2 min 47 sec
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-slate-700 transition p-1"
          >
            <IconClose />
          </button>
        </div>

        {/* Section summary strip */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          {sections.map((s) => (
            <div
              key={s.code}
              className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center"
            >
              <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
                {s.code}
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1 truncate">
                {s.name}
              </p>
              <p className="text-[11px] text-gray-500 tabular-nums mt-1">
                {s.subtotal}
              </p>
            </div>
          ))}
        </div>

        {/* Detailed sections */}
        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.code}>
              <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-gray-100">
                <h4 className="font-bold text-slate-700 text-sm">
                  <span className="text-brand-500 mr-2">Section {s.code}</span>
                  {s.name}
                </h4>
                <span className="text-xs text-gray-400 tabular-nums">
                  Subtotal: <span className="text-slate-700 font-semibold">{s.subtotal}</span>
                </span>
              </div>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium w-12">Ref</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                      <th className="px-3 py-2 text-right font-medium w-12">Unit</th>
                      <th className="px-3 py-2 text-right font-medium w-16">Qty</th>
                      <th className="px-3 py-2 text-right font-medium w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {s.items.map(([ref, desc, unit, qty, amount]) => (
                      <tr key={ref} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-400 tabular-nums">{ref}</td>
                        <td className="px-3 py-2">{desc}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{unit}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{qty}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">
                          {amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-slate-700 text-white rounded-xl p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Subtotal (all sections)</span>
              <span className="tabular-nums">$31,353.73</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Contingency (5%)</span>
              <span className="tabular-nums">$1,567.69</span>
            </div>
            <div className="flex justify-between pt-3 mt-3 border-t border-white/10">
              <span className="font-bold">Grand Total</span>
              <span className="font-bold text-brand-500 text-lg tabular-nums">
                $32,921.42
              </span>
            </div>
          </div>
        </div>

        {/* Hardware comparison */}
        <div className="mt-5 flex items-start gap-3 text-sm bg-green-50 border border-green-100 rounded-lg p-4">
          <IconCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-green-800">
            <p className="font-semibold">Material pricing matched across 3 local hardware stores</p>
            <p className="text-xs mt-1">
              Basil Place · 0777893524 — matched items shown. Prices update automatically.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="bg-brand-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-600 transition"
          >
            Generate my own BOQ
          </Link>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-slate-700 px-4 py-3 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
         }
