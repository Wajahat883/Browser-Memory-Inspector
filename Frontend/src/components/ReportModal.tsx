import { Download, X } from 'lucide-react';
import { useStorageStore } from '../store/storageStore';
import { reportGenerator } from '../services/reportGenerator';
import { getRiskLevelEmoji } from '../utils/formatter';

interface ReportModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function ReportModal({
  onClose,
  onConfirm,
}: ReportModalProps) {
  const report = useStorageStore((state) => state.report);

  if (!report) {
    return null;
  }

  const handleDownload = (format: 'json' | 'csv') => {
    reportGenerator.downloadReport(report, format);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Security Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700/50 p-4 rounded">
                <p className="text-gray-400 text-sm">Total Items</p>
                <p className="text-2xl font-bold text-white">
                  {report.summary.totalItems}
                </p>
              </div>
              <div className="bg-red-900/20 border border-red-700 p-4 rounded">
                <p className="text-gray-400 text-sm">High Risk</p>
                <p className="text-2xl font-bold text-red-400">
                  {report.summary.riskLevels.high}
                </p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded">
                <p className="text-gray-400 text-sm">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {report.summary.riskLevels.medium}
                </p>
              </div>
              <div className="bg-green-900/20 border border-green-700 p-4 rounded">
                <p className="text-gray-400 text-sm">Low Risk</p>
                <p className="text-2xl font-bold text-green-400">
                  {report.summary.riskLevels.low}
                </p>
              </div>
            </div>
          </div>

          {/* Storage Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Storage Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-900/20 border border-blue-700 p-4 rounded">
                <p className="text-gray-400 text-sm">🍪 Cookies</p>
                <p className="text-xl font-bold text-blue-400">
                  {report.summary.storageBreakdown.cookies}
                </p>
              </div>
              <div className="bg-purple-900/20 border border-purple-700 p-4 rounded">
                <p className="text-gray-400 text-sm">💾 Local Storage</p>
                <p className="text-xl font-bold text-purple-400">
                  {report.summary.storageBreakdown.localStorage}
                </p>
              </div>
              <div className="bg-orange-900/20 border border-orange-700 p-4 rounded">
                <p className="text-gray-400 text-sm">⏱️ Session Storage</p>
                <p className="text-xl font-bold text-orange-400">
                  {report.summary.storageBreakdown.sessionStorage}
                </p>
              </div>
            </div>
          </div>

          {/* Findings */}
          {report.findings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Findings ({report.findings.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {report.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="bg-gray-700/50 border border-gray-600 p-4 rounded"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono text-sm text-gray-300">
                          {finding.entry.key}
                        </p>
                        <p className="text-xs text-gray-500">
                          {finding.entry.type}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                          finding.riskLevel === 'high'
                            ? 'bg-red-600 text-white'
                            : finding.riskLevel === 'medium'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-green-600 text-white'
                        }`}
                      >
                        {getRiskLevelEmoji(finding.riskLevel)}{' '}
                        {finding.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-2">
                      {finding.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Recommendations
              </h3>
              <ul className="space-y-2">
                {report.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-sm text-gray-300 bg-gray-700/30 p-3 rounded"
                  >
                    <span className="flex-shrink-0">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex gap-3 justify-end">
          <button
            onClick={() => handleDownload('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => handleDownload('json')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            <Download size={18} />
            Export JSON
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
