import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/** Consistent screen header: title + subtitle on the left, actions on the right. */
export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 print:hidden">
      <div>
        <h1 className="brand-heading text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 max-w-prose text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
