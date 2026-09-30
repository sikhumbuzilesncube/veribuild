'use client';

import { useRouter } from 'next/navigation';

// Plan drawing cost ranges per m², by building type.
// Based on typical Zimbabwean architectural practice, 2025-2026.
const PLAN_RATES = {
  house: {
    label: 'House',
    architectural: [2.50, 3.50],
    structural: [1.50, 2.00],
    council: [0.80, 1.20],
  },
  cottage: {
    label: 'Cottage',
    architectural: [3.00, 4.00],
    structural: [1.50, 2.00],
    council: [0.80, 1.20],
  },
  outbuilding: {
    label: 'Outbuilding',
    architectural: [3.50, 4.50],
    structural: [1.50, 2.00],
    council: [0.80, 1.20],
  },
  commercial: {
    label: 'Commercial',
    architectural: [4.00, 6.00],
    structural: [2.00, 3.00],
    council: [1.00, 1.50],
  },
  // Rural structures use the outbuilding range
  rural: {
    label: 'Rural / Auxiliary',
    architectural: [3.50, 4.50],
    structural: [1.50, 2.00],
    council: [0.80, 1.20],
  },
};

export default function PlanDrawingEstimate({ project, floorArea, cityId }) {
  const router = useRouter();

  // Determine rate band from the project's plan_type
  const planType = String(project.plan_type || '').toLowerCase();
  const rates = PLAN_RATES[planType] || PLAN_RATES.house;

  // Compute low and high estimates for each category
  const computeRange = (perM2Range) => {
    const low = Math.round(perM2Range[0] * floorArea);
    const high = Math.round(perM2Range[1] * floorArea);
    return [low, high];
  };

  const architectural = computeRange(rates.architectural);
  const structural = computeRange(rates.structural);
  const council = computeRange(rates.council);

  // Total per m² range (for the general reference figure)
  const perM2Low = (
    rates.architectural[0] +
    rates.structural[0] +
    rates.council[0]
  ).toFixed(2);
  const perM2High = (
    rates.architectural[1] +
    rates.structural[1] +
    rates.council[1]
  ).toFixed(2);

  const totalLow = architectural[0] + structural[0] + council[0];
  const totalHigh = architectural[1] + structural[1] + council[1];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <div className="bg-[#2C3E50] text-white px-4 sm:px-6 py-3">
        <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">
          Next Step — Plan Drawings
        </h2>
      </div>

      <div className="p-4 sm:p-6">
        <p className="text-sm text-gray-700 mb-4">
          You have a template-based BOQ. To proceed with construction, you will
          need approved architectural and structural drawings for council
          submission. The estimate below is based on your project size of{' '}
          <strong>{floorArea} m²</strong>.
        </p>

        <table className="w-full text-sm mb-4">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-600">Architectural drawings</td>
              <td className="py-2 text-right font-medium text-[#2C3E50]">
                ${architectural[0]} – ${architectural[1]}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-600">Structural drawings</td>
              <td className="py-2 text-right font-medium text-[#2C3E50]">
                ${structural[0]} – ${structural[1]}
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-600">Council submission set</td>
              <td className="py-2 text-right font-medium text-[#2C3E50]">
                ${council[0]} – ${council[1]}
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 font-bold text-[#2C3E50] uppercase text-sm">
                Total estimate
              </td>
              <td className="py-3 text-right font-bold text-[#2C3E50] text-base">
                ${totalLow} – ${totalHigh}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-xs text-gray-500 mb-4">
          Typical plan drawing cost in Zimbabwe: ${perM2Low} – ${perM2High} per m²
          of floor area. Actual cost depends on complexity, number of revisions,
          and the architect you choose.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/architects?city=${cityId || 1}`)}
            className="bg-[#F47B20] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#E06B10] transition text-sm"
          >
            See architects in your city
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('boq-summary-anchor');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
          >
            Back to BOQ
          </button>
        </div>
      </div>
    </div>
  );
  }
