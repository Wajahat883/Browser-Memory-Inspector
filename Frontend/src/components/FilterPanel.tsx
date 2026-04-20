import { Search, Filter } from 'lucide-react';
import { useStorageStore } from '../store/storageStore';

export default function FilterPanel() {
  const filters = useStorageStore((state) => state.filters);
  const setFilters = useStorageStore((state) => state.setFilters);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={20} />
        <h2 className="text-xl font-semibold">Filters</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search keys or values..."
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters({ searchQuery: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Storage Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Storage Type
          </label>
          <select
            value={filters.storageType}
            onChange={(e) =>
              setFilters({
                storageType: e.target.value as any,
              })
            }
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Storage</option>
            <option value="cookie">Cookies</option>
            <option value="localStorage">Local Storage</option>
            <option value="sessionStorage">Session Storage</option>
          </select>
        </div>

        {/* Risk Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Risk Level
          </label>
          <select
            value={filters.riskLevel}
            onChange={(e) =>
              setFilters({
                riskLevel: e.target.value as any,
              })
            }
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>

        {/* Sensitive Only */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filter
          </label>
          <button
            onClick={() =>
              setFilters({
                showSensitiveOnly: !filters.showSensitiveOnly,
              })
            }
            className={`w-full px-4 py-2 rounded transition font-medium ${
              filters.showSensitiveOnly
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
            }`}
          >
            {filters.showSensitiveOnly
              ? '🔴 Sensitive Only'
              : '⚪ Show All'}
          </button>
        </div>
      </div>
    </div>
  );
}
