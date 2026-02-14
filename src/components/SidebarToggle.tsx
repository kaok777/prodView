import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface SidebarToggleProps {
  isCollapsed: boolean;
  onClick: () => void;
  position: "left" | "right";
  label: string;
  showFirstVisitPulse?: boolean;
}

export function SidebarToggle({
  isCollapsed,
  onClick,
  position,
  label,
  showFirstVisitPulse = false,
}: SidebarToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const positionClasses = position === "left" ? "-right-3" : "-left-3";
  const Icon = position === "left"
    ? (isCollapsed ? ChevronRight : ChevronLeft)
    : (isCollapsed ? ChevronLeft : ChevronRight);

  return (
    <div className={`absolute ${positionClasses} top-4 z-50 group`}>
      {/* Edge Indicator - visible when collapsed */}
      {isCollapsed && (
        <div
          className={`absolute top-0 ${
            position === "left" ? "-left-1" : "-right-1"
          } w-1 h-12 bg-primary/30 rounded-full transition-all duration-300 group-hover:bg-primary/50 group-hover:h-16`}
          aria-hidden="true"
        />
      )}

      {/* Toggle Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`relative p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          showFirstVisitPulse ? "animate-pulse-subtle" : ""
        }`}
        aria-label={label}
        aria-expanded={Boolean(!isCollapsed)}
      >
        <Icon className="w-4 h-4" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            position === "left" ? "left-full ml-2" : "right-full mr-2"
          } px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md whitespace-nowrap pointer-events-none z-50 animate-in fade-in-0 zoom-in-95`}
          role="tooltip"
        >
          {label}
        </div>
      )}
    </div>
  );
}
