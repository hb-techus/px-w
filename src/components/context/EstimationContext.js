import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getDeviceInfo } from "../../utils/getDeviceInfo";
import { fetchEstimationOverview } from "../../services/techus-services";

const EstimationContext = createContext(null);

const cleanPath = (p) => p.replace(/^#/, "");
const uuidFromPath = (p) =>
    cleanPath(p).match(/\/project\/view\/([^/]+)/)?.[1] ?? null;

export const EstimationProvider = ({ children }) => {
    const location = useLocation();
    const pathname = location.pathname;
    const activeUuid = uuidFromPath(pathname);

    // Track which project we last fetched for to avoid duplicate in-flight calls
    const fetchingRef = useRef(null);
    // Track the uuid we last successfully fetched so we re-fetch on project change
    const lastFetchedUuid = useRef(null);

    const [projectUuid, setProjectUuid] = useState(activeUuid);
    const [takeoffUnlocked, setTakeoffUnlocked] = useState(false);
    const [estimationUnlocked, setEstimationUnlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMarkAsCompleted, setIsMarkAsCompleted] = useState(false);
    const [estimationOverview, setEstimationOverview] = useState(null);

    // ── Fetch unlock status from API — called every time we enter a project ────
    const fetchUnlockStatus = async (uuid) => {
        if (!uuid) return;
        // Prevent duplicate concurrent calls for the same uuid
        if (fetchingRef.current === uuid) return;
        fetchingRef.current = uuid;

        setIsLoading(true);
        try {
            const org = localStorage.getItem("organization_uuid") || "";

            const res = await fetchEstimationOverview({
                organization_uuid: org,
                project_uuid: uuid,
                device_info: getDeviceInfo(),
            });
            const parsed =
                res?.valid !== undefined ? res :
                    res?.data?.valid !== undefined ? res.data : null;

            let estimation = false;

            if (parsed?.valid && parsed?.data) {
                const data = parsed.data;
                estimation = data.direct_cost > 0 || data.material_cost > 0;
                setIsMarkAsCompleted(data.mark_as_complete === 1);
                setEstimationOverview({
                    material_cost: data.material_cost ?? 0,
                    direct_cost: data.direct_cost ?? 0,
                });
            } else {
                setEstimationOverview(null);
            }
            setEstimationUnlocked(estimation);
            lastFetchedUuid.current = uuid;
        } catch (err) {
            console.error("[EstimationContext] fetchUnlockStatus error:", err);
            setTakeoffUnlocked(false);
            setEstimationUnlocked(false);
            setIsMarkAsCompleted(false);
        } finally {
            setIsLoading(false);
            fetchingRef.current = null;
        }
    };

    // ── Re-fetch whenever the project uuid changes ────────────────────────────
    useEffect(() => {
        const newUuid = uuidFromPath(pathname);

        if (!newUuid) {
            // Left project context — reset
            setProjectUuid(null);
            setTakeoffUnlocked(false);
            setEstimationUnlocked(false);
            setEstimationOverview(null);
            lastFetchedUuid.current = null;
            fetchingRef.current = null;
            return;
        }

        if (newUuid !== projectUuid) {
            // Project switched — reset state immediately, then fetch fresh
            setProjectUuid(newUuid);
            setTakeoffUnlocked(false);
            setEstimationUnlocked(false);
            setEstimationOverview(null);
            lastFetchedUuid.current = null;
            fetchingRef.current = null;
        }

        // Always fetch when entering / switching projects.
        // Guard: skip only if we already have an in-flight request for this uuid.
        if (fetchingRef.current !== newUuid) {
            fetchUnlockStatus(newUuid);
        }
    }, [pathname]);

    // ── Called from TakeoffWorkspace after "Proceed to Estimate" succeeds ─────
    const unlockEstimation = () => {
        if (!activeUuid) return;
        setEstimationUnlocked(true);
        fetchingRef.current = null; // allow a fresh call
        fetchUnlockStatus(activeUuid);
    };

    // ── Called when a plan document is selected ───────────────────────────────
    const unlockTakeoff = () => {
        setTakeoffUnlocked(true);
    };

    // ── Force refresh (e.g. after returning from estimate builder) ────────────
    const refreshUnlockStatus = () => {
        if (!activeUuid) return;
        fetchingRef.current = null;
        fetchUnlockStatus(activeUuid);
    };

    return (
        <EstimationContext.Provider value={{
            estimationUnlocked,
            takeoffUnlocked,
            isLoading,
            isMarkAsCompleted,
            estimationOverview,
            unlockEstimation,
            unlockTakeoff,
            refreshUnlockStatus,
        }}>
            {children}
        </EstimationContext.Provider>
    );
};

export const useEstimation = () => {
    const ctx = useContext(EstimationContext);
    if (!ctx) throw new Error("useEstimation must be used inside EstimationProvider");
    return ctx;
};
