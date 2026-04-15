import React from 'react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  status?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ current, total, status }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full bg-slate-800 rounded-lg p-4 border border-slate-700 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-slate-300">{status || 'Processing batch...'}</span>
        <span className="text-sm text-slate-500">{current}/{total} ({percentage}%)</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
