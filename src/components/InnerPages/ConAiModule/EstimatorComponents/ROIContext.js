import React, { createContext, useContext, useState, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { INITIAL_FORM_DATA } from "./FormSection";
import { computeROI } from "./roiEngine";

const ROIContext = createContext(null);

export function ROIProvider() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const results = useMemo(() => computeROI(formData), [formData]);

  return (
    <ROIContext.Provider value={{ formData, setFormData, results }}>
      <Outlet />
    </ROIContext.Provider>
  );
}

export function useROI() {
  const ctx = useContext(ROIContext);
  if (!ctx) throw new Error("useROI must be used inside <ROIProvider>");
  return ctx;
}

// ← default export so lazy() works
export default ROIProvider;