import { useEffect, useState } from 'react';

// Re-renders on an interval so relative timestamps stay current.
export const useNow = (intervalMs = 30000) => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};
