import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "draft" | "submitted" | "to_modify" | "validated" | "rejected" | "scheduled" | "completed" | "cancelled";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: "Brouillon",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    submitted: {
      label: "Soumis",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    to_modify: {
      label: "À modifier",
      className: "bg-orange-100 text-orange-800 border-orange-200",
    },
    validated: {
      label: "Validé",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    rejected: {
      label: "Rejeté",
      className: "bg-red-100 text-red-800 border-red-200",
    },
    scheduled: {
      label: "Planifiée",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    completed: {
      label: "Terminée",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    cancelled: {
      label: "Annulée",
      className: "bg-gray-100 text-gray-800 border-gray-200",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn("font-medium text-xs", config.className, className)}
      data-testid={`status-badge-${status}`}
    >
      {config.label}
    </Badge>
  );
}
