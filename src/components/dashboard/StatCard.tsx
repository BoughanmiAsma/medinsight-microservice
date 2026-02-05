import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'primary' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  primary: {
    card: 'stat-card-primary',
    icon: 'icon-primary',
  },
  success: {
    card: 'stat-card-success',
    icon: 'icon-success',
  },
  warning: {
    card: 'stat-card-warning',
    icon: 'icon-warning',
  },
  info: {
    card: 'stat-card-info',
    icon: 'icon-info',
  },
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'primary' 
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn(styles.card)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground font-display">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm",
              trend.value >= 0 ? "text-success" : "text-destructive"
            )}>
              <span className="font-medium">
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn(styles.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
