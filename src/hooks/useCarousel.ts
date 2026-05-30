import { useState, useEffect, useCallback } from 'react';

/**
 * useCarousel Hook
 * Manages carousel state and navigation logic
 * Fixed: HIGH-F3 - Complex State Management in ProductDetailPage
 * Fixed: MEDIUM-F1 - Complex HeroCarousel Initialization
 */

export interface UseCarouselOptions {
  itemCount: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  loop?: boolean;
}

export interface UseCarouselReturn {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Custom hook for managing carousel state and navigation
 * @param options - Configuration options for the carousel
 * @returns Carousel state and navigation functions
 */
export function useCarousel({
  itemCount,
  autoplay = false,
  autoplayInterval = 5000,
  loop = true,
}: UseCarouselOptions): UseCarouselReturn {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Determine if we're at the boundaries
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === itemCount - 1;

  /**
   * Navigate to the next item
   */
  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev === itemCount - 1) {
        return loop ? 0 : prev;
      }
      return prev + 1;
    });
  }, [itemCount, loop]);

  /**
   * Navigate to the previous item
   */
  const prev = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return loop ? itemCount - 1 : prev;
      }
      return prev - 1;
    });
  }, [itemCount, loop]);

  /**
   * Navigate to a specific index
   */
  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < itemCount) {
        setCurrentIndex(index);
      }
    },
    [itemCount]
  );

  /**
   * Autoplay effect
   */
  useEffect(() => {
    if (!autoplay || itemCount <= 1) {
      return;
    }

    const interval = setInterval(() => {
      next();
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [autoplay, autoplayInterval, next, itemCount]);

  /**
   * Reset index if itemCount changes and current index is out of bounds
   */
  useEffect(() => {
    if (currentIndex >= itemCount && itemCount > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, itemCount]);

  return {
    currentIndex,
    setCurrentIndex,
    next,
    prev,
    goTo,
    isFirst,
    isLast,
  };
}
