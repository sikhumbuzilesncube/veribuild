// ============================================================
// VERIBUILD SUBSCRIPTION PLANS
// Pricing data and helpers. Single source of truth.
// Changes here affect the subscription page and dashboards.
// ============================================================

export const SUBSCRIPTION_CATEGORIES = [
  {
    key: 'construction',
    label: 'Construction Company',
    description: 'Builders, contractors, and civil works companies',
    table: 'construction_companies',
    nameField: 'company_name',
    plans: [
      {
        key: 'starter',
        label: 'Starter',
        priceUsd: 15,
        coverage: 'local',
        placement: 'marketplace',
        features: [
          'Listed in the marketplace directory',
          'Visible to all users browsing for contractors',
          'Not shown on BOQ documents',
        ],
      },
      {
        key: 'pro_local',
        label: 'Pro — Local',
        priceUsd: 45,
        coverage: 'local',
        placement: 'boq',
        features: [
          'Everything in Starter',
          'Appears on BOQ documents in your city',
          'Up to 2 construction slots per BOQ',
          'Priority ranking by rating and experience',
        ],
      },
      {
        key: 'pro_national',
        label: 'Pro — National',
        priceUsd: 75,
        coverage: 'national',
        placement: 'boq',
        features: [
          'Everything in Pro — Local',
          'Appears on BOQ documents in all 47 cities',
          'Featured on every BOQ generated in Zimbabwe',
        ],
      },
    ],
  },
  {
    key: 'architect',
    label: 'Architect or Draftsman',
    description: 'Architects, draftsmen, and plan designers',
    table: 'architects',
    nameField: 'firm_name',
    plans: [
      {
        key: 'starter',
        label: 'Starter',
        priceUsd: 15,
        coverage: 'local',
        placement: 'marketplace',
        features: [
          'Listed in the marketplace directory',
          'Visible to all users browsing for architects',
          'Not shown on BOQ documents',
        ],
      },
      {
        key: 'pro_local',
        label: 'Pro — Local',
        priceUsd: 40,
        coverage: 'local',
        placement: 'boq',
        features: [
          'Everything in Starter',
          'Appears on template BOQ documents in your city',
          'Up to 3 architect slots per BOQ',
          'Appears below the plan drawing estimate',
        ],
      },
      {
        key: 'pro_national',
        label: 'Pro — National',
        priceUsd: 70,
        coverage: 'national',
        placement: 'boq',
        features: [
          'Everything in Pro — Local',
          'Appears on template BOQ documents in all 47 cities',
          'Featured on every template BOQ generated in Zimbabwe',
        ],
      },
    ],
  },
  {
    key: 'worker',
    label: 'Skilled Worker',
    description: 'Masons, carpenters, plumbers, electricians, and other trades',
    table: 'workers',
    nameField: 'full_name',
    plans: [
      {
        key: 'starter',
        label: 'Starter',
        priceUsd: 5,
        coverage: 'local',
        placement: 'marketplace',
        features: [
          'Listed in the marketplace directory',
          'Visible to all users browsing for workers',
          'Not shown on BOQ documents',
        ],
      },
      {
        key: 'pro_local',
        label: 'Pro — Local',
        priceUsd: 15,
        coverage: 'local',
        placement: 'boq',
        features: [
          'Everything in Starter',
          'Appears on BOQ documents in your city',
          'Up to 2 worker slots per BOQ',
          'Priority ranking by rating',
        ],
      },
      {
        key: 'pro_national',
        label: 'Pro — National',
        priceUsd: 35,
        coverage: 'national',
        placement: 'boq',
        features: [
          'Everything in Pro — Local',
          'Appears on BOQ documents in all 47 cities',
          'Featured on every BOQ generated in Zimbabwe',
        ],
      },
    ],
  },
  {
    key: 'hardware',
    label: 'Hardware Store',
    description: 'Hardware shops, building suppliers, and cement dealers',
    table: 'hardware_stores',
    nameField: 'store_name',
    plans: [
      {
        key: 'starter',
        label: 'Starter',
        priceUsd: 15,
        coverage: 'local',
        placement: 'marketplace',
        features: [
          'Listed in the marketplace directory',
          'Your product prices compared on BOQ pages in your city',
          'Appears in "Other Hardware Suppliers" section',
        ],
      },
      {
        key: 'pro_local',
        label: 'Pro — Local',
        priceUsd: 35,
        coverage: 'local',
        placement: 'boq',
        features: [
          'Everything in Starter',
          'Appears in "Featured Hardware Suppliers" on BOQ pages in your city',
          'Top of the comparison list',
          'Up to 3 featured hardware slots per city',
        ],
      },
      {
        key: 'pro_national',
        label: 'Pro — National',
        priceUsd: 55,
        coverage: 'national',
        placement: 'boq',
        features: [
          'Everything in Pro — Local',
          'Featured on BOQ pages in all 47 cities',
          'Maximum visibility across Zimbabwe',
        ],
      },
    ],
  },
];

// ------------------------------------------------------------
// Convert a plan to the fields to write to the database
// ------------------------------------------------------------
export function planToDbFields(category, planKey) {
  const cat = SUBSCRIPTION_CATEGORIES.find((c) => c.key === category);
  if (!cat) return null;

  const plan = cat.plans.find((p) => p.key === planKey);
  if (!plan) return null;

  const cityIds =
    plan.coverage === 'national'
      ? [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
          21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
          38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
        ]
      : [];

  return {
    subscription_tier: plan.placement === 'boq' ? 'premium' : 'standard',
    subscription_coverage: plan.coverage,
    subscription_status: 'active',
    featured_city_ids: cityIds,
    subscription_plan_key: plan.key,
    subscription_price_usd: plan.priceUsd,
  };
}

// ------------------------------------------------------------
// Get a category by key
// ------------------------------------------------------------
export function getCategory(key) {
  return SUBSCRIPTION_CATEGORIES.find((c) => c.key === key);
}

export default {
  SUBSCRIPTION_CATEGORIES,
  planToDbFields,
  getCategory,
};
