import React from "react";
import { statusLabel, statusClass } from "@/lib/kitchen";
import { cn } from "@/lib/utils";

export default function OrderStatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        statusClass(status),
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {statusLabel(status)}
    </span>
  );
}
