"use client";

import React from "react";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const safeTotal = Math.max(total, 1);
  const clamped = Math.min(Math.max(current, 0), safeTotal);
  const percent = Math.round((clamped / safeTotal) * 100);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold text-ink-muted">
        <span>{label ?? "İlerleme"}</span>
        <span>
          {clamped} / {safeTotal} ({percent}%)
        </span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-primary-soft"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-label={label ?? "İlerleme çubuğu"}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
