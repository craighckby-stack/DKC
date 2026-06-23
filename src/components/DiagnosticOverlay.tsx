import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DiagnosticOverlay = ({ status }: { status: string }) => (
  <div className="fixed bottom-4 right-4 bg-slate-900 border border-red-900 p-3 rounded-lg flex items-center gap-2">
    <AlertTriangle className="w-4 h-4 text-red-500" />
    <span className="text-[10px] text-red-300 font-mono">{status}</span>
  </div>
);