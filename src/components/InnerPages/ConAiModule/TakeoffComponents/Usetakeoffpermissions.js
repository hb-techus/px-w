import { useSelector } from 'react-redux';
import { resolvePackageEnabled } from '../../../Common/usePermissions';
/**
 * useTakeoffPermissions
 *
 * Reads Redux store and returns granular plan_studio permission flags
 * used by TakeoffToolbar, Canvas, and TakeoffSidebar.
 *
 * Package hierarchy (from package_info):
 *   takeoff_engine
 *     └─ plan_studio
 *          ├─ ps_drawing     ← select/pan tools visibility
 *          ├─ ps_detection   ← AI Detection button
 *          ├─ ps_extraction  ← AI Extraction button
 *          ├─ ps_proceed     ← Proceed to Estimate button
 *          └─ ps_manual
 *               ├─ mt_annotation  ← draw shapes on canvas
 *               └─ mt_trade       ← add trade categories / line items
 *
 * Permission keys (from permission_info.plan_studio):
 *   drawing_tools_access, ai_detection, ai_extraction, proceed_to_estimation, view
 *
 * Returned flags follow the rule:
 *   PACKAGE check first → if explicitly false: block
 *   PERMISSION check second → if explicitly false: block
 *   Otherwise: allow (handles loading state / missing config)
 */
export function useTakeoffPermissions() {
  const packageList     = useSelector((s) => s?.auth?.user?.[0]?.package_info);
  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info);

  const psPerm         = permissionsList?.takeoff_dashboard   || {};
  // annotation permission_info provides per-action flags:
  //   { view: true, edit: true, delete: false }
  const annotationPerm = permissionsList?.annotation   || {};

  // ── 1. Parent plan_studio package gate ────────────────────────────────────
  const psEnabled = resolvePackageEnabled(packageList, 'plan_studio');

  // If the parent module is completely off, everything is off
  if (psEnabled === false) {
    return {
      planStudio: {
        enabled:            false,
        drawingToolsAccess: false,
        tradeAccess:        false,
        detectionAccess:    false,
        extractionAccess:   false,
        proceedAccess:      false,
      },
      annotation: {
        canView:   false,
        canEdit:   false,
        canDelete: false,
      },
    };
  }

  // ── 2. mt_annotation package ─────────────────────────────────────────────
  const mtAnnotationPkg = resolvePackageEnabled(packageList, 'mt_annotation');
  const mtAnnotationOn  = mtAnnotationPkg !== false;

  return {
    planStudio: {
      enabled: true,

      // ── Toolbar: show detection-tools group icon ───────────────────────────
      // Gate: mt_annotation package ON  +  annotation.view permission not false
      // Both must pass → icon visible. Either false → icon hidden.
      drawingToolsAccess:
        mtAnnotationOn &&
        annotationPerm.view !== false,

      // ── Sidebar: show + Add Trade button ──────────────────────────────────
      // Gate: mt_trade package only (no dedicated permission key)
      tradeAccess:
        resolvePackageEnabled(packageList, 'mt_trade') !== false,

      // ── Navbar: AI Detection button ────────────────────────────────────────
      detectionAccess:
        resolvePackageEnabled(packageList, 'ps_detection') !== false &&
        psPerm.ai_detection !== false,

      // ── Navbar: AI Extraction button ───────────────────────────────────────
      extractionAccess:
        resolvePackageEnabled(packageList, 'ps_extraction') !== false &&
        psPerm.ai_extraction !== false,

      // ── Navbar: Proceed to Estimate button ─────────────────────────────────
      proceedAccess:
        resolvePackageEnabled(packageList, 'ps_proceed') !== false &&
        psPerm.proceed_to_estimation !== false,
    },

    // ── Annotation — used ONLY for the canvas delete button ───────────────────
    // Sidebar edit/delete icons have no related package or permission,
    // so they are always visible (not controlled here).
    //
    // canDelete: annotation.delete permission → hides canvas floating delete btn
    annotation: {
      canDelete:
        annotationPerm.delete !== false,
    },
  };
}
