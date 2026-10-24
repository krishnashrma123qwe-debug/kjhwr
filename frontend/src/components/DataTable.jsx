import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ data }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, over, under
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((item) => {
      // Search matches date or time
      const matchesSearch =
        item.date.includes(searchTerm) ||
        item.time.includes(searchTerm) ||
        String(item.settlementPeriod).includes(searchTerm);

      if (!matchesSearch) return false;

      if (filterType === 'over') return item.error > 0;
      if (filterType === 'under') return item.error < 0;
      return true;
    });
  }, [data, searchTerm, filterType]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const downloadCSV = () => {
    if (!filteredData.length) return;
    const headers = ['Date', 'Time', 'SettlementPeriod', 'Actual_MW', 'Forecast_MW', 'Error_MW', 'AbsError_MW', 'CutoffPublishTime'];
    const rows = filteredData.map((d) => [
      d.date,
      d.time,
      d.settlementPeriod,
      d.actual,
      d.forecast ?? '',
      d.error ?? '',
      d.abs_error ?? '',
      d.publishTime ?? '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wind_evaluation_jan2026_${filterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-white">Settlement Period Verification Records</h2>
          <p className="text-xs text-slate-400">
            Elexon BMRS half-hourly records ({filteredData.length} total matched)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search date, time..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-44"
            />
          </div>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Records</option>
            <option value="over">Over-forecasts Only (&gt; 0 MW)</option>
            <option value="under">Under-forecasts Only (&lt; 0 MW)</option>
          </select>

          {/* CSV Download */}
          <button
            onClick={downloadCSV}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
            <tr>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3 text-center">Period</th>
              <th className="py-2.5 px-3 text-right">Actual (MW)</th>
              <th className="py-2.5 px-3 text-right">DA Forecast (MW)</th>
              <th className="py-2.5 px-3 text-right">Error (MW)</th>
              <th className="py-2.5 px-3 text-right">Abs Error (MW)</th>
              <th className="py-2.5 px-3">Locked Forecast Publish Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2 px-3 font-medium text-slate-200">{row.date}</td>
                <td className="py-2 px-3 text-slate-300 font-mono">{row.time}</td>
                <td className="py-2 px-3 text-center text-slate-400 font-mono">{row.settlementPeriod}</td>
                <td className="py-2 px-3 text-right font-mono font-medium text-emerald-400">
                  {row.actual.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right font-mono text-sky-400">
                  {row.forecast?.toLocaleString() ?? 'N/A'}
                </td>
                <td
                  className={`py-2 px-3 text-right font-mono font-semibold ${
                    row.error > 0 ? 'text-amber-400' : 'text-cyan-400'
                  }`}
                >
                  {row.error > 0 ? `+${row.error.toLocaleString()}` : row.error?.toLocaleString() ?? 'N/A'}
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-300">
                  {row.abs_error?.toLocaleString() ?? 'N/A'}
                </td>
                <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                  {row.publishTime ? row.publishTime.replace('T', ' ').slice(0, 16) + ' UTC' : 'Pre-window'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-3 text-xs text-slate-400">
        <div>
          Showing {(page - 1) * pageSize + 1} to{' '}
          {Math.min(page * pageSize, filteredData.length)} of {filteredData.length} records
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 rounded bg-slate-800 border border-slate-700 disabled:opacity-40 hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-200">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 rounded bg-slate-800 border border-slate-700 disabled:opacity-40 hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
