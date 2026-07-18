import React, { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { GetProjectById } from "../services/techus-services";
import FullPageLoader from "../genriccomponents/loaders/FullPageLoader";
import { useSelector, useDispatch } from "react-redux";
import { setProjectData } from "../reduxtoolbox/actions/projectSlice";

// Status values the API returns for a "completed / analysis done" project
const ALLOWED_STATUSES = new Set([
  "2",
  "completed",
  "analysis completed",
  "analysis_completed",
]);



const isCompleted = (status) =>
  ALLOWED_STATUSES.has(String(status ?? "").toLowerCase());

/**
 * Wraps every rfp-analyzer / takeoff / estimator child route.
 *
 * Flow:
 *  1. Read UUID from URL params.
 *  2. Try fast-path: if localStorage already has the same project_uuid
 *     and project_status, skip the API call.
 *  3. Otherwise fetch the project and check status.
 *  4. Redirect to /projects with a toast-friendly state if not completed.
 */
export default function ProjectRouteGuard({ children }) {
  const { uuid } = useParams(); // from  project-view/:uuid
  const org_uuid = useSelector((s) => s.tokens.organization_uuid);
  const dispatch  = useDispatch();

  const [state, setState] = useState("checking"); // "checking" | "allowed" | "denied"

  useEffect(() => {
    const storedUuid   = localStorage.getItem("project_uuid");
    const storedStatus = localStorage.getItem("project_status");
    // Try both new per-UUID key and old shared key (backwards compat)
    const storedName   = localStorage.getItem(`project_name_${uuid}`)
                      || localStorage.getItem("current_project_name")
                      || "";

    // Fast path: status is known AND we already have the name → no API call needed
    if (storedUuid === uuid && storedStatus !== null && storedName) {
      dispatch(setProjectData({
        project_uuid: uuid,
        project_name: storedName,
        project_id:   localStorage.getItem("project_id"),
      }));
      // Persist under the new per-UUID key so old key isn't relied on forever
      localStorage.setItem(`project_name_${uuid}`, storedName);
      setState(isCompleted(storedStatus) ? "allowed" : "denied");
      return;
    }

    // Slow path: either different project (cross-tab) or name missing — fetch from API
    const check = async () => {
      try {
        const res = await GetProjectById({ organization_uuid: org_uuid, project_uuid: uuid });
        let d = res?.data || res;
        if (typeof d === "string") d = JSON.parse(d);

        const project = d?.project || d?.data;
        if (!project) { setState("denied"); return; }

        const name = project.project_name || "";

        // Persist for future fast-path hits (per-UUID key, tab-safe)
        localStorage.setItem("project_uuid",          uuid);
        localStorage.setItem("project_status",        String(project.status ?? ""));
        localStorage.setItem(`project_name_${uuid}`,  name);

        // Push into Redux → NavBar re-renders with correct name immediately
        dispatch(setProjectData({
          project_uuid: uuid,
          project_name: name,
          project_id:   project.project_id || localStorage.getItem("project_id"),
        }));

        setState(isCompleted(project.status) ? "allowed" : "denied");
      } catch {
        setState("denied");
      }
    };

    check();
  }, [uuid, org_uuid, dispatch]);

  if (state === "checking") return <FullPageLoader />;

  if (state === "denied") {
    return (
      <Navigate
        to="/projects"
        replace
        state={{ guardDenied: true, reason: "Project analysis is not yet completed." }}
      />
    );
  }

  return <>{children}</>;
}