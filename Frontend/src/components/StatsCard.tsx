interface StatsCardProps {
  label: string;
  value: number | string;
  icon: string;
  variant?: 'default' | 'danger' | 'warning';
}

export default function StatsCard({
  label,
  value,
  icon,
  variant = 'default',
}: StatsCardProps) {
  const bgClass =
    variant === 'danger'
      ? 'bg-red-900/20 border-red-700'
      : variant === 'warning'
      ? 'bg-yellow-900/20 border-yellow-700'
      : 'bg-gray-800/50 border-gray-700';

  return (
    <div className={`${bgClass} border rounded-lg p-6 text-center`}>
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
