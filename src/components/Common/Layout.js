import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideBar from "./SideBar";
import Navbar from "./NavBar";
import { EstimationProvider } from "../context/EstimationContext";

const Layout = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTakeoffFullscreen, setIsTakeoffFullscreen] = useState(false);
  const location = useLocation();
  const isRestricted = location.pathname.includes("restricted");
  const toggleSidebar = () => setIsExpanded(!isExpanded);
  const isProposalDrafting = location.pathname === "/knowledge-base";
  const mainRef = useRef(null);
  // ── Fullscreen enter/exit events from TakeoffNavbar ──────────────────────
  useEffect(() => {
    const enter = () => setIsTakeoffFullscreen(true);
    const exit = () => setIsTakeoffFullscreen(false);
    window.addEventListener("takeoff-fullscreen-enter", enter);
    window.addEventListener("takeoff-fullscreen-exit", exit);
    return () => {
      window.removeEventListener("takeoff-fullscreen-enter", enter);
      window.removeEventListener("takeoff-fullscreen-exit", exit);
    };
  }, []);

  useLayoutEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]); // fires whenever the route changes


  // ── Auto-exit fullscreen when navigating away from plan-studio ───────────
  // e.g. "Proceed to Estimate" navigates to estimate-builder — restore layout
  useEffect(() => {
    const isPlanStudio = location.pathname.includes("plan-studio");
    if (!isPlanStudio && isTakeoffFullscreen) {
      setIsTakeoffFullscreen(false);
      // Also fire the exit event so TakeoffNavbar resets its own isFullscreen state
      window.dispatchEvent(new Event("takeoff-fullscreen-exit"));
    }
  }, [location.pathname]); // intentionally omit isTakeoffFullscreen to avoid loop

  // Only apply fullscreen layout when actually on plan-studio
  const isPlanStudio = location.pathname.includes("plan-studio");
  const isFullscreen = isTakeoffFullscreen && isPlanStudio;

  return (
    <EstimationProvider>
      <div className="tw-flex tw-h-screen tw-bg-[#f5f7fa] tw-overflow-hidden">
        {/* Sidebar — hidden only when on plan-studio in fullscreen */}
        <div
          className="layout-sidebar"
          // style={{ display: isFullscreen || isRestricted ? "none" : undefined }}
          style={{ display: isFullscreen ? "none" : undefined }}

        >
          <SideBar isExpanded={isExpanded} onMenuToggle={toggleSidebar} />
        </div>

        {/* Content wrap */}
        <div
          className={`layout-content-wrap tw-flex tw-flex-col tw-transition-all tw-duration-300 tw-ease-in-out ${
            // isFullscreen
            //   ? "tw-ml-0 tw-w-full"
            //   : isExpanded
            //   ? "tw-ml-[220px] tw-w-[calc(100%-225px)]"
            //   : "tw-ml-[60px] tw-w-[calc(100%-60px)]"
            isFullscreen
              ? "tw-ml-0 tw-w-full"
              : isExpanded
                ? "tw-ml-[220px] tw-w-[calc(100%-225px)]"
                : "tw-ml-[60px] tw-w-[calc(100%-60px)]"
            }`}
        >
          {/* Top navbar — hidden only when on plan-studio in fullscreen */}
          <div
            className="layout-topnav"
            // style={{ display: isFullscreen ? "none" : undefined }}
            style={{ display: (isFullscreen) ? "none" : undefined }}
          >
            <Navbar isExpanded={isExpanded} onMenuToggle={toggleSidebar} />
          </div>

          <main
            ref={mainRef}
            className={`tw-flex-1 ${isRestricted ? "tw-overflow-hidden" : "tw-overflow-y-auto"
              } ${isFullscreen ? "" : "tw-mt-[60px]"
              } ${isRestricted ? "" : isProposalDrafting ? "" : "tw-px-8 tw-py-4"}`}
          >
            <Outlet context={{ isExpanded }} />
          </main>
        </div>
      </div>
    </EstimationProvider>
  );
};

export default Layout;
