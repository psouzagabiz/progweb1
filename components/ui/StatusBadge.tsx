import { STATUS_COLORS, STATUS_LABELS } from "@/lib/finance/constants";
import { cn } from "@/lib/utils/cn";

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-700 border-zinc-200"
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
