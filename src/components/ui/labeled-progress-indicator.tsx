'use client';

import { useState, useEffect, type FC } from 'react';
import { cn } from '@/lib/utils';

export interface LabeledProgressIndicatorProps {
  labels: string[];
  progress?: string;
  intervalMs?: number;
  showThemeToggle?: boolean;
}

export const LabeledProgressIndicator: FC<LabeledProgressIndicatorProps> = ({
  labels,
  progress = '55%',
  intervalMs = 2000,
}) => {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    if (labels.length <= 1) return;
    const interval = setInterval(() => {
      setLabelIndex((prev) => (prev + 1) % labels.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [labels.length, intervalMs]);

  const displayLabel = labels[labelIndex] ?? labels[0];

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-center">
        <span
          key={labelIndex}
          className={cn(
            'text-3xl font-bold text-[#B5B5B5] transition-opacity duration-300 dark:text-zinc-400',
          )}
        >
          {displayLabel}
        </span>
      </div>

      <div className="h-4 w-[320px] overflow-hidden rounded-full border border-black/5 bg-[#F0F0F0] shadow-inner dark:border-white/5 dark:bg-zinc-900">
        <div
          className="relative h-full overflow-hidden rounded-full bg-[#016FFE] transition-[width] duration-700 ease-out dark:bg-blue-600"
          style={{ width: progress }}
        />
      </div>
    </div>
  );
};
