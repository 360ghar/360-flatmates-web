import { Link } from "react-router";
import { cn, focusRing } from "./component-utils";

export interface Crumb {
  label: string;
  to?: string;
}

/** Where this page sits. The last crumb is the current page and is not a link. */
export function Breadcrumbs({ items, className }: { items: ReadonlyArray<Crumb>; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 text-body-md text-ink-3">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.to ? (
              <Link to={item.to} className={cn("inline-flex min-h-11 items-center rounded-cut-sm text-ink-2 hover:text-clay", focusRing)}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
