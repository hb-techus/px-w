import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CustomDataTable from "../../../genriccomponents/ReactTable";
import FullPageLoader from "../../../genriccomponents/loaders/FullPageLoader";
import { ShimmerTable } from "react-shimmer-effects";
import { showToast } from "../../../genriccomponents/techus-ToastNotification";
import NoDataFound from "../../../genriccomponents/NoDataFound";
// import { GetOrgProductList } from "../../../services/techus-services";
import ActionMenu from "../../../genriccomponents/ActionMenu";
import Dropdown from "../../Common/DropDown";
import TextWithTooltip from "../../Common/ToolTip";

const ITEMS_PER_PAGE = 10;

const display = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (!isNaN(num) && value !== "") {
    return num % 1 === 0 ? String(num) : String(parseFloat(num.toFixed(10)));
  }
  return value;
};

// ── Status Badge ──────────────────────────────────────────────────────────────
// const StatusBadge = ({ status }) => {
//   const isActive = status === 1 || status === "1" || status === "active" || status === true;
//   const label = isActive ? "Active" : "Inactive";
//   const style = isActive
//     ? "tw-bg-[#f1fdf4] tw-border-[#c1f9d5] tw-text-[#17803d]"
//     : "tw-bg-[#fef3f2] tw-border-[#fecaca] tw-text-[#b91c1b]";
//   const icon = isActive ? "icon-Processed" : "icon-Failed";

//   return (
//     <span
//       className={`tw-rounded-[20px] tw-inline-flex tw-items-center tw-gap-[5px] tw-border tw-px-3 tw-py-1 tw-text-[12px] tw-font-medium tw-w-[90px] tw-justify-center ${style}`}
//     >
//       <i className={`${icon} tw-text-[12px]`} />
//       {label}
//     </span>
//   );
// };

export default function ProductsTable() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  // const [deleteProduct, setDeleteProduct] = useState(null);
  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info) || {};
  const permissions = permissionsList?.products || {};
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [sortByName, setSortByName] = useState("Name (A-Z)");

  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  // const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Fetch Products ──────────────────────────────────────────────────────────
  const getProducts = useCallback(async () => {
    try {
      setIsTableLoading(true);



      let d = res?.data || res;
      if (typeof d === "string") d = JSON.parse(d);

      if (d?.valid) {
        setProducts(Array.isArray(d.data) ? d.data : []);
      } else {
        showToast("error", d?.message || "Failed to fetch products");
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      showToast("error", "Failed to fetch products");
      setProducts([]);
    } finally {
      setIsTableLoading(false);
    }
  }, []);

  useEffect(() => {
    getProducts();
  }, [getProducts]);

  // ── Filtered & Sorted Data ──────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (row) =>
          (row.product_name || "").toLowerCase().includes(q) ||
          (row.takeoff_name || "").toLowerCase().includes(q) ||
          (row.unit_name || "").toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "All Status" && filterStatus !== "All") {
      const isActive = filterStatus === "Active";
      result = result.filter((r) => {
        const active = r.status === 1 || r.status === "1" || r.status === "active" || r.status === true;
        return isActive ? active : !active;
      });
    }

    if (sortByName === "Name (A-Z)") {
      result.sort((a, b) =>
        String(a.product_name || "").localeCompare(String(b.product_name || ""))
      );
    } else if (sortByName === "Name (Z-A)") {
      result.sort((a, b) =>
        String(b.product_name || "").localeCompare(String(a.product_name || ""))
      );
    }

    return result;
  }, [products, search, filterStatus, sortByName]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleView = useCallback(
    (id) => navigate(`/admin/products/view/${id}?mode=view`),
    [navigate]
  );

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        name: (
          <div className="tw-text-[14px] tw-font-normal tw-text-[#6b7280] tw-leading-tight">
            Product Name
          </div>
        ),
        selector: (row) => row.product_name,
        sortable: true,
        minWidth: "180px",
        grow: 2,
        cell: (row) => (
          <TextWithTooltip
            text={row.product_name || "—"}
            className="tw-text-[14px] tw-font-medium tw-text-[#111827] tw-block tw-truncate"
          />
        ),
      },
      {
        name: (
          <div className="tw-text-[14px] tw-font-normal tw-text-[#6b7280] tw-leading-tight">
            Length (Ft)
          </div>
        ),
        selector: (row) => row.length_ft,
        sortable: true,
        minWidth: "110px",
        cell: (row) => (
          <span className="tw-text-[14px] tw-text-[#374151]">{display(row.length_ft)}</span>
        ),
      },
      {
        name: (
          <div className="tw-text-[14px] tw-font-normal tw-text-[#6b7280] tw-leading-tight">
            Width (Ft)
          </div>
        ),
        selector: (row) => row.width_ft,
        sortable: true,
        minWidth: "100px",
        cell: (row) => (
          <span className="tw-text-[14px] tw-text-[#374151]">{display(row.width_ft)}</span>
        ),
      },
      {
        name: (
          <div className="tw-text-[14px] tw-font-normal tw-text-[#6b7280] tw-leading-tight">
            Thickness (Mm)
          </div>
        ),
        selector: (row) => row.thickness_mm,
        sortable: true,
        minWidth: "130px",
        cell: (row) => (
          <span className="tw-text-[14px] tw-text-[#374151]">{display(row.thickness_mm)}</span>
        ),
      },
      {
        name: (
          <div className="tw-text-[14px] tw-font-normal tw-text-[#6b7280] tw-leading-tight">
            Diameter (Mm)
          </div>
        ),
        selector: (row) => row.diameter_mm,
        sortable: true,
        minWidth: "130px",
        cell: (row) => (
          <span className="tw-text-[14px] tw-text-[#374151]">{display(row.diameter_mm)}</span>
        ),
      },
      {
        name: (
          <div className="tw-text-[14px] tw-font-normal tw-text-[#6b7280] tw-leading-tight">
            Unit Cost
          </div>
        ),
        selector: (row) => row.unit_cost,
        sortable: true,
        minWidth: "110px",
        cell: (row) => (
          <span className="tw-text-[14px] tw-text-[#374151]">
            {row.unit_cost !== null && row.unit_cost !== undefined && row.unit_cost !== ""
              ? `$${parseFloat(row.unit_cost).toFixed(2)} ${row.unit_name || ""}`.trim()
              : "—"}
          </span>
        ),
      },
      {
        name: (
          <div className="tw-text-[14px] tw-font-normal tw-text-[#6b7280] tw-leading-tight">
            Actions
          </div>
        ),
        center: true,
        ignoreRowClick: true,
        minWidth: "80px",
        cell: (row) => (
          // ── Edit and Delete are always disabled in the list view ──
          <ActionMenu
  onView={() => handleView(row.product_id)}
  showView={permissions?.view}
  showEdit={permissions?.edit}
  showDelete={permissions?.delete}
  viewDisabled={false}
  editDisabled={false}
  deleteDisabled={false}
/>
        ),
      },
    ],
    [handleView]
  );

  // ── Custom Table Styles ─────────────────────────────────────────────────────
  const tableCustomStyles = {
    header: { style: { display: "none" } },
    headRow: {
      style: {
        backgroundColor: "#fafafa",
        borderTop: "1px solid #e5e7eb",
        borderBottom: "1px solid #e5e7eb",
        minHeight: "48px",
      },
    },
    headCells: {
      style: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
    rows: {
      style: {
        minHeight: "56px",
        borderBottom: "1px solid #f1f5f9",
        "&:hover": {
          backgroundColor: "#f8faff",
          borderTop: "1px solid #e2e8f0 !important",
        },
      },
    },
    cells: {
      style: {
        fontSize: "14px",
        color: "#374151",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
  };

  // ── Empty State ─────────────────────────────────────────────────────────────
  const EmptyDataView = (
    <NoDataFound
      description={
        search
          ? "No products match your search or filters."
          : "Get started by adding your first product."
      }
      buttonLabel={search ? "Clear Filters" : "Add Product"}
      btnColor="#0140c1"
      onReset={() => {
        setSearch("");
        setFilterStatus("All Status");
        setSortByName("Sort by Name");
        if (!search) {
          navigate("/admin/products/create-product");
        }
      }}
    />
  );

  void setIsPageLoading
  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {isPageLoading && <FullPageLoader />}

      <div className="tw-max-w-8xl tw-mx-auto">
        {/* Page Header */}
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
          <h1 className="tw-text-[20px] tw-font-semibold tw-text-[#111827]">
            Organization Products
          </h1>
          {/* {permissions?.create && <button
            onClick={() => navigate("/admin/products/create-product")}
            className="tw-flex tw-items-center tw-gap-2 tw-bg-[#0140c1] tw-px-5 tw-h-[40px] tw-text-white tw-rounded-md tw-text-sm tw-font-medium tw-transition-all tw-duration-200"
          >
            <Plus size={16} className="tw-shrink-0" />
            <span className="tw-text-[15px]">Add Product</span>
          </button>} */}
        </div>

        {/* Table */}
        {isTableLoading ? (
          <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
            <ShimmerTable row={8} col={8} />
          </div>
        ) : (
          <CustomDataTable
            columns={columns}
            data={filteredData}
            customStyles={tableCustomStyles}
            enablePagination={true}
            defaultPerPage={ITEMS_PER_PAGE}
            noDataComponent={EmptyDataView}
            searchTerm={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search package name..."
            filterComponent={
              <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                {/* <Dropdown
                  options={["All Status", "All", "Active", "Inactive"]}
                  placeholder="All Status"
                  value={filterStatus}
                  width="tw-w-36 tw-h-10"
                  onChange={setFilterStatus}
                /> */}
                <Dropdown
                  options={["Sort by Name", "Name (A-Z)", "Name (Z-A)"]}
                  placeholder="Sort by Name"
                  value={sortByName}
                  width="tw-w-40 tw-h-10"
                  onChange={setSortByName}
                />
              </div>
            }
          />
        )}
      </div>
    </>
  );
}