import { useState, useEffect } from 'react';

/**
 * Debounce a value
 * @param {*} value - Value to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {*} Debounced value
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
