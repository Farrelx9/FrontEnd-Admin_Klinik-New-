import { useEffect, useState } from "react";

// Delays updating the returned value until `delay` ms after the input
// stops changing — used so search-as-you-type doesn't fire a request
// on every keystroke.
export default function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
