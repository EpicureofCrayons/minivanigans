import { cn } from "../../lib/cn";

/** Pill segmented control used for type/class/rarity choices and filters. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  labels,
  className,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Partial<Record<string, string>>;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-wrap rounded-card bg-surface-2 p-1", className)}>
      {options.map((opt) => (
        <button
          key={String(opt)}
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-[0.6rem] px-3 py-1.5 text-sm font-medium transition",
            value === opt
              ? "bg-surface text-fg shadow-[var(--shadow-soft)]"
              : "text-muted hover:text-fg"
          )}
        >
          {labels?.[String(opt)] ?? String(opt)}
        </button>
      ))}
    </div>
  );
}
