
import { useRef, useEffect } from "react";

export function useThrottle<T extends (...args: any[]) => void>(
  fn: T,
  limit = 80 // ~12fps default target for heavy calcs, or 16ms for 60fps interactions
) {
  const inThrottle = useRef(false);
  const lastRan = useRef<number>(0);
  const timer = useRef<number>();

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (!inThrottle.current) {
      fn(...args);
      lastRan.current = now;
      inThrottle.current = true;
      
      timer.current = window.setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  };
}
