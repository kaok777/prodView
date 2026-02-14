import { useState, useEffect } from "react";

interface UseSidebarVisibilityOptions {
  breakpoint: number;
  storageKey?: string;
}

export function useSidebarVisibility({ breakpoint, storageKey }: UseSidebarVisibilityOptions) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Initialize collapse state based on screen size and storage
  useEffect(() => {
    const handleResize = () => {
      const shouldCollapse = window.innerWidth < breakpoint;
      setIsCollapsed(shouldCollapse);
    };

    // Check if this is first visit for this sidebar
    if (storageKey) {
      const hasVisited = localStorage.getItem(storageKey);
      if (!hasVisited) {
        setIsFirstVisit(true);
        localStorage.setItem(storageKey, 'true');
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint, storageKey]);

  return {
    isCollapsed,
    setIsCollapsed,
    isFirstVisit,
  };
}
