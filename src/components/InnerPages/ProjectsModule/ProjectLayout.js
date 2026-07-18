import React, { useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { GetProjectById } from "../../../services/techus-services";
import { setProjectData } from "../../../reduxtoolbox/actions/projectSlice";

export default function ProjectLayout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { uuid: projectUuid } = useParams();
  const projectFromState = location.state?.project ?? null;
  const previousStoredUuid = localStorage.getItem("project_uuid");

  useLayoutEffect(() => {
    if (!projectUuid) return;

    const storedName = localStorage.getItem(`project_name_${projectUuid}`);
    const canReuseSharedName = previousStoredUuid === projectUuid;
    const resolvedName =
      projectFromState?.project_name ||
      storedName ||
      (canReuseSharedName ? localStorage.getItem("current_project_name") : null) ||
      null;
    const resolvedId =
      projectFromState?.project_id != null
        ? String(projectFromState.project_id)
        : previousStoredUuid === projectUuid
          ? localStorage.getItem("project_id")
          : null;

    localStorage.setItem("project_uuid", projectUuid);
    localStorage.setItem("last_valid_project_uuid", projectUuid);

    if (resolvedId) {
      localStorage.setItem("project_id", resolvedId);
      localStorage.setItem("last_valid_project_id", resolvedId);
    } else if (previousStoredUuid !== projectUuid) {
      localStorage.removeItem("project_id");
    }

    if (resolvedName) {
      localStorage.setItem(`project_name_${projectUuid}`, resolvedName);
      localStorage.setItem("current_project_name", resolvedName);
      localStorage.setItem("last_valid_project_name", resolvedName);
    } else if (previousStoredUuid !== projectUuid) {
      localStorage.removeItem("current_project_name");
    }

    dispatch(
      setProjectData({
        project_uuid: projectUuid,
        project_id: resolvedId,
        project_name: resolvedName,
      }),
    );
  }, [
    dispatch,
    location.state,
    previousStoredUuid,
    projectFromState,
    projectUuid,
  ]);

  useEffect(() => {
    if (!projectUuid) return;

    const organizationUuid = localStorage.getItem("organization_uuid");
    const storedName = localStorage.getItem(`project_name_${projectUuid}`);
    const storedProjectId = localStorage.getItem("project_id");

    if (!organizationUuid || (storedName && storedProjectId)) return;

    let cancelled = false;

    const syncProjectDetails = async () => {
      try {
        const res = await GetProjectById({
          organization_uuid: organizationUuid,
          project_uuid: projectUuid,
        });

        let parsed = res?.data || res;
        if (typeof parsed === "string") parsed = JSON.parse(parsed);

        const project = parsed?.project || parsed?.data || null;
        if (!project || cancelled) return;

        const projectId =
          project.project_id != null ? String(project.project_id) : null;
        const projectName = project.project_name || null;

        localStorage.setItem("project_uuid", projectUuid);
        localStorage.setItem("last_valid_project_uuid", projectUuid);

        if (projectId) {
          localStorage.setItem("project_id", projectId);
          localStorage.setItem("last_valid_project_id", projectId);
        }

        if (projectName) {
          localStorage.setItem(`project_name_${projectUuid}`, projectName);
          localStorage.setItem("current_project_name", projectName);
          localStorage.setItem("last_valid_project_name", projectName);
        }

        if (project.status != null) {
          localStorage.setItem("project_status", String(project.status));
        }

        dispatch(
          setProjectData({
            project_uuid: projectUuid,
            project_id: projectId,
            project_name: projectName,
          }),
        );
      } catch {
        // Keep the route usable even if project metadata refresh fails.
      }
    };

    syncProjectDetails();

    return () => {
      cancelled = true;
    };
  }, [projectUuid, dispatch]);

  return <Outlet />;
}
