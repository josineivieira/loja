import { useCallback, useState } from "react";

export function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (callback: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await callback();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, run };
}

