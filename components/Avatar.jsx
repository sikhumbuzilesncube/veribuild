'use client';

const COLORS = [
  '#F47B20', '#2C3E50', '#1E88E5', '#43A047',
  '#8E24AA', '#E53935', '#FB8C00', '#00897B',
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export default function Avatar({ name, imageUrl, size = 64, shape = 'circle' }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const color = COLORS[hashString(name || '?') % COLORS.length];
  const radius = shape === 'circle' ? '9999px' : '8px';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'Avatar'}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: 'cover',
        }}
        className="border border-gray-200 flex-shrink-0"
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color,
        fontSize: Math.round(size * 0.4),
      }}
      className="flex items-center justify-center text-white font-bold flex-shrink-0"
    >
      {initial}
    </div>
  );
    }
