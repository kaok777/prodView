import { Link } from "react-router-dom";

interface FilterTagProps {
  label: string;
  filterType: "category" | "useCase";
  filterId: string;
  icon?: React.ReactNode;
}

export function FilterTag({ label, filterType, filterId, icon }: FilterTagProps) {
  const queryParam = filterType === "category" ? "category" : "useCase";
  const to = `/products?${queryParam}=${filterId}`;
  const ariaLabel = `Filter products by ${filterType === "category" ? "category" : "use case"}: ${label}`;

  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-accent text-accent-foreground rounded-full border border-border hover:bg-accent/80 hover:border-primary/50 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={ariaLabel}
    >
      {icon && icon}
      <span>{label}</span>
    </Link>
  );
}
