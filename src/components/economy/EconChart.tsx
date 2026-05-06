import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

interface EconChartProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function EconChart({ title, subtitle, isLoading, error, children, actions }: EconChartProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div style={{ width: '100%', height: 280, position: 'relative' }}>
        {isLoading ? (
          <Skeleton lines={8} />
        ) : error ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Failed to load data
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
