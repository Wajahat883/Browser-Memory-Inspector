import { useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { useStorageStore, useFilteredEntries } from '../store/storageStore';
import { reportGenerator } from '../services/reportGenerator';
import StorageViewer from './StorageViewer';
import FilterPanel from './FilterPanel';
import ReportModal from './ReportModal';
import StatsCard from './StatsCard';

interface DashboardProps {
  onRefresh: () => void;
}

export default function Dashboard({ onRefresh }: DashboardProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState<number | null>(null);

  const entries = useStorageStore((state) => state.entries);
  const alerts = useStorageStore((state) => state.alerts);
  const error = useStorageStore((state) => state.error);
  const setReport = useStorageStore((state) => state.setReport);

  const filteredEntries = useFilteredEntries();

  // Auto-refresh effect
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
    }, autoRefresh * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const handleGenerateReport = () => {
    const report = reportGenerator.generate(entries);
    setReport(report);
    setShowReportModal(true);
  };

  const highRiskCount = alerts.filter((a) => a.riskLevel === 'high').length;
  const mediumRiskCount = alerts.filter(
    (a) => a.riskLevel === 'medium'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                🔍 Browser Memory Inspector
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Analyze browser storage for security vulnerabilities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={autoRefresh || ''}
                onChange={(e) =>
                  setAutoRefresh(e.target.value ? parseInt(e.target.value) : null)
                }
                className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">No auto-refresh</option>
                <option value="5">Refresh every 5s</option>
                <option value="10">Refresh every 10s</option>
                <option value="30">Refresh every 30s</option>
              </select>

              <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                <RefreshCw size={18} />
                Refresh
              </button>

              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
              >
                <Download size={18} />
                Report
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded m-4">
          {error}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            label="Total Items"
            value={entries.length}
            icon="📊"
          />
          <StatsCard
            label="High Risk"
            value={highRiskCount}
            icon="🔴"
            variant={highRiskCount > 0 ? 'danger' : 'default'}
          />
          <StatsCard
            label="Medium Risk"
            value={mediumRiskCount}
            icon="🟡"
            variant={mediumRiskCount > 0 ? 'warning' : 'default'}
          />
          <StatsCard
            label="Storage Used"
            value={`${entries.length} items`}
            icon="💾"
          />
        </div>

        {/* Filter Panel */}
        <FilterPanel />

        {/* Storage Viewer */}
        <StorageViewer entries={filteredEntries} />
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onConfirm={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
