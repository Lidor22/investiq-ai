import { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import {
  getExportSummaryUrl,
  getExportPriceHistoryUrl,
  getExportFinancialsUrl,
} from '../../services/api';

interface ExportMenuProps {
  ticker: string;
}

export function ExportMenu({ ticker }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (url: string) => {
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Download className="h-4 w-4" />
        Export
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              onClick={() => handleExport(getExportSummaryUrl(ticker))}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="text-xs font-medium text-gray-400">CSV</span>
              Stock Summary
            </button>
            <button
              onClick={() => handleExport(getExportPriceHistoryUrl(ticker))}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="text-xs font-medium text-gray-400">CSV</span>
              Price History
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => handleExport(getExportFinancialsUrl(ticker))}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="text-xs font-medium text-blue-500">JSON</span>
              All Financial Data
            </button>
          </div>
        </>
      )}
    </div>
  );
}
