import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { GetRfpData } from "../../../../services/techus-services";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";

// ── Module-level cache — keyed by "project_uuid|section" to avoid cross-project pollution ──
const rfpCache = {};

export const useRfpData = (section) => {
  // Always read project_uuid from the URL so each tab is independent
  const { uuid: project_uuid } = useParams();

  const cacheKey = project_uuid ? `${project_uuid}|${section}` : null;
  const cached = cacheKey ? (rfpCache[cacheKey] ?? null) : null;

  const [data,          setData]          = useState(cached);
  const [loading,       setLoading]       = useState(!cached);   // false if already cached
  const [isInitialLoad, setIsInitialLoad] = useState(!cached);   // cleared after first fetch
  const [error,         setError]         = useState(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!project_uuid) return;

    // Already cached for this specific project — instant, no spinner needed
    if (cacheKey && rfpCache[cacheKey]) {
      setData(rfpCache[cacheKey]);
      setLoading(false);
      setIsInitialLoad(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const organization_uuid = localStorage.getItem("organization_uuid");

        const raw = await GetRfpData({ organization_uuid, project_uuid, section });

        const parsed = raw?.normalData
          ? (typeof raw.normalData === "string" ? JSON.parse(raw.normalData) : raw.normalData)
          : raw;

        if (!parsed?.valid) throw new Error(parsed?.message || "Invalid response");

        const result = parsed?.data;
        if (!result) throw new Error("No data in response");

        if (cacheKey) rfpCache[cacheKey] = result;

        if (mounted.current) {
          setData(result);
          setError(null);
          // Show success toast only on first fetch (not when served from cache)
          // showToast("success", parsed?.message || "RFP data loaded successfully");
        }

      } catch (err) {
        console.error(`[useRfpData] section="${section}" error:`, err);
        const msg = err.message || "Failed to load RFP data. Please try again.";

        // Mirror Projects: surface errors via toast
        showToast("error", msg);

        if (mounted.current) setError(msg);

      } finally {
        if (mounted.current) {
          setLoading(false);
          setIsInitialLoad(false); // same pattern as Projects' isInitialLoad guard
        }
      }
    };

    load();
  }, [section, project_uuid, cacheKey]);

  return { data, loading, isInitialLoad, error };
};

/** Call this when the user opens a different project to clear stale cache */
export const clearRfpCache = (project_uuid) => {
  if (project_uuid) {
    // Clear only the specific project's cache entries
    Object.keys(rfpCache).forEach(k => {
      if (k.startsWith(`${project_uuid}|`)) delete rfpCache[k];
    });
  } else {
    Object.keys(rfpCache).forEach(k => delete rfpCache[k]);
  }
};
