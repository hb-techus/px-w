import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { ChevronDown, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Dropdown from "../../Common/DropDown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  AddPackage,
  GetPackageFeatures,
  UpdatePackage,
  ViewPackage,
} from "../../../services/techus-services";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import { capitalizeFirstLetter } from "../../../utils/commonUtils";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import DeleteModal from "../../../genriccomponents/DeleteModal";
import { useSelector } from "react-redux";


// ─── Feature coupling via feature_key ─────────────────────────────────────────
// Format: { dependant_feature_key: [prerequisite_feature_key, ...] }
const FEATURE_DEPENDENCIES_BY_KEY = {
  "ps_detection": ["ps_extraction"], // AI Detection requires AI Extraction
};

// ─── Indeterminate Checkbox ────────────────────────────────────────────────────
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  onClick,
  className,
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={onClick}
      className={className}
    />
  );
}

// ─── Helper: derive node type from API fields ──────────────────────────────────
// Rules:
//   has children                          → "group"
//   no children, display_text_2 set       → "toggle_or_count"
//   no children, is_included_text === 1   → "leaf"  (show "Included" badge)
//   no children, display_text_1 only      → "leaf"  (plain checkbox, no badge — treated same)
function deriveNodeType(node) {
  if (node.children && node.children.length > 0) return "group";
  if (node.display_text_2) return "toggle_or_count";
  return "leaf";
}

// ─── Helper: collect all leaf/toggle node IDs in a subtree ────────────────────
function collectAllIds(node) {
  if (!node.children || node.children.length === 0) return [node.id];
  return node.children.flatMap(collectAllIds);
}

// ─── Helper: collect all node IDs (including group nodes) ─────────────────────
function collectAllNodeIds(node) {
  const ids = [node.id];
  if (node.children)
    node.children.forEach((c) => ids.push(...collectAllNodeIds(c)));
  return ids;
}
function buildParentMap(nodes, map = {}) {
  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        map[child.id] = node.id; // child → parent
        buildParentMap(node.children, map);
      });
    }
  });
  return map;
}
// ─── FeatureNode: renders a single node recursively ───────────────────────────
function FeatureNode({
  node,
  depth,
  checked,
  setChecked,
  options,
  setOptions,
  expanded,
  setExpanded,
  featureKeyMap
}) {
  const nodeType = deriveNodeType(node);
  const isGroup = nodeType === "group";
  const isToggleOrCount = nodeType === "toggle_or_count";
  const isLeaf = nodeType === "leaf";
  // Add these states

  const isChecked = !!checked[node.id];
  const isExpanded = !!expanded[node.id];


  // For groups: compute indeterminate state from leaf descendants
  const leafIds = useMemo(() => collectAllIds(node), [node]);
  const checkedLeafCount = leafIds.filter((id) => checked[id]).length;
  const allLeafChecked = checkedLeafCount === leafIds.length;
  const someLeafChecked = checkedLeafCount > 0 && !allLeafChecked;

  const opt = options[node.id] || { mode: "full", count: "" };

  // Toggle a single node (leaf or toggle_or_count)
  const handleToggle = useCallback(
    (e) => {
      e.stopPropagation();
      const newVal = !isChecked;

      setChecked((prev) => {
        const next = { ...prev, [node.id]: newVal };
        const keyMap = featureKeyMap;
        const nodeKey = node.feature_key;

        if (newVal) {
          // Checking → auto-check all prerequisites
          const prereqKeys = FEATURE_DEPENDENCIES_BY_KEY[nodeKey] || [];
          prereqKeys.forEach((reqKey) => {
            const reqId = keyMap[reqKey];
            if (reqId) next[reqId] = true;
          });
        } else {
          // Unchecking → auto-uncheck any dependants
          Object.entries(FEATURE_DEPENDENCIES_BY_KEY).forEach(([depKey, prereqKeys]) => {
            if (prereqKeys.includes(nodeKey)) {
              const depId = keyMap[depKey];
              if (depId) next[depId] = false;
            }
          });
        }

        return next;
      });

      if (!newVal && isToggleOrCount) {
        setOptions((prev) => {
          const next = { ...prev };
          delete next[node.id];
          const keyMap = featureKeyMap;
          const nodeKey = node.feature_key;
          Object.entries(FEATURE_DEPENDENCIES_BY_KEY).forEach(([depKey, prereqKeys]) => {
            if (prereqKeys.includes(nodeKey)) {
              const depId = keyMap[depKey];
              if (depId) delete next[depId];
            }
          });
          return next;
        });
      }

      if (newVal && isToggleOrCount) {
        setOptions((prev) => ({
          ...prev,
          [node.id]: { mode: "full", count: "" },
        }));
      }
    },
    [isChecked, isToggleOrCount, node.id, node.feature_key, featureKeyMap, setChecked, setOptions],
  );

  // Toggle group: check/uncheck all leaf descendants
  const handleGroupToggle = useCallback(
    (e) => {
      e.stopPropagation();
      const newVal = !(allLeafChecked && isChecked);
      // Set the group node itself
      setChecked((prev) => {
        const next = { ...prev, [node.id]: newVal };
        // Set all descendants
        const allIds = collectAllNodeIds(node);
        allIds.forEach((id) => {
          next[id] = newVal;
        });
        return next;
      });
      // If unchecking group, clear options for all toggle_or_count descendants
      if (!newVal) {
        setOptions((prev) => {
          const next = { ...prev };
          collectAllNodeIds(node).forEach((id) => {
            delete next[id];
          });
          return next;
        });
      }
    },
    [allLeafChecked, isChecked, node, setChecked, setOptions],
  );

  const toggleExpand = useCallback(
    (e) => {
      e.stopPropagation();
      setExpanded((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
    },
    [node.id, setExpanded],
  );


  // Padding per depth level
  const paddingLeft =
    depth === 0
      ? "tw-pl-[50px]"
      : depth === 1
        ? "tw-pl-[79px]"
        : depth === 2
          ? "tw-pl-[110px]"
          : "tw-pl-[155px]";

  // ── Group Node ──
  if (isGroup) {
    return (
      <div className="tw-border-b tw-border-gray-100 last:tw-border-b-0">
        {/* Group Header */}
        <div
          className={`tw-flex tw-items-center tw-justify-between tw-pr-4 tw-py-3 tw-cursor-pointer tw-select-none ${paddingLeft} ${isExpanded ? "tw-bg-[#f9fafb]" : "tw-bg-white"
            } hover:tw-bg-[#f9fafb] tw-transition-colors tw-duration-150`}
          onClick={toggleExpand}
        >
          <div className="tw-flex tw-items-center tw-gap-2.5">
            <span
              className="tw-text-gray-400 tw-transition-transform tw-duration-200 tw-flex-shrink-0"
              style={{
                transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              }}
            >
              <ChevronDown size={15} />
            </span>
            <IndeterminateCheckbox
              checked={allLeafChecked && checkedLeafCount > 0}
              indeterminate={someLeafChecked}
              onChange={handleGroupToggle}
              onClick={(e) => e.stopPropagation()}
              className="tw-w-[20px] tw-h-[20px] tw-rounded tw-cursor-pointer tw-accent-[#2563eb] tw-flex-shrink-0"
            />
            <span
              className={`tw-text-[13px]  ${depth === 0 ? "tw-text-gray-800" : "tw-text-gray-700"}`}
            >
              {node.name}
            </span>
          </div>
          {depth === 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGroupToggle(e);
              }}
              className="tw-text-[#2563eb] tw-text-[12px] tw-font-semibold hover:tw-underline tw-bg-transparent tw-border-0 tw-cursor-pointer tw-flex-shrink-0"
            >
              {allLeafChecked && checkedLeafCount > 0
                ? "Deselect all"
                : "Select all"}
            </button>
          )}
        </div>

        {/* Children */}
        {isExpanded && (
          <div>
            {node.children.map((child) => (
              <FeatureNode
                key={child.id}
                node={child}
                depth={depth + 1}
                checked={checked}
                setChecked={setChecked}
                options={options}
                setOptions={setOptions}
                expanded={expanded}
                setExpanded={setExpanded}
                featureKeyMap={featureKeyMap}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Leaf / toggle_or_count Node ──
  return (
    <div
      className={`tw-border-b tw-border-gray-100 last:tw-border-b-0 tw-py-3 tw-pr-4 ${paddingLeft} tw-bg-white`}
    >
      <div className="tw-flex tw-items-start tw-gap-2.5">
        <span className="tw-w-[14px] tw-flex-shrink-0" />
        <input
          type="checkbox"
          id={`node-${node.id}`}
          checked={isChecked}
          onChange={handleToggle}
          className="tw-w-[20px] tw-h-[20px]  tw-flex-shrink-0 tw-cursor-pointer tw-accent-[#2563eb]"
        />
        <div className="tw-flex-1 tw-min-w-0">
          <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
            <label
              htmlFor={`node-${node.id}`}
              className={`tw-text-[13px] tw-cursor-pointer tw-select-none ${"tw-text-gray-800"
                }`}
            >
              {node.name}
            </label>
            {/* "Included" badge for is_included_text nodes */}
            {isChecked && isLeaf && node.is_included_text === 1 && (
              <span className="tw-text-[10px] tw-font-semibold tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-green-50 tw-text-green-700 tw-border tw-border-green-200">
                Included
              </span>
            )}
          </div>

          {/* toggle_or_count controls — shown only when checked */}
          {isChecked && isToggleOrCount && (
            <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
              {/* Full Access button */}
              <button
                type="button"
                onClick={() =>
                  setOptions((prev) => ({
                    ...prev,
                    [node.id]: { mode: "full", count: "" },
                  }))
                }
                className={`tw-text-[11px] tw-font-semibold tw-px-3 tw-py-1 tw-rounded-md tw-border tw-transition-all tw-duration-150 ${opt.mode === "full"
                  ? "tw-bg-[#0140c1] tw-text-white tw-border-[#0140c1]"
                  : "tw-bg-white tw-text-gray-500 tw-border-gray-300 hover:tw-border-[#0140c1] hover:tw-text-[#0140c1]"
                  }`}
              >
                Full Access
              </button>

              {/* Count button — label from display_text_2 */}
              <button
                type="button"
                onClick={() =>
                  setOptions((prev) => ({
                    ...prev,
                    [node.id]: {
                      mode: "count",
                      count: prev[node.id]?.count || "",
                    },
                  }))
                }
                className={`tw-text-[11px] tw-font-semibold tw-px-3 tw-py-1 tw-rounded-md tw-border tw-transition-all tw-duration-150 ${opt.mode === "count"
                  ? "tw-bg-[#0140c1] tw-text-white tw-border-[#0140c1]"
                  : "tw-bg-white tw-text-gray-500 tw-border-gray-300 hover:tw-border-[#0140c1] hover:tw-text-[#0140c1]"
                  }`}
              >
                {node.display_text_2}
              </button>

              {/* Count input — shown when count mode active */}
              {opt.mode === "count" && (
                <div className="tw-flex tw-items-center tw-gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={opt.count}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val !== "" && !/^\d+$/.test(val)) return; // digits only
                      setOptions((prev) => ({
                        ...prev,
                        [node.id]: { mode: "count", count: val },
                      }));
                    }}
                    placeholder="Enter Count"
                    className="tw-w-[110px] tw-border tw-border-[#0140c1] tw-rounded-md tw-px-2.5 tw-py-1 tw-text-[12px] focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-[#0140c1] tw-bg-[#f8faff]"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ModuleBlock: top-level module card ───────────────────────────────────────
function ModuleBlock({
  module,
  checked,
  setChecked,
  options,
  setOptions,
  expanded,
  setExpanded,
  featureKeyMap
}) {
  const isExpanded = !!expanded[module.id];

  const leafIds = useMemo(() => collectAllIds(module), [module]);
  const checkedLeafCount = leafIds.filter((id) => checked[id]).length;
  const allLeafChecked =
    checkedLeafCount === leafIds.length && leafIds.length > 0;
  const someLeafChecked = checkedLeafCount > 0 && !allLeafChecked;


  const handleSelectAll = useCallback(
    (e) => {
      e.stopPropagation();
      const newVal = !allLeafChecked;
      setChecked((prev) => {
        const next = { ...prev };
        collectAllNodeIds(module).forEach((id) => {
          next[id] = newVal;
        });
        return next;
      });
      if (!newVal) {
        setOptions((prev) => {
          const next = { ...prev };
          collectAllNodeIds(module).forEach((id) => {
            delete next[id];
          });
          return next;
        });
      }
    },
    [allLeafChecked, module, setChecked, setOptions],
  );

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => ({ ...prev, [module.id]: !prev[module.id] }));
  }, [module.id, setExpanded]);

  return (
    <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden tw-mb-3">
      {/* Module Header */}
      <div
        className={`tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3.5 tw-cursor-pointer tw-select-none ${isExpanded
          ? "tw-bg-[#f9fafb] tw-border-b tw-border-gray-200"
          : "tw-bg-white"
          } hover:tw-bg-[#f9fafb] tw-transition-colors tw-duration-150`}
        onClick={toggleExpand}
      >
        <div className="tw-flex tw-items-center tw-gap-2.5">
          <span
            className="tw-text-gray-400 tw-transition-transform tw-duration-200"
            style={{
              transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
            }}
          >
            <ChevronDown size={18} />
          </span>
          <IndeterminateCheckbox
            checked={allLeafChecked}
            indeterminate={someLeafChecked}
            onChange={handleSelectAll}
            onClick={(e) => e.stopPropagation()}
            className="tw-w-[20px] tw-h-[20px] tw-rounded tw-cursor-pointer tw-accent-[#2563eb] "
          />
          <span className="tw-font-bold tw-text-gray-900 tw-text-[14px]">
            {module.name}
          </span>
        </div>
        <div className="tw-flex tw-gap-4 tw-items-center">
          <span className="tw-text-[11px] tw-font-semibold tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-blue-50 tw-text-[#2563eb]  tw-border tw-border-blue-100">
            {checkedLeafCount}/{leafIds.length}
          </span>
          <button
            onClick={handleSelectAll}
            className="tw-text-[#2563eb] tw-text-[12px] tw-font-semibold hover:tw-underline tw-bg-transparent tw-border-0 tw-cursor-pointer"
          >
            {allLeafChecked ? "Deselect all" : "Select all"}
          </button>
        </div>
      </div>

      {/* Module Children */}
      {isExpanded && (
        <div>
          {module.children.map((child) => (
            <FeatureNode
              key={child.id}
              node={child}
              depth={0}
              checked={checked}
              setChecked={setChecked}
              options={options}
              setOptions={setOptions}
              expanded={expanded}
              setExpanded={setExpanded}
              featureKeyMap={featureKeyMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const CreatePackage = () => {
  const emptyDiscountForm = {
    type: "",
    value: "",
    startDate: null,
    endDate: null,
    notes: "",
  };
  const [modules, setModules] = useState([]); // raw API data (tree)
  const navigate = useNavigate();

  const goBack = () => navigate("/admin/packages");

  // ── Basic & Pricing State ──
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [annualPrice, setAnnualPrice] = useState("");
  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Feature Tree State ──
  // checked: flat map { [nodeId]: boolean } for ALL nodes
  // options: flat map { [nodeId]: { mode: 'full' | 'count', count: string } } for toggle_or_count nodes only
  // expanded: flat map { [nodeId]: boolean } for group/module nodes
  const [checked, setChecked] = useState({});
  const [options, setOptions] = useState({});
  const [expanded, setExpanded] = useState({});

  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [, setPackageUuid] = useState("");
  const skipModalCheck = useRef(false);

  // ── Discount State ──
  const [discountList, setDiscountList] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountErrors, setDiscountErrors] = useState({});
  const [discountForm, setDiscountForm] = useState(emptyDiscountForm);
  const parentMapRef = useRef({});
  const permissionsList =
    useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
  const permissions = permissionsList?.package_management || {};
  const featureKeyMapRef = useRef({});

  // ── Total selected count (leaf nodes only) ──
  // const totalSelected = useMemo(() => {
  //   return Object.values(checked).filter(Boolean).length;
  // }, [checked]);
  const allLeafIds = useMemo(() => {
    return modules.flatMap((mod) => collectAllIds(mod));
  }, [modules]);

  // correct selected count (only leaf nodes)
  const totalSelected = useMemo(() => {
    return allLeafIds.filter((id) => checked[id]).length;
  }, [checked, allLeafIds]);

  // ── Form Validity ──
  const checkFormValidity = useCallback(() => {
    const monthly = parseFloat(monthlyPrice);
    const annual = parseFloat(annualPrice);
    if (
      packageName.trim().length >= 3 &&
      !isNaN(monthly) &&
      monthly > 0 &&
      !isNaN(annual) &&
      annual > 0 &&
      (isEditMode || totalSelected > 0)
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [packageName, monthlyPrice, annualPrice, totalSelected, isEditMode]);

  useEffect(() => {
    checkFormValidity();
  }, [checkFormValidity]);

  // ── Validate count inputs: mode=count must have count >= 1 ──
  const validateCountOptions = useCallback(() => {
    for (const [nodeId, opt] of Object.entries(options)) {
      if (checked[nodeId] && opt.mode === "count") {
        const val = parseInt(opt.count);
        if (!opt.count || isNaN(val) || val < 1) return false;
      }
    }
    return true;
  }, [options, checked]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!packageName.trim()) {
      newErrors.packageName = "Package name is required.";
    } else if (packageName.trim().length < 3) {
      newErrors.packageName = "Minimum 3 characters required.";
    }
    if (!monthlyPrice || monthlyPrice === "0") {
      newErrors.monthlyPrice = "Monthly price is required.";
    }
    if (!annualPrice || annualPrice === "0") {
      newErrors.annualPrice = "Annual price is required.";
    }
    if (!isEditMode && totalSelected === 0) {
      newErrors.features = "Select at least one feature.";
    }
    if (permissions?.add_discount && discountList.length === 0 && !showDiscountForm) {
      newErrors.discount = "Please add a discount before saving.";
    }
    if (!validateCountOptions()) {
      newErrors.features =
        "Please enter a valid count (min 1) for all count-limited features";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    packageName,
    monthlyPrice,
    annualPrice,
    isEditMode,
    totalSelected,
    discountList,
    showDiscountForm,
    permissions?.add_discount,
    validateCountOptions,
  ]);
  const hasPricingOrFeaturesChanged = useCallback(() => {
    if (!originalData) return false;

    // Compare prices as numbers to avoid "10" vs "10.0" issues
    if (parseFloat(monthlyPrice) !== parseFloat(originalData.monthlyPrice))
      return true;
    if (parseFloat(annualPrice) !== parseFloat(originalData.annualPrice))
      return true;

    // Only compare keys that exist in original — ignore unrelated nodes
    for (const id of Object.keys(originalData.checked)) {
      if (!!checked[id] !== !!originalData.checked[id]) return true;
    }

    // Also check if user checked something that wasn't in original at all
    for (const id of Object.keys(checked)) {
      if (checked[id] && originalData.checked[id] === undefined) return true;
    }

    // Compare options — normalize to avoid key-order false positives
    const sortedCurrent = JSON.stringify(
      Object.fromEntries(Object.entries(options).sort()),
    );
    const sortedOriginal = JSON.stringify(
      Object.fromEntries(Object.entries(originalData.options || {}).sort()),
    );
    if (sortedCurrent !== sortedOriginal) return true;

    // Compare discounts
    const currentDiscounts = JSON.stringify(
      discountList.map((d) => ({
        discount_type: d.type === "Percentage" ? "PERCENT" : "FIXED",
        discount_value: parseFloat(d.value),
        start_date: d.startDate
          ? new Date(d.startDate).toISOString().split("T")[0]
          : null,
        end_date: d.endDate
          ? new Date(d.endDate).toISOString().split("T")[0]
          : null,
        notes: d.notes || "",
      })),
    );
    if (currentDiscounts !== originalData.discounts) return true;

    return false;
  }, [originalData, monthlyPrice, annualPrice, checked, options, discountList]);

  // ── Fetch Features ──
  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const raw = await GetPackageFeatures();
      const res = typeof raw === "string" ? JSON.parse(raw) : raw;
      const data = res?.data || [];
      setModules(data);
      const keyMap = {};
      const buildKeyMap = (node) => {
        if (node.feature_key) keyMap[node.feature_key] = node.id;
        node.children?.forEach(buildKeyMap);
      };
      data.forEach(buildKeyMap);
      featureKeyMapRef.current = keyMap;
      parentMapRef.current = buildParentMap(data);
      // Initialize all nodes as unchecked
      const initChecked = {};
      const initExpanded = {};
      const initAll = (node) => {
        initChecked[node.id] = false;
        if (node.children && node.children.length > 0) {
          initExpanded[node.id] = false;
          node.children.forEach(initAll);
        }
      };
      data.forEach((mod) => {
        initChecked[mod.id] = false;
        initExpanded[mod.id] = false;
        mod.children?.forEach(initAll);
      });
      setChecked(initChecked);
      setExpanded(initExpanded);
    } catch (error) {
      console.error("Feature fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch Package Details (Edit Mode) ──
  const fetchPackageDetails = async (uuid) => {
    try {
      setLoading(true);
      const payload = { package_uuid: uuid };
      const raw = await ViewPackage(payload);
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;
      const data = response?.data;
      if (!data) return;

      setPackageName(data.name || "");
      setDescription(data.description || "");
      setMonthlyPrice(String(data.pricing_monthly || "0"));
      setAnnualPrice(String(data.pricing_annual || "0"));
      setPackageUuid(data.package_uuid);

      const newChecked = {};
      const newOptions = {};

      const prefillNode = (node) => {
        newChecked[node.id] = !!node.selected;

        if (node.selected && node.item_count != null && node.item_count > 0) {
          newOptions[node.id] = {
            mode: "count",
            count: String(node.item_count),
          };
        }

        if (node.children) node.children.forEach(prefillNode);
      };

      data.features?.forEach(prefillNode);
      setChecked((prev) => ({ ...prev, ...newChecked }));
      setOptions(newOptions);

      const discounts = (data.discounts || []).map((d) => {
        const startDate = d.start_date ? new Date(d.start_date) : null;
        const endDate = d.end_date ? new Date(d.end_date) : null;
        const start = startDate ? startDate.toLocaleDateString("en-GB") : null;
        const end = endDate ? endDate.toLocaleDateString("en-GB") : null;
        let dateText = "";
        if (start && end) dateText = ` (${start} – ${end})`;
        else if (start) dateText = ` (From ${start})`;
        else if (end) dateText = ` (Until ${end})`;
        return {
          id: crypto.randomUUID(),
          type: d.discount_type === "PERCENT" ? "Percentage" : "Fixed Amount",
          value: String(d.discount_value),
          startDate,
          endDate,
          notes: d.notes || "",
          display: `${d.discount_type === "PERCENT" ? "" : "$"}${d.discount_value}${d.discount_type === "PERCENT" ? "%" : ""} off${dateText}`,
        };
      });
      setDiscountList(discounts);

      setOriginalData({
        monthlyPrice: String(data.pricing_monthly || "0"),
        annualPrice: String(data.pricing_annual || "0"),
        checked: newChecked,
        options: newOptions,
        discounts: JSON.stringify(
          (data.discounts || []).map((d) => ({
            discount_type: d.discount_type,
            discount_value: d.discount_value,

            start_date: d.start_date
              ? new Date(d.start_date).toISOString().split("T")[0]
              : null,
            end_date: d.end_date
              ? new Date(d.end_date).toISOString().split("T")[0]
              : null,
            notes: d.notes || "",
          })),
        ),
      });
    } catch (error) {
      console.error("Error loading package details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchFeatures();
      if (isEditMode && id) await fetchPackageDetails(id);
    };
    init();
  }, [id]);
  useEffect(() => { }, [checked, options]);

  // ── Discount handlers ──
  const getDiscountValueError = useCallback((value) => {
    const num = parseFloat(value);
    if (!value || isNaN(num)) return "Discount value is required.";
    if (num <= 0) return "Discount must be greater than 0.";
    return "";
  }, []);

  const handleDiscountTypeChange = (value) => {
    setDiscountForm((prev) => ({ ...prev, type: value }));
    setDiscountErrors((prev) => {
      const next = { ...prev };
      if (value) delete next.type;
      else next.type = "Discount type is required.";
      return next;
    });
  };

  const handleDiscountChange = (e) => {
    const { name, value } = e.target;
    setDiscountForm((prev) => ({ ...prev, [name]: value }));

    if (name !== "value") return;

    const valueError = getDiscountValueError(value);
    setDiscountErrors((prev) => {
      const next = { ...prev };
      if (valueError) next.value = valueError;
      else delete next.value;
      return next;
    });
  };

  const addDiscount = () => {
    const errs = {};
    if (!discountForm.type) errs.type = "Discount type is required.";

    const valueError = getDiscountValueError(discountForm.value);
    if (valueError) errs.value = valueError;

    if (Object.keys(errs).length > 0) {
      setDiscountErrors(errs);
      return;
    }

    const start = discountForm.startDate
      ? new Date(discountForm.startDate).toLocaleDateString("en-us")
      : null;
    const end = discountForm.endDate
      ? new Date(discountForm.endDate).toLocaleDateString("en-us")
      : null;
    let dateText = "";
    if (start && end) dateText = ` (${start} – ${end})`;
    else if (start) dateText = ` (From ${start})`;
    else if (end) dateText = ` (Until ${end})`;

    const newDiscount = {
      id: editingDiscountId || Date.now(),
      type: discountForm.type,
      value: discountForm.value,
      startDate: discountForm.startDate,
      endDate: discountForm.endDate,
      notes: discountForm.notes || "",
      display: `${discountForm.type === "Percentage" ? "" : "$"}${discountForm.value}${discountForm.type === "Percentage" ? "%" : ""} off${dateText}`,
    };

    if (editingDiscountId) {
      setDiscountList((prev) =>
        prev.map((d) => (d.id === editingDiscountId ? newDiscount : d)),
      );
    } else {
      setDiscountList([newDiscount]);
    }
    setEditingDiscountId(null);
    setDiscountForm(emptyDiscountForm);
    setDiscountErrors({});
    setShowDiscountForm(false);
    setErrors((prev) => ({ ...prev, discount: "" }));
  };


  // ── Save / Update ──
  const handleSave = async () => {
    if (!validateForm()) return;

    if (
      isEditMode &&
      hasPricingOrFeaturesChanged() &&
      !skipModalCheck.current
    ) {
      setShowUpdateModal(true);
      return;
    }
    skipModalCheck.current = false;
    setLoading(true);

    const directlyChecked = Object.entries(checked)
      .filter(([, val]) => val)
      .map(([id]) => id);
    const allIds = new Set(directlyChecked);
    directlyChecked.forEach((id) => {
      let current = id;
      while (parentMapRef.current[current]) {
        allIds.add(parentMapRef.current[current]);
        current = parentMapRef.current[current];
      }
    });
    const selectedFeatures = Array.from(allIds);
    const featureOptions = {};
    Object.entries(options).forEach(([nodeId, opt]) => {
      if (checked[nodeId] && opt.mode === "count") {
        const countVal = parseInt(opt.count);
        featureOptions[nodeId] = {
          count: isNaN(countVal) || countVal < 1 ? 0 : countVal,
        };
      }
    });

    const payload = {
      package_uuid: id,
      name: packageName,
      description: description,
      pricing_monthly: parseFloat(monthlyPrice),
      pricing_annual: parseFloat(annualPrice),
      feature_ids: selectedFeatures,
      feature_options: featureOptions,
      discounts: discountList.map((d) => ({
        discount_type: d.type === "Percentage" ? "PERCENT" : "FIXED",
        discount_value: parseFloat(d.value),
        applies_to: "MONTHLY",
        start_date: d.startDate
          ? new Date(d.startDate).toISOString().split("T")[0]
          : null,
        end_date: d.endDate
          ? new Date(d.endDate).toISOString().split("T")[0]
          : null,
        notes: d.notes || "",
      })),
    };

    console.log(payload);

    try {
      const raw = isEditMode
        ? await UpdatePackage(payload)
        : await AddPackage(payload);
      const response = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (response?.valid) {
        showToast(
          "success",
          isEditMode
            ? "Package updated successfully."
            : "Package created successfully.",
        );
        setTimeout(() => navigate("/admin/packages"), 800);
      } else {
        showToast("error", response?.message || "Failed to save package");
      }
    } catch (error) {
      console.error("Error saving package:", error);
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Split modules into left/right columns ──
  const leftModules = modules.filter((_, i) => i % 2 === 0);
  const rightModules = modules.filter((_, i) => i % 2 !== 0);

  void discountErrors;
  console.log(permissions)
  return (
    <div className="tw-min-h-screen tw-text-sm tw-text-gray-700">
      <style>{`
  .rdp-custom .react-datepicker__header {
    background-color: #0140c1 !important;
    border-bottom: none !important;
    border-radius: 10px 10px 0 0;
    padding: 12px 10px 8px;
  }
  .rdp-custom .react-datepicker__year-dropdown,
  .rdp-custom .react-datepicker__month-dropdown {
    max-height: 200px !important;
    overflow-y: auto !important;
    scrollbar-width: thin;
    scrollbar-color: #0140c1 #e2e8f0;
  }
  .rdp-custom .react-datepicker__year-dropdown::-webkit-scrollbar,
  .rdp-custom .react-datepicker__month-dropdown::-webkit-scrollbar { width: 5px; }
  .rdp-custom .react-datepicker__year-dropdown::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
  .rdp-custom .react-datepicker__year-dropdown::-webkit-scrollbar-thumb { background-color: #0140c1; border-radius: 10px; }
  .rdp-custom .react-datepicker__current-month { color: #ffffff !important; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
  .rdp-custom .react-datepicker__day-name { color: rgba(255,255,255,0.8) !important; font-size: 11px; font-weight: 500; }
  .rdp-custom .react-datepicker__month-dropdown-container--select,
  .rdp-custom .react-datepicker__year-dropdown-container--select { margin: 0 4px; }
  .rdp-custom .react-datepicker__month-select,
  .rdp-custom .react-datepicker__year-select {
    background-color: rgba(255,255,255,0.18) !important;
    color: #ffffff !important;
    border: 1px solid rgba(255,255,255,0.4) !important;
    border-radius: 6px !important;
    padding: 4px 10px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    cursor: pointer;
    outline: none;
    appearance: auto;
    -webkit-appearance: auto;
  }
  .rdp-custom .react-datepicker__month-select:focus,
  .rdp-custom .react-datepicker__year-select:focus {
    border-color: rgba(255,255,255,0.9) !important;
    background-color: rgba(255,255,255,0.28) !important;
  }
  .rdp-custom .react-datepicker__month-select option,
  .rdp-custom .react-datepicker__year-select option { background-color: #fff !important; color: #333 !important; }
  .rdp-custom .react-datepicker__navigation { top: 14px; }
  .rdp-custom .react-datepicker__navigation-icon::before { border-color: rgba(255,255,255,0.9) !important; }
  .rdp-custom .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { border-color: #ffffff !important; }
  .rdp-custom .react-datepicker { border: 1px solid #e2e8f0 !important; border-radius: 12px !important; box-shadow: 0 8px 24px rgba(1,64,193,0.15) !important; overflow: hidden; font-family: inherit; }
  .rdp-custom .react-datepicker__day { border-radius: 6px !important; font-size: 13px; color: #1e293b; transition: background 0.1s, color 0.1s; }
  .rdp-custom .react-datepicker__day:hover { background-color: #dbeafe !important; color: #0140c1 !important; }
  .rdp-custom .react-datepicker__day--selected,
  .rdp-custom .react-datepicker__day--keyboard-selected { background-color: #0140c1 !important; color: #ffffff !important; font-weight: 600; }
  .rdp-custom .react-datepicker__day--today { font-weight: 700; color: #0140c1; }
  .rdp-custom .react-datepicker__day--today.react-datepicker__day--selected { color: #ffffff !important; }
  .rdp-custom .react-datepicker__day--outside-month { color: #cbd5e1 !important; }
  .rdp-custom .react-datepicker__day--disabled { color: #cbd5e1 !important; cursor: not-allowed; }
  .rdp-custom .react-datepicker__today-button { background: #f1f5f9 !important; border-top: 1px solid #e2e8f0 !important; color: #0140c1 !important; font-size: 13px; font-weight: 600; padding: 8px; }
  .rdp-custom .react-datepicker__today-button:hover { background: #dbeafe !important; }
`}</style>

      {/* ── Header ── */}
      <div className="tw-flex tw-items-center tw-gap-4 tw-mb-2">
        <button
          onClick={goBack}
          className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#b3bcce] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors tw-duration-200"
        >
          <i className="icon-Previous tw-text-white tw-text-lg"></i>
        </button>
        <div>
          <div className="tw-text-gray-500 tw-text-sm">Packages /</div>
          <h1 className="tw-text-gray-900 tw-text-xl tw-font-bold">
            {isEditMode ? "Edit Package" : "Create Package"}
          </h1>
        </div>
      </div>

      <div className="tw-space-y-6 tw-mx-auto">
        {loading && <FullPageLoader />}

        {/* ── Basic Information + Pricing + Discounts ── (UNCHANGED) */}
        <section className="tw-bg-white tw-rounded-xl tw-border tw-p-8 tw-shadow-sm">
          <h2 className="tw-font-bold tw-mb-6 tw-text-gray-800 tw-text-[16px]">
            Basic Information
          </h2>
          <div className="tw-grid tw-grid-cols-2 tw-gap-x-12 tw-gap-y-6 tw-mb-6 tw-max-w-[650px]">
            <div className="tw-flex tw-flex-col">
              <label className="tw-block tw-mb-1.5 tw-font-medium tw-text-sm tw-text-[#3b3b3b]">
                Name <span className="tw-text-red-500">*</span>
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => {
                  let value = capitalizeFirstLetter(e.target.value);
                  setPackageName(value);
                  setErrors((prev) => ({
                    ...prev,
                    packageName:
                      value.trim().length === 0
                        ? "Package name is required."
                        : value.trim().length < 3
                          ? "Minimum 3 characters required."
                          : "",
                  }));
                }}
                placeholder="Enter Package Name"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-p-2 tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500"
              />
              {errors.packageName && (
                <p className="tw-text-red-500 tw-text-xs">
                  {errors.packageName}
                </p>
              )}
              <div className="tw-mt-1">
                <p className="tw-text-gray-400 tw-text-[11px]">
                  {packageName.length}/80 characters (min: 3)
                </p>
              </div>
            </div>
          </div>

          <div className="tw-mb-10 tw-max-w-[650px]">
            <label className="tw-block tw-mb-1.5 tw-font-medium tw-text-sm tw-text-[#3b3b3b]">
              Description
            </label>
            <textarea
              value={capitalizeFirstLetter(description)}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the package"
              rows={4}
              className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-p-2.5 tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500"
            />
            <p className="tw-text-gray-400 tw-text-[11px] tw-mt-1">
              {description.length}/500 characters
            </p>
          </div>

          <h2 className="tw-font-bold tw-mb-6 tw-text-[#3b3b3b] tw-text-[16px]">
            Pricing
          </h2>
          <div className="tw-grid tw-grid-cols-2 tw-gap-x-12 tw-mb-10 tw-max-w-[650px]">
            <div>
              <label className="tw-block tw-mb-1.5 tw-font-[500] tw-text-[15px] tw-text-[#3b3b3b]">
                Monthly Price <span className="tw-text-red-500">*</span>
              </label>
              <input
                type="number"
                value={monthlyPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  setMonthlyPrice(value);
                  setErrors((prev) => ({
                    ...prev,
                    monthlyPrice:
                      !value || value === "0"
                        ? "Monthly price is required."
                        : "",
                  }));
                }}
                placeholder="Enter Monthly Price"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-p-2 tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500"
              />
              {errors.monthlyPrice && (
                <p className="tw-text-red-500 tw-text-xs">
                  {errors.monthlyPrice}
                </p>
              )}
            </div>
            <div>
              <label className="tw-block tw-mb-1.5 tw-font-[500] tw-text-[15px] tw-text-[#3b3b3b]">
                Annually Price <span className="tw-text-red-500">*</span>
              </label>
              <input
                type="number"
                value={annualPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  setAnnualPrice(value);
                  setErrors((prev) => ({
                    ...prev,
                    annualPrice:
                      !value || value === "0" ? "Annual price is required." : "",
                  }));
                }}
                placeholder="Enter Annually Price"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-p-2 tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500"
              />
              {errors.annualPrice && (
                <p className="tw-text-red-500 tw-text-xs">
                  {errors.annualPrice}
                </p>
              )}
            </div>
          </div>

          {/* Discounts */}
          {(permissions?.add_discount || permissions?.edit_discount || discountList.length > 0) && (
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
              <h2 className="tw-font-bold tw-text-gray-800">
                Discounts <span className="tw-text-red-500">*</span>
              </h2>
              {!showDiscountForm && discountList.length === 0 && permissions?.add_discount && (
                <button
                  className="tw-text-[#155dfc] tw-text-[14px] tw-font-bold tw-flex tw-items-center tw-gap-1"
                  onClick={() => {
                    setDiscountForm(emptyDiscountForm);
                    setDiscountErrors({});
                    setEditingDiscountId(null);
                    setShowDiscountForm(true);
                  }}
                >
                  <Plus size={14} /> Add Discount
                </button>
              )}
            </div>)}

          {discountList.map((discount) => (
            <div
              key={discount.id}
              className="tw-bg-green-50 tw-border tw-p-3 tw-rounded tw-flex tw-justify-between tw-items-center tw-mb-4"
            >
              <span className="tw-text-green-700 tw-text-xs">
                {discount.display}
              </span>
              <div className="tw-flex tw-items-center tw-gap-3">
                {permissions?.edit_discount && <button
                  onClick={() => {
                    setEditingDiscountId(discount.id);
                    setDiscountForm({
                      type: discount.type,
                      value: discount.value,
                      startDate: discount.startDate,
                      endDate: discount.endDate,
                      notes: discount.notes,
                    });
                    setDiscountErrors({});
                    setShowDiscountForm(true);
                  }}
                  className="tw-font-bold"
                >
                  <i
                    className="icon-Edit tw-text-blue-800 tw-text-[17px]"
                    title="Edit"
                  ></i>
                </button>}
              </div>
            </div>
          ))}
          {errors.discount && (
            <p className="tw-text-red-500 tw-text-xs tw-mb-3">{errors.discount}</p>
          )}

          {showDiscountForm && (
            <div className="tw-border tw-border-gray-200 tw-rounded-xl tw-p-6 tw-bg-white tw-mb-6">
              <div className="tw-grid tw-grid-cols-2 tw-gap-6 tw-mb-5">
                <div>
                  <label className="tw-block tw-mb-1 tw-font-semibold tw-text-gray-600">
                    Discount Type <span className="tw-text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={["Percentage", "Fixed Amount"]}
                    value={discountForm.type}
                    onChange={handleDiscountTypeChange}
                    placeholder="Discount type"
                    width="tw-w-full"
                  />
                  {discountErrors.type && (
                    <p className="tw-text-red-500 tw-text-xs tw-mt-1">
                      {discountErrors.type}
                    </p>
                  )}
                </div>
                <div className="tw-flex tw-flex-col">
                  <label className="tw-text-xs tw-font-semibold tw-text-[#3b3b3b] tw-mb-1.5 tw-block">
                    Discount Value <span className="tw-text-red-500">*</span>
                  </label>
                  <div className="tw-relative tw-h-[40px]">
                    <input
                      type="text"
                      name="value"
                      value={discountForm.value}
                      onChange={handleDiscountChange}
                      className="tw-w-full tw-h-full tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-text-sm focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500"
                      placeholder="0"
                    />
                    <span className="tw-absolute tw-right-3 tw-top-1/2 tw--translate-y-1/2 tw-text-gray-400 tw-pointer-events-none tw-text-sm">
                      {discountForm.type === "Percentage"
                        ? "%"
                        : discountForm.type === "Fixed Amount"
                          ? "$"
                          : ""}
                    </span>
                    {discountErrors.value && (
                      <p className="tw-text-red-500 tw-text-xs tw-mt-1">
                        {discountErrors.value}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="tw-mb-5">
                <label className="tw-text-xs tw-font-semibold tw-text-[#3b3b3b] tw-mb-1.5 tw-block">
                  Applies To <span className="tw-text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value="Both (Monthly & Annually)"
                  className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-p-2.5 tw-text-sm tw-bg-gray-50 tw-text-gray-600 focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500"
                  readOnly
                />
              </div>

              <div className="tw-grid tw-grid-cols-2 tw-gap-6 tw-mb-5">
                <div>
                  <label className="tw-text-xs tw-font-semibold tw-text-[#3b3b3b] tw-mb-1.5 tw-block">
                    Start Date (Optional)
                  </label>
                  <DatePicker
                    selected={discountForm.startDate}
                    onChange={(date) =>
                      setDiscountForm((prev) => ({ ...prev, startDate: date }))
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                    wrapperClassName="tw-w-full"
                    className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-p-2.5 tw-text-sm tw-outline-none focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500"
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    popperClassName="rdp-custom"
                  />
                </div>
                <div>
                  <label className="tw-text-xs tw-font-semibold tw-text-[#3b3b3b] tw-mb-1.5 tw-block">
                    End Date (Optional)
                  </label>
                  <DatePicker
                    selected={discountForm.endDate}
                    onChange={(date) =>
                      setDiscountForm((prev) => ({ ...prev, endDate: date }))
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                    minDate={discountForm.startDate}
                    wrapperClassName="tw-w-full"
                    className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-p-2.5 tw-text-sm tw-outline-none focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500"
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    popperClassName="rdp-custom"
                  />
                </div>
              </div>

              <div className="tw-mb-6">
                <label className="tw-text-xs tw-font-semibold tw-text-[#3b3b3b] tw-mb-1.5 tw-block">
                  Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Notes about this discount"
                  value={capitalizeFirstLetter(discountForm.notes || "")}
                  onChange={handleDiscountChange}
                  className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-p-2.5 tw-text-sm tw-outline-none focus:tw-outline-none focus:tw-border-blue-500 focus:tw-ring-1 focus:tw-ring-blue-500"
                />
              </div>

              <div className="tw-flex tw-justify-end tw-gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountForm(emptyDiscountForm);
                    setDiscountErrors({});
                    setEditingDiscountId(null);
                    setShowDiscountForm(false);
                  }}
                  className="tw-px-6 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md tw-text-xs tw-font-bold tw-text-gray-600 hover:tw-bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addDiscount}
                  className="tw-px-6 tw-py-2 tw-bg-blue-700 tw-text-white tw-rounded-md tw-text-xs tw-font-bold hover:tw-bg-blue-800"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Module & Features Selection (REPLACED) ── */}
        <section className="tw-bg-white tw-rounded-xl tw-border tw-p-8 tw-shadow-sm">
 
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            {/* LEFT */}
            <div>
              <h2 className="tw-text-[16px] tw-font-semibold tw-text-gray-900">
                Modules & Feature Selection
              </h2>
              <p className="tw-text-[12px] tw-text-gray-500 tw-mt-0.5">
                Configure package access for each module and sub-feature
              </p>
            </div>

            {/* RIGHT */}
            <div className="tw-flex tw-items-center tw-gap-3">
              {/* Count pill — dynamic */}
              <span className="tw-text-[12px] tw-font-semibold tw-px-2.5 tw-py-1 tw-rounded-full tw-bg-blue-50 tw-text-[#2563eb] tw-border tw-border-blue-100">
                {/* {totalSelected} / {Object.keys(checked).length} features enabled */}
                {totalSelected} / {allLeafIds.length} features enabled
              </span>

              {/* Expand All */}
              <button
                onClick={() =>
                  setExpanded((prev) =>
                    Object.fromEntries(Object.keys(prev).map((k) => [k, true])),
                  )
                }
                className="tw-text-[12px] tw-font-medium tw-px-4 tw-py-1 tw-rounded-md tw-border tw-border-gray-200 tw-text-gray-700 tw-bg-white hover:tw-bg-gray-50"
              >
                Expand All
              </button>

              {/* Collapse All */}
              <button
                onClick={() =>
                  setExpanded((prev) =>
                    Object.fromEntries(
                      Object.keys(prev).map((k) => [k, false]),
                    ),
                  )
                }
                className="tw-text-[12px] tw-font-medium tw-px-4 tw-py-1 tw-rounded-md tw-border tw-border-gray-200 tw-text-gray-700 tw-bg-white hover:tw-bg-gray-50"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="tw-grid tw-grid-cols-2 tw-gap-6">
            {/* Left Column */}
            <div>
              {leftModules.map((mod) => (
                <ModuleBlock
                  key={mod.id}
                  module={mod}
                  checked={checked}
                  setChecked={setChecked}
                  options={options}
                  setOptions={setOptions}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  featureKeyMap={featureKeyMapRef.current}

                />
              ))}
            </div>
            {/* Right Column */}
            <div>
              {rightModules.map((mod) => (
                <ModuleBlock
                  key={mod.id}
                  module={mod}
                  checked={checked}
                  setChecked={setChecked}
                  options={options}
                  setOptions={setOptions}
                  expanded={expanded}
                  setExpanded={setExpanded}
                  featureKeyMap={featureKeyMapRef.current}
                />
              ))}
            </div>
          </div>


          {errors.features && (
            <p className="tw-text-red-500 tw-text-xs tw-mt-1">
              {errors.features}
            </p>
          )}
        </section>

        {/* ── Footer Buttons (UNCHANGED) ── */}
        <div className="tw-flex tw-justify-end tw-gap-4 tw-pt-10">
          <button
            onClick={goBack}
            className="tw-px-10 tw-py-2.5 tw-bg-gray-200 tw-rounded-md"
          >
            Cancel
          </button>
          <button
            disabled={!isFormValid}
            className={`tw-px-8 tw-py-2 tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${isFormValid
              ? "tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700 tw-cursor-pointer tw-shadow-sm"
              : "tw-bg-gray-100 tw-text-gray-400 tw-border tw-border-gray-200 tw-cursor-not-allowed"
              }`}
            onClick={handleSave}
          >
            {isEditMode ? "Update Package" : "Save Package"}
          </button>
        </div>
      </div>
      {showUpdateModal && (
        <DeleteModal
          action="update"
          entity="package"
          icon="icon-Packages"
          onClose={() => setShowUpdateModal(false)}
          onConfirm={() => {
            setShowUpdateModal(false);
            skipModalCheck.current = true;
            handleSave();
          }}
        />
      )}
    </div>
  );
};

export default CreatePackage;
