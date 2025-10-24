'use client';

import { useEffect, useState } from 'react';

/**
 * Custom React hook that debounces a value by delaying updates until after a specified delay period.
 * Useful for reducing the frequency of expensive operations like API calls or search queries.
 * 
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds before updating the debounced value
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
