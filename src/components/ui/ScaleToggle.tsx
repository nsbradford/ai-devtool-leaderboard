// Copyright 2025 Anysphere Inc.

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export function ScaleToggle({
  value,
  onChange,
}: {
  value: 'linear' | 'log';
  onChange: (v: 'linear' | 'log') => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as 'linear' | 'log')}
      className="inline-flex isolate rounded-lg ring-1 ring-inset ring-border bg-background"
    >
      {(['linear', 'log'] as const).map((v) => (
        <ToggleGroupItem
          key={v}
          value={v}
          aria-label={v === 'linear' ? 'Linear scale' : 'Logarithmic scale'}
          className={cn(
            'h-7 px-3 text-xs font-medium focus-visible:outline-none',
            'ring-1 ring-inset ring-transparent first:rounded-l-lg last:rounded-r-lg',
            'data-[state=on]:bg-primary/10 data-[state=on]:border-primary/20 data-[state=on]:font-semibold',
            'hover:bg-muted/50'
          )}
        >
          {v === 'linear' ? 'Linear' : 'Log'}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
