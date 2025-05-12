// src/components/DatePicker.jsx
'use client';

import React from 'react';

export default function DatePicker({ label, value, onChange }) {
  return (
    <div className="flex flex-col">
      {label && <label className="text-sm font-medium mb-1">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
