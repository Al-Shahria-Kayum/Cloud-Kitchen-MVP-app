import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({ value = 0, onChange, size = 20, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(star)}
          className={cn("transition-transform", !readOnly && "hover:scale-110")}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              star <= display ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function AverageStars({ value = 0, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            style={{ width: size, height: size }}
            className={s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40"}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {value ? value.toFixed(1) : "New"}
        {count != null ? ` · ${count} ${count === 1 ? "review" : "reviews"}` : ""}
      </span>
    </div>
  );
}
