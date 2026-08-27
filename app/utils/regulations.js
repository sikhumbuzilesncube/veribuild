// ============================================================
// SANS REGULATIONS - South African Standards
// ============================================================

export const sansRegulations = {
  // SANS 10400-N - Safety Glazing
  glazing: {
    lowLevel: 'Glass within 1200mm of finished floor requires safety glass',
    proximityToDoors: 'Glass within 300mm of door opening requires safety glass',
    bathrooms: 'All glass in bathrooms requires safety glass',
    largePanes: 'Large panes require 6.38mm laminated or toughened safety glass',
    markings: 'Safety glass must have permanent stamp from installer'
  },
  
  // SANS 10400-XA - Energy Efficiency
  energy: {
    maxWindowArea: 'Windows cannot exceed 15% of net floor area per storey',
    airInfiltration: 'Windows must be certified to SANS 613',
    doubleGlazing: 'For windows >15% of floor area, use high-performance double glazing'
  }
};

export function getRegulations() {
  return sansRegulations;
}
