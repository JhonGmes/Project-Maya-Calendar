
import { useRef, useEffect } from "react";

export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay = 300
) {
  const timer = useRef<number | undefined>(undefined);

  // Limpar timer se o componente desmontar
  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
