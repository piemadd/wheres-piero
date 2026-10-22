import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLatest, pb, positions } from '../lib/pocketbase';

const INITIAL = { data: null, record: null, error: null, loading: false, live: false };

export const useLocationData = (enabled) => {
  const [state, setState] = useState(INITIAL);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true }));
    try {
      const { record, data } = await fetchLatest();
      if (id !== requestId.current) return;
      setState((s) => ({ ...s, record, data, error: null, loading: false }));
    } catch (err) {
      if (id !== requestId.current) return;
      if (err.status === 401 || err.status === 403) pb.authStore.clear();
      setState((s) => ({ ...s, error: err.message || 'Failed to load location data', loading: false }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let unsubscribe = null;

    refresh();

    positions()
      .subscribe('*', () => refresh())
      .then((unsub) => {
        if (cancelled) unsub();
        else {
          unsubscribe = unsub;
          setState((s) => ({ ...s, live: true }));
        }
      })
      .catch(() => setState((s) => ({ ...s, live: false })));

    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      // Invalidate any in-flight request; this is a counter, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestId.current++;
      unsubscribe?.();
      document.removeEventListener('visibilitychange', onVisible);
      setState(INITIAL);
    };
  }, [enabled, refresh]);

  return { ...state, refresh };
};
