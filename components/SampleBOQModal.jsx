// components/SampleBOQModal.jsx
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { IconCheck, IconClose } from '@/components/Icons';

export default function SampleBOQModal({ open, onClose }) {
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Sample output
            </p>
            <h3 className="text-2xl font-bold mt-1 text-slate-700">
              3-Bedroom Residential House
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Harare, Zimbabwe</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-slate-700 transition p-1"
          >
            <IconClose />
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-700 text-white">
              <tr>
                <th className="p-3 text-left font-medium">Item</th>
                <th className="p-3 text-right font-medium">Qty</th>
                <th className="p-3 text-right font-medium">Unit</th>
                <th className="p-3 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {[
                ['Cement 50kg', '45', 'bags', '$540'],
                ['Standard brick', '450', 'pcs', '$180'],
                ['Steel rebar 12mm', '28', 'pcs', '$392'],
                ['Wall paint 20L', '20', 'litres', '$400'],
              ].map(([m, q, u, p]) => (
                <tr key={m} className="border-b border-gray-100">
                  <td className="p-3">{m}</td>
                  <td className="p-3 text-right tabular-nums">{q}</td>
                  <td className="p-3 text-right text-gray-500">{u}</td>
                  <td className="p-3 text-right tabular-nums font-medium">{p}</td>
                </tr>
              ))}
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="p-3 font-medium">Labour — skilled &amp; general</td>
                <td className="p-3 text-right text-gray-500">—</td>
                <td className="p-3 text-right text-gray-500">—</td>
                <td className="p-3 text-right tabular-nums font-medium">$3,200</td>
              </tr>
              <tr className="bg-brand-500/5 font-bold">
                <td className="p-3" colSpan={3}>
                  Estimated total
                </td>
                <td className="p-3 text-right text-brand-500 tabular-nums">$8,050</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center gap-3 text-sm bg-green-50 border border-green-100 rounded-lg p-4">
          <IconCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">
            <strong>Best price: Builders Warehouse — $4,360 on materials.</strong> Save $490 by
            ordering from this supplier.
          </p>
        </div>

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
