/**
 * Client-side utility functions and React hooks
 * 
 * This module provides client-side utilities for React components, including
 * hooks for debouncing values to optimize performance and reduce unnecessary renders.
 */

'use client';

import { useEffect, useState } from 'react';

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
