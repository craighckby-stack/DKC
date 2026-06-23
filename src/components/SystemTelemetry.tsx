import React from 'react';

export const SystemTelemetry = ({ pp, turn, status }: any) => (
  <div className="flex gap-4 text-[10px] font-mono bg-slate-900 px-4 py-2 rounded border border-slate-800">
    <div className="flex flex-col">
      <span className="text-slate-500">JESUS_PP</span>
      <span className={turn === 'jesus' ? 'text-blue-400' : 'text-slate-600'}>{pp.jesus}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-slate-500">CAAN_PP</span>
      <span className={turn === 'caan' ? 'text-rose-400' : 'text-slate-600'}>{pp.caan}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-slate-500">STATUS</span>
      <span className="text-emerald-400">{status.toUpperCase()}</span>
    </div>
  </div>
);