import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  value: number | string;
  label: string;
  icon?: LucideIcon;
  trend?: "up" | "down";
  trendValue?: string;
  className?: string;
}

export function StatsCard({
  value,
  label,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "p-4 md:p-4 lg:p-4 xl:p-6 hover:shadow-md transition-all duration-200 hover:scale-105 overflow-hidden",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-600 dark:text-muted-foreground mb-1 break-words">{label}</p>
          <p className="text-xl md:text-2xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-foreground break-words">{value}</p>
          {trend && trendValue && (
            <p
              className={cn(
                "text-xs mt-2",
                trend === "up" ? "text-green-600" : "text-red-600"
              )}
            >
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 md:p-3 lg:p-3 xl:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
            <Icon className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6 xl:h-6 xl:w-6 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>
    </Card>
  );
}

