/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate long strings
 */
export function truncateString(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Format date to readable format
 */
export function formatDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleString();
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(riskLevel: string): string {
  const colors: Record<string, string> = {
    low: 'bg-risk-low text-white',
    medium: 'bg-risk-medium text-white',
    high: 'bg-risk-high text-white',
  };
  return colors[riskLevel] || 'bg-gray-500 text-white';
}

/**
 * Get risk level icon emoji
 */
export function getRiskLevelEmoji(riskLevel: string): string {
  const emojis: Record<string, string> = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  };
  return emojis[riskLevel] || '❓';
}

/**
 * Get storage type color
 */
export function getStorageTypeColor(storageType: string): string {
  const colors: Record<string, string> = {
    cookie: 'bg-blue-500 text-white',
    localStorage: 'bg-purple-500 text-white',
    sessionStorage: 'bg-orange-500 text-white',
  };
  return colors[storageType] || 'bg-gray-500 text-white';
}
