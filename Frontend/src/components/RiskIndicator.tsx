import { RiskAlert } from '../types';
import { getRiskLevelEmoji, getRiskLevelColor } from '../utils/formatter';

interface RiskIndicatorProps {
  alert: RiskAlert;
}

export default function RiskIndicator({ alert }: RiskIndicatorProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded font-medium text-xs ${getRiskLevelColor(
        alert.riskLevel
      )}`}
      title={alert.reasons[0]}
    >
      <span>{getRiskLevelEmoji(alert.riskLevel)}</span>
      <span>{alert.riskLevel.toUpperCase()}</span>
    </div>
  );
}
