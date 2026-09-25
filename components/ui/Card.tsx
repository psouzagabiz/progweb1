import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone?: "default" | "success" | "danger" | "warning" | "info";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-foreground",
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
    info: "text-info",
  };
  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-muted font-medium">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-muted" strokeWidth={1.6} />}
      </div>
      <p className={cn("text-xl sm:text-2xl font-semibold font-serif-heading", toneClasses[tone])}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
