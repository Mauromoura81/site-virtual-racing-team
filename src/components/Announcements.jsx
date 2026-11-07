import React from 'react';

export default function Announcements({ item }) {
  if (!item) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl space-y-3">
      <div className="flex justify-between items-center">
        <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase border border-emerald-800/50">
          Comunicado Oficial
        </span>
        <span className="text-[11px] text-gray-500">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
        </span>
      </div>
      <h3 className="text-lg font-extrabold text-white">{item.title}</h3>
      <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">{item.content}</p>
    </div>
  );
}