import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

/**
 * Toggle component for switching between weekly (7-day) and monthly (30-day) time windows.
 * 
 * @param value - Current window type ('weekly' or 'monthly')
 * @param onChange - Callback when window type changes
 */
export function WindowToggle({
  value,
  onChange,
}: {
  value: 'weekly' | 'monthly';
  onChange: (v: 'weekly' | 'monthly') => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as 'weekly' | 'monthly')}
      className="inline-flex isolate rounded-lg ring-1 ring-inset ring-border bg-background"
    >
      {(['weekly', 'monthly'] as const).map((v) => (
        <ToggleGroupItem
          key={v}
          value={v}
          aria-label={v === 'weekly' ? '7-day window' : '30-day window'}
          className={cn(
            'h-7 px-3 text-xs font-medium focus-visible:outline-none',
            'ring-1 ring-inset ring-transparent first:rounded-l-lg last:rounded-r-lg',
            'data-[state=on]:bg-primary/10 data-[state=on]:border-primary/20 data-[state=on]:font-semibold',
            'hover:bg-muted/50'
          )}
        >
          {v === 'weekly' ? '7-day' : '30-day'}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
