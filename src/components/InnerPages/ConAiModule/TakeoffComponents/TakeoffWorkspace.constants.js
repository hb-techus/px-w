// ─── TakeoffWorkspace.constants.js ───────────────────────────────────────────
// All static lookup maps and constant arrays used across TakeoffWorkspace,
// WorkspaceAIDetectionModal, and TakeoffWorkspace.utils.
// Nothing here imports React or has any side-effects — safe to share freely.

import { ALL_CATEGORY_DATA_KEYS } from "./UtilsColor";

export const LINE_OBJECT_TYPES = new Set(["wall", "pipeline"]);

// ─── S3 key builders ──────────────────────────────────────────────────────────
export const getPageImageKey  = (doc, p) => `${doc.images_folder_path}/${doc.document_id}_page_${p}.png`;
export const getThumbImageKey = (doc, p) => `${doc.thumbnails_folder_path}/${doc.document_id}_thumbnail_${p}.png`;

// ─── API → internal data-key ─────────────────────────────────────────────────
export const API_TO_DATA_KEY = {
  ceiling:     "ceiling_data",
  door_window: "doors_data",
  drywall:     "drywall_data",
  electrical:  "electrical_data",
  flooring:    "floor_data",
  hvac:        "hvac_data",
  painting:    "paint_data",
  roofing:     "roofing_data",
  concrete:    "concrete_data",
  masonry:     "masonry_data",
  mechanical:  "mechanical_data",
  plumbing:    "plumbing_data",
  siding:      "siding_data",
  steel:       "steel_data",
  unknown:     "unknown_data",
};

// ─── data-key → sidebar group key ────────────────────────────────────────────
export const DATA_KEY_TO_GROUP = {
  drywall_data:   "drywall",
  paint_data:     "painting",
  doors_data:     "doors",
  floor_data:     "floor",
  ceiling_data:   "ceiling",
  hvac_data:      "hvac",
  roofing_data:   "roof",
  electrical_data:"electrical",
  concrete_data:  "concrete",
  masonry_data:   "masonry",
  mechanical_data:"mechanical",
  plumbing_data:  "plumbing",
  siding_data:    "siding",
  steel_data:     "steel",
  unknown_data:   "unknown",
};

// ─── All data keys (includes unknown_data even if not in UtilsColor list) ─────
export const ALL_DATA_KEYS = ALL_CATEGORY_DATA_KEYS.includes("unknown_data")
  ? ALL_CATEGORY_DATA_KEYS
  : [...ALL_CATEGORY_DATA_KEYS, "unknown_data"];

// ─── takeoff_name → sidebar group key ────────────────────────────────────────
export const TAKEOFF_NAME_TO_GROUP = {
  ceiling:     "ceiling",
  drywall:     "drywall",
  door_window: "doors",
  flooring:    "floor",
  electrical:  "electrical",
  hvac:        "hvac",
  painting:    "painting",
  roofing:     "roof",
  concrete:    "concrete",
  masonry:     "masonry",
  mechanical:  "mechanical",
  plumbing:    "plumbing",
  siding:      "siding",
  steel:       "steel",
  unknown:     "unknown",
};

// ─── group key → type field name ─────────────────────────────────────────────
export const TYPE_FIELD_MAP = {
  ceiling:   "ceiling_type",
  drywall:   "drywall_type",
  doors:     "door_window_type",
  floor:     "flooring_type",
  roof:      "roofing_type",
  hvac:      "hvac_type",
  electrical:"electrical_type",
  painting:  "painting_type",
  concrete:  "concrete_type",
  masonry:   "masonry_type",
  mechanical:"mechanical_type",
  plumbing:  "plumbing_type",
  siding:    "siding_type",
  steel:     "steel_type",
  unknown:   "unknown_type",
};

// ─── group key → data key ─────────────────────────────────────────────────────
export const GROUP_KEY_TO_DATA_KEY = {
  drywall:   "drywall_data",
  painting:  "paint_data",
  doors:     "doors_data",
  floor:     "floor_data",
  ceiling:   "ceiling_data",
  hvac:      "hvac_data",
  roof:      "roofing_data",
  electrical:"electrical_data",
  concrete:  "concrete_data",
  masonry:   "masonry_data",
  mechanical:"mechanical_data",
  plumbing:  "plumbing_data",
  siding:    "siding_data",
  steel:     "steel_data",
  unknown:   "unknown_data",
};

// ─── Eligible takeoffs (AI Detection modal) ───────────────────────────────────
export const ELIGIBLE_ALLOWED_KEYS = [
  "flooring", "ceiling", "paint", "drywall", "roofing", "concrete",
  "siding", "masonry", "doors_and_windows", "mechanical", "electrical",
  "plumbing", "hvac", "steel",
];

export const ELIGIBLE_API_TO_SYSTEM_KEY_MAP = {
  flooring:         "flooring",
  ceiling:          "ceiling",
  paint:            "paint",
  painting:         "paint",
  drywall:          "drywall",
  roofing:          "roofing",
  concrete:         "concrete",
  siding:           "siding",
  masonry:          "masonry",
  door_window:      "doors_and_windows",
  doors_and_windows:"doors_and_windows",
  mechanical:       "mechanical",
  electrical:       "electrical",
  plumbing:         "plumbing",
  hvac:             "hvac",
  steel:            "steel",
};

export const ELIGIBLE_LABEL_MAP = {
  flooring:          "Flooring",
  ceiling:           "Ceiling",
  paint:             "Painting",
  drywall:           "Drywall",
  roofing:           "Roofing",
  concrete:          "Concrete",
  siding:            "Siding",
  masonry:           "Masonry",
  doors_and_windows: "Doors & Windows",
  mechanical:        "Mechanical",
  electrical:        "Electrical",
  plumbing:          "Plumbing",
  hvac:              "HVAC",
  steel:             "Steel",
};

// ─── Empty takeoff data seed ──────────────────────────────────────────────────
export const EMPTY_TAKEOFF_DATA = Object.fromEntries(ALL_DATA_KEYS.map((k) => [k, []]));