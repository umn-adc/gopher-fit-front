import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api, errorMessage, PAGE_SIZE, pagePath } from "./api";

// A shared submit lock closes the gap before React renders the disabled button.
export function useTask() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function run(work: () => Promise<void>, success = "Saved.") {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await work();
      if (mounted.current) setMessage(success);
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return { saving, error, message, run, setError, setMessage };
}

// Used only for the repeated array + offset + Load more API collections.
export function usePagedList<T>(path: string | null) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const offset = useRef(0);
  const active = useRef<AbortController | null>(null);
  const load = useCallback(
    async (append = false) => {
      if (!path || (append && active.current)) return;
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      setLoading(true);
      setError("");
      if (!append) {
        offset.current = 0;
        setItems([]);
        setLoaded(false);
      }
      try {
        const page = await api.request<T[]>(pagePath(path, offset.current), {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setItems((previous) => (append ? [...previous, ...page] : page));
        offset.current += page.length;
        setMore(page.length === PAGE_SIZE);
        setLoaded(true);
      } catch (e) {
        if (!controller.signal.aborted) setError(errorMessage(e));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          active.current = null;
        }
      }
    },
    [path],
  );
  useFocusEffect(
    useCallback(() => {
      if (path) void load();
      else {
        setItems([]);
        setLoaded(false);
        setError("");
        setMore(false);
      }
      return () => {
        active.current?.abort();
        active.current = null;
      };
    }, [load, path]),
  );
  return {
    items,
    loading,
    loaded,
    error,
    more,
    reload: () => load(),
    loadMore: () => load(true),
  };
}
