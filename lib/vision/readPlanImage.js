function normaliseExtraction(raw) {
  const fields = {};
  const notesParts = [];

  if (passes(raw.floor_area, 'floorArea')) {
    fields.floor_area = round1(raw.floor_area.value);
    notesParts.push(`floor_area=${fields.floor_area} (conf ${fmt(raw.floor_area.confidence)})`);
  }

  if (passes(raw.wall_length, 'wallLength')) {
    fields.wall_length = round1(raw.wall_length.value);
    notesParts.push(`wall_length=${fields.wall_length} (conf ${fmt(raw.wall_length.confidence)})`);
  }

  if (
    fields.floor_area === undefined &&
    fields.wall_length !== undefined &&
    fields.wall_length >= 15
  ) {
    const estimatedArea = round1(Math.pow(fields.wall_length / 4.8, 2));
    if (estimatedArea >= 20 && estimatedArea <= 500) {
      fields.floor_area = estimatedArea;
      notesParts.push(`floor_area=${estimatedArea} (estimated from perimeter)`);
    }
  }

  if (
    fields.wall_length === undefined &&
    fields.floor_area !== undefined &&
    fields.floor_area >= 20
  ) {
    const estimatedWallLength = round1(4 * Math.sqrt(fields.floor_area) * 1.15);
    if (estimatedWallLength >= 15 && estimatedWallLength <= 400) {
      fields.wall_length = estimatedWallLength;
      notesParts.push(`wall_length=${estimatedWallLength} (estimated from area)`);
    }
  }

  if (raw.rooms && raw.rooms.count !== null && raw.rooms.count !== undefined) {
    const conf = Number(raw.rooms.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM && isPlausible('rooms', raw.rooms.count)) {
      fields.rooms = Math.round(raw.rooms.count);
      if (Array.isArray(raw.rooms.labels) && raw.rooms.labels.length > 0) {
        fields.room_labels = raw.rooms.labels.join(', ');
      }
      notesParts.push(`rooms=${fields.rooms} (conf ${fmt(conf)})`);
    }
  }

  if (raw.doors && raw.doors.count !== null && raw.doors.count !== undefined) {
    const conf = Number(raw.doors.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM && isPlausible('doors', raw.doors.count)) {
      fields.doors = Math.round(raw.doors.count);
      notesParts.push(`doors=${fields.doors} (conf ${fmt(conf)})`);
    }
  }

  if (raw.windows && raw.windows.count !== null && raw.windows.count !== undefined) {
    const conf = Number(raw.windows.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM && isPlausible('windows', raw.windows.count)) {
      fields.windows = Math.round(raw.windows.count);
      notesParts.push(`windows=${fields.windows} (conf ${fmt(conf)})`);
    }
  }

  if (passes(raw.foundation_depth, 'foundationDepth')) {
    fields.foundation_depth = round2(raw.foundation_depth.value);
    notesParts.push(`foundation_depth=${fields.foundation_depth} (conf ${fmt(raw.foundation_depth.confidence)})`);
  }

  if (raw.wall_thickness && raw.wall_thickness.value) {
    const conf = Number(raw.wall_thickness.confidence) || 0;
    const value = Number(raw.wall_thickness.value);
    if (conf >= CONFIDENCE_MINIMUM && (value === 115 || value === 230)) {
      notesParts.push(`wall_thickness=${value}mm (conf ${fmt(conf)})`);
    }
  }

  // NEW: brick types and plaster scope
  if (raw.foundation_brick_type && raw.foundation_brick_type.value) {
    const conf = Number(raw.foundation_brick_type.confidence) || 0;
    const value = String(raw.foundation_brick_type.value).toLowerCase();
    if (conf >= CONFIDENCE_MINIMUM && ['common', 'industrial'].includes(value)) {
      fields.foundation_brick_type = value;
      notesParts.push(`foundation_brick=${value} (conf ${fmt(conf)})`);
    }
  }

  if (raw.wall_brick_type && raw.wall_brick_type.value) {
    const conf = Number(raw.wall_brick_type.confidence) || 0;
    const value = String(raw.wall_brick_type.value).toLowerCase();
    if (conf >= CONFIDENCE_MINIMUM && ['common', 'industrial', 'face', 'mixed'].includes(value)) {
      fields.wall_brick_type = value;
      notesParts.push(`wall_brick=${value} (conf ${fmt(conf)})`);
    }
  }

  if (raw.plaster_scope && raw.plaster_scope.value) {
    const conf = Number(raw.plaster_scope.confidence) || 0;
    const value = String(raw.plaster_scope.value).toLowerCase();
    if (conf >= CONFIDENCE_MINIMUM && ['both', 'interior', 'exterior', 'none'].includes(value)) {
      fields.plaster_scope = value;
      notesParts.push(`plaster_scope=${value} (conf ${fmt(conf)})`);
    }
  }

  if (raw.door_codes && Array.isArray(raw.door_codes.list) && raw.door_codes.list.length > 0) {
    const conf = Number(raw.door_codes.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM) {
      fields.door_details = raw.door_codes.list.join(', ');
      notesParts.push(`door_codes=${fields.door_details} (conf ${fmt(conf)})`);
    }
  }

  if (raw.window_codes && Array.isArray(raw.window_codes.list) && raw.window_codes.list.length > 0) {
    const conf = Number(raw.window_codes.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM) {
      fields.window_details = raw.window_codes.list.join(', ');
      notesParts.push(`window_codes=${fields.window_details} (conf ${fmt(conf)})`);
    }
  }

  if (raw.plan_notes && Array.isArray(raw.plan_notes.list) && raw.plan_notes.list.length > 0) {
    const conf = Number(raw.plan_notes.confidence) || 0;
    if (conf >= CONFIDENCE_MINIMUM) {
      notesParts.push(`plan_notes="${raw.plan_notes.list.join(' | ')}"`);
    }
  }

  if (raw.overall_confidence && raw.overall_confidence.value !== undefined) {
    notesParts.push(`overall=${fmt(raw.overall_confidence.value)}`);
  }

  fields.notes = `Extracted from PDF via vision: ${notesParts.join(', ')}`;
  fields.status = 'processing';

  return fields;
        }
