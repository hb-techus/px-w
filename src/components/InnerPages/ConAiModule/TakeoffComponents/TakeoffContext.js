// import React, { createContext, useContext, useState, useEffect, useRef } from "react";
// import { Outlet, useLocation } from "react-router-dom";

// const TakeoffContext = createContext(null);

// const cleanPath = (pathname) => pathname.replace(/^#/, "");

// const uuidFromPath = (pathname) =>
//   cleanPath(pathname).match(/\/project\/view\/([^/]+)/)?.[1] ?? null;

// export function TakeoffProvider({ children }) {
//   const location = useLocation();
//   const activeUuid = uuidFromPath(location.pathname);
//   const activeUuidRef = useRef(activeUuid);
//   useEffect(() => { activeUuidRef.current = activeUuid; }, [activeUuid]);

//   const [projectUuid, setProjectUuid] = useState(activeUuid);
//   const [selectedDoc, setSelectedDoc] = useState(null);

//   // Reset selected doc when navigating to a different project
//   useEffect(() => {
//     const newUuid = uuidFromPath(location.pathname);
//     if (!newUuid || newUuid === projectUuid) return;
//     setProjectUuid(newUuid);
//     setSelectedDoc(null);
//   }, [location.pathname, projectUuid]);

//   const updateSelectedDoc = (doc) => {
//     setSelectedDoc(doc || null);
//   };

//   // Page helpers — no-ops since we no longer persist page state
//   const getLastPage = () => null;
//   const setLastPage = () => {};
//   const clearLastPage = () => {};

//   return (
//     <TakeoffContext.Provider value={{
//       selectedDoc,
//       setSelectedDoc: updateSelectedDoc,
//       getLastPage,
//       setLastPage,
//       clearLastPage,
//     }}>
//       {children ?? <Outlet />}
//     </TakeoffContext.Provider>
//   );
// }

// export const useTakeoff = () => {
//   const ctx = useContext(TakeoffContext);
//   if (ctx === null) throw new Error("useTakeoff must be used within a TakeoffProvider");
//   return ctx;
// };

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

const TakeoffContext = createContext(null);

const cleanPath = (pathname) => pathname.replace(/^#/, "");

const uuidFromPath = (pathname) =>
  cleanPath(pathname).match(/\/project\/view\/([^/]+)/)?.[1] ?? null;

export function TakeoffProvider({ children }) {
  const location = useLocation();
  const activeUuid = uuidFromPath(location.pathname);
  const activeUuidRef = useRef(activeUuid);
  useEffect(() => { activeUuidRef.current = activeUuid; }, [activeUuid]);

  const [projectUuid, setProjectUuid] = useState(activeUuid);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Reset selected doc when navigating to a different project
  useEffect(() => {
    const newUuid = uuidFromPath(location.pathname);
    if (!newUuid || newUuid === projectUuid) return;
    setProjectUuid(newUuid);
    setSelectedDoc(null);
  }, [location.pathname, projectUuid]);

  const updateSelectedDoc = (doc) => {
    setSelectedDoc(doc || null);
  };

  // ── Page persistence — sessionStorage only for page index (pure UI state) ──
  // Document identity is always API-driven; page number is safe to persist locally.
  const pageKey = (documentId) => `takeoff_page_${documentId}`;

  const getLastPage = (documentId) => {
    if (!documentId) return null;
    try {
      const saved = sessionStorage.getItem(pageKey(documentId));
      if (saved === null) return null;
      const n = parseInt(saved, 10);
      return isNaN(n) ? null : n;
    } catch { return null; }
  };

  const setLastPage = (documentId, pageIndex) => {
    if (!documentId) return;
    try {
      sessionStorage.setItem(pageKey(documentId), String(pageIndex));
    } catch { return null; }
  };

  const clearLastPage = (documentId) => {
    if (!documentId) return;
    try {
      sessionStorage.removeItem(pageKey(documentId));
    } catch { return null; }
  };

  return (
    <TakeoffContext.Provider value={{
      selectedDoc,
      setSelectedDoc: updateSelectedDoc,
      getLastPage,
      setLastPage,
      clearLastPage,
    }}>
      {children ?? <Outlet />}
    </TakeoffContext.Provider>
  );
}

export const useTakeoff = () => {
  const ctx = useContext(TakeoffContext);
  if (ctx === null) throw new Error("useTakeoff must be used within a TakeoffProvider");
  return ctx;
};