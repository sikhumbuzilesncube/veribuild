// ============================================================
// VERIBUILD BOQ ENGINE - INPUT VALIDATION
// ============================================================

import { num, int } from './utils.js';

export const INPUT_LIMITS = {
  floor_area:        { min: 10, max: 5000 },
  rooms:             { min: 1, max: 100 },
  doors:             { min: 0, max: 200 },
  windows:           { min: 0, max: 200 },
  wall_length:       { min: 5, max: 2000 },
  wall_height:       { min: 1.5, max: 6 },
  foundation_depth:  { min: 0.3, max: 4.0 },
  foundation_width:  { min: 0.2, max: 2.0 },
  slab_thickness:    { min: 0.05, max: 0.4 },
  electrical_points: { min: 0, max: 500 },
  plumbing_points:   { min: 0, max: 100 },
};

export function validateProject(project) {
  const warnings = [];
  const errors = [];

  const numericFields = [
    'floor_area', 'rooms', 'doors', 'windows', 'wall_length', 'wall_height',
    'foundation_depth', 'foundation_width', 'slab_thickness',
    'electrical_points', 'plumbing_points',
    'red_wall_length', 'green_concrete_area', 'yellow_timber_length',
    'brown_sewer_length', 'blue_water_length',
  ];

  for (const field of numericFields) {
    const value = project[field];
    if (value !== null && value !== undefined && value !== '') {
      const parsed = num(value, NaN);
      if (isNaN(parsed)) {
        errors.push(`${field} is not numeric`);
      }
    }
  }

  for (const [field, limits] of Object.entries(INPUT_LIMITS)) {
    const value = num(project[field], null);
    if (value === null) continue;
    if (value < limits.min) {
      warnings.push(`${field} = ${value} is below expected minimum ${limits.min}`);
    }
    if (value > limits.max) {
      warnings.push(`${field} = ${value} exceeds expected maximum ${limits.max}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Normalise a project row into a clean object the engine can consume
// Applies defaults where required
export function normaliseInputs(project) {
  return {
    floorArea:          num(project.floor_area, 85),
    rooms:              int(project.rooms, 4),
    doors:              int(project.doors, 4),
    windows:            int(project.windows, 2),
    wallLength:         num(project.wall_length, 63),
    wallHeight:         num(project.wall_height, 2.7),
    foundationType:     project.foundation_type || 'strip',
    foundationDepth:    num(project.foundation_depth, 0.6),
    foundationWidth:    num(project.foundation_width, 0.4),
    slabType:           project.slab_type || 'ground',
    slabThickness:      num(project.slab_thickness, 0.15),
    concreteGrade:      project.concrete_grade || 'C20',
    electricalPoints:   int(project.electrical_points, 8),
    plumbingPoints:     int(project.plumbing_points, 3),
    redWallLength:      num(project.red_wall_length, 0),
    greenConcreteArea:  num(project.green_concrete_area, 0),
    yellowTimberLength: num(project.yellow_timber_length, 35),
    brownSewerLength:   num(project.brown_sewer_length, 12),
    blueWaterLength:    num(project.blue_water_length, 18),
    windowDetails:      project.window_details || '',
    doorDetails:        project.door_details || '',
    roomLabels:         project.room_labels || '',
    cityId:             int(project.city_id, 1),
    planType:           project.plan_type || 'residential',
  };
}

// Map C-grade notation to Zimbabwe G-grade notation used by conversion tables
export function gradeToZim(grade) {
  const map = {
    C10: 'G10',
    C15: 'G15',
    C20: 'G20',
    C25: 'G25',
    C30: 'G30',
    G10: 'G10',
    G15: 'G15',
    G20: 'G20',
    G25: 'G25',
    G30: 'G30',
  };
  return map[grade] || 'G20';
                    }
