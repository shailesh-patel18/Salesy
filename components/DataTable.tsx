import React from 'react';

interface DataTableProps {
  data: any[];
  columns: string[];
}

export const DataTable: React.FC<DataTableProps> = ({ data, columns }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 my-4 shadow-sm">
      <table className="w-full text-left border-collapse bg-slate-900/50">
        <thead>
          <tr className="bg-slate-800 border-b border-slate-700">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {col.replace('_', ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-slate-800/50 transition-colors">
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 text-sm text-slate-300 truncate max-w-[200px]">
                  {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]?.toString() || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
