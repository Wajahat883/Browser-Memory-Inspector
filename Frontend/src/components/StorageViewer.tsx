import { Fragment, useState } from 'react';
import { Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { StorageEntry } from '../types';
import { useStorageStore } from '../store/storageStore';
import { storageReader } from '../services/storageReader';
import { truncateString, getRiskLevelColor, getRiskLevelEmoji, getStorageTypeColor, copyToClipboard } from '../utils/formatter';
import RiskIndicator from './RiskIndicator';

interface StorageViewerProps {
  entries: StorageEntry[];
  onDataChanged: () => void;
}

export default function StorageViewer({ entries, onDataChanged }: StorageViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hiddenValues, setHiddenValues] = useState<Set<string>>(new Set());

  const alerts = useStorageStore((state) => state.alerts);

  const handleDelete = (entry: StorageEntry) => {
    if (confirm(`Delete ${entry.key}?`)) {
      const isDeleted = storageReader.deleteEntry(entry);
      if (isDeleted) {
        onDataChanged();
      }
    }
  };

  const toggleValueVisibility = (entryId: string) => {
    const newHidden = new Set(hiddenValues);
    if (newHidden.has(entryId)) {
      newHidden.delete(entryId);
    } else {
      newHidden.add(entryId);
    }
    setHiddenValues(newHidden);
  };

  if (entries.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg">No storage entries found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700/50 border-b border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300 w-32">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Key</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Value</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300 w-24">Risk</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const alert = alerts.find((a) => a.entry.id === entry.id);
              const isExpanded = expandedId === entry.id;
              const isHidden = hiddenValues.has(entry.id);

              return (
                <Fragment key={entry.id}>
                  <tr
                    className="border-b border-gray-700 hover:bg-gray-700/30 transition cursor-pointer"
                    onClick={() =>
                      setExpandedId(
                        isExpanded ? null : entry.id
                      )
                    }
                  >
                    <td className="px-6 py-3">
                      <span
                        className={`${getStorageTypeColor(
                          entry.type
                        )} px-2 py-1 rounded text-xs font-semibold`}
                      >
                        {entry.type === 'cookie'
                          ? '🍪'
                          : entry.type ===
                            'localStorage'
                          ? '💾'
                          : '⏱️'}{' '}
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-sm text-gray-300">
                      {entry.key}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {isHidden ? (
                        <span className="text-gray-500 italic">
                          [Hidden]
                        </span>
                      ) : (
                        truncateString(entry.value, 50)
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {alert ? (
                        <RiskIndicator alert={alert} />
                      ) : (
                        <span className="text-gray-500 text-sm">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleValueVisibility(
                              entry.id
                            );
                          }}
                          className="text-gray-400 hover:text-blue-400 transition"
                          title={
                            isHidden
                              ? 'Show value'
                              : 'Hide value'
                          }
                        >
                          {isHidden ? (
                            <Eye size={18} />
                          ) : (
                            <EyeOff size={18} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(entry.value);
                          }}
                          className="text-gray-400 hover:text-green-400 transition"
                          title="Copy value"
                        >
                          <Copy size={18} />
                        </button>
                        {entry.type !==
                          'cookie' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry);
                            }}
                            className="text-gray-400 hover:text-red-400 transition"
                            title="Delete entry"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr className="bg-gray-700/50 border-b border-gray-700">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">
                              Full Value:
                            </h4>
                            <div className="bg-gray-900 p-3 rounded font-mono text-xs text-gray-300 break-all max-h-32 overflow-auto">
                              {isHidden ? (
                                <span className="text-gray-500 italic">
                                  [Hidden]
                                </span>
                              ) : (
                                entry.value
                              )}
                            </div>
                          </div>

                          {entry.metadata && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                Metadata:
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                                {Object.entries(
                                  entry.metadata
                                ).map(
                                  ([
                                    key,
                                    value,
                                  ]) => (
                                    <div
                                      key={key}
                                      className="flex justify-between"
                                    >
                                      <span className="font-medium">
                                        {key}:
                                      </span>
                                      <span>
                                        {String(value)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {alert && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                Security Details:
                              </h4>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-gray-400">
                                    Risk Level:{' '}
                                  </span>
                                  <span
                                    className={`${getRiskLevelColor(
                                      alert.riskLevel
                                    )} px-2 py-1 rounded`}
                                  >
                                    {getRiskLevelEmoji(
                                      alert.riskLevel
                                    )}{' '}
                                    {alert.riskLevel.toUpperCase()}
                                  </span>
                                </div>
                                {alert.reasons.length >
                                  0 && (
                                  <div>
                                    <span className="text-gray-400 block mb-1">
                                      Reasons:
                                    </span>
                                    <ul className="list-disc list-inside text-gray-400 space-y-1">
                                      {alert.reasons.map(
                                        (
                                          reason,
                                          i
                                        ) => (
                                          <li
                                            key={i}
                                          >
                                            {reason}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                                <div>
                                  <span className="text-gray-400 block mb-1">
                                    Recommendation:
                                  </span>
                                  <p className="text-gray-300">
                                    {alert.recommendation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
