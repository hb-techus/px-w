


import React from "react";
import CustomDataTable from "../../../../genriccomponents/ReactTable";
import NoDataFound from "../../../../genriccomponents/NoDataFound";

import { useState, useMemo, useEffect } from "react";
import ActionMenu from "../../../../genriccomponents/ActionMenu";
import { useNavigate } from "react-router-dom";
import { get_bid_list, get_trade_data, delete_bid_data, detail_bid_data, draft_bid_read } from "../../../../services/techus-services";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FullPageLoader from "../../../../genriccomponents/loaders/FullPageLoader";
import { capitalizeFirstLetter, formatDateTime } from "../../../../utils/commonUtils";
import { showToast } from "../../../../genriccomponents/techus-ToastNotification";
import { ShimmerTable } from "react-shimmer-effects";

import DeleteModal from "../../../../genriccomponents/DeleteModal";
import FilterDropdown from "../../../../genriccomponents/FilterDropdown";
import TextWithTooltip from "../../../Common/ToolTip";
import usePermissions from "../../../Common/usePermissions";
import { countAccess } from "../../../../services/techus-services";
import upgradImg from "/src/assets/Images/no_data_images/upgrade_1.webp";
import { useEstimation } from "../../../context/EstimationContext";

const BitInviteTable = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    sortBy: "",
  });

  // Pagination State
  const [, setCurrentPage] = useState(1);


  // API State
  const [bidData, setBidData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, row: null });
  const [tradeMap, setTradeMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
      const [upgradeMessage, setUpgradeMessage] = useState("");
  const [tradeOptions, setTradeOptions] = useState([]);
  const [markingSentBidId, setMarkingSentBidId] = useState(null);
  const projectId = localStorage.getItem("project_id");
  const projectUId = localStorage.getItem("project_uuid");
   const organizationId = localStorage.getItem("organization_id");
 const {permissions}=usePermissions('bid_invites','contract_command');
 const{isMarkAsCompleted}=useEstimation()
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await get_trade_data();
        if (res?.valid) {
          const map = {};
          res.data.forEach((item) => {
            map[item.id] = item.display_name;
          });
          setTradeMap(map);
          setTradeOptions(["All Category", ...res.data.map((item) => item.display_name)]);
        }
      } catch (err) {
        console.error("Failed to fetch trades", err);
      }
    };
    fetchTrades();
  }, []);

  // Fetch API
  const fetchBidList = async ({ showLoader = true } = {}) => {
    if (!projectId) return;
    if (showLoader) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const res = await get_bid_list({ project_id: projectId });
      if (res?.valid) {
        setBidData(Array.isArray(res.data) ? res.data : []);
      } else if (showLoader) {
        setBidData([]);
        setError(res?.message || "Failed to fetch bid list.");
      }
    } catch (error) {
      console.error("Failed to fetch RFI list:", error);
      if (showLoader) {
        setBidData([]);
        setError("Failed to fetch bid list.");
      }
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBidList();
  }, [projectId]);

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const normalizedData = useMemo(() => {
    return bidData.map((item) => {
      let status = "Draft";
      if (item.mark_as_sent === 1) status = "Sent";
      else if (item.content_text) status = "Prepared";

      return {
        id: item.bid_id,
        name: item.bid_name,
        status,
        companyName: item.company_name,
        category: tradeMap[item.trade_category_id] || "—",
        date: item.created_date
          ? new Date(item.created_date).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            })
          : "—",
        _raw: item,
      };
    });
  }, [bidData, tradeMap]);

  const handleMarkAsSent = async (row) => {
    try {
      setMarkingSentBidId(row?.bid_id);
      const res = await draft_bid_read({ bid_id: row?.bid_id, mark_as_sent: 1 });

      if (res?.valid) {
        setBidData((prev) =>
          prev.map((item) =>
            item.bid_id === row?.bid_id
              ? {
                  ...item,
                  mark_as_sent: 1,
                }
              : item
          )
        );
        showToast("success", "Bid marked as sent successfully!");
        await fetchBidList({ showLoader: false });
      } else {
        showToast("error", res?.message || "Failed to mark as sent.");
      }
    } catch (error) {
      console.error("Failed to mark as sent:", error);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setMarkingSentBidId(null);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteModal({ show: true, row });
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsSubmitting(true);
      const res = await delete_bid_data({ bid_id: deleteModal.row.bid_id });
      if (res?.valid) {
        showToast("success", "Bid invite has been deleted successfully.");
        fetchBidList();
      } else {
        showToast("error", "Failed to delete Bid. Please try again.");
      }
    } catch (err) {
      console.error("Failed to delete bid:", err);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setDeleteModal({ show: false, row: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, row: null });
  };

  const handleEdit = async (row) => {
    const bid_uuid = row?.bid_uuid;
    try {
      setIsSubmitting(true);
      const res = await detail_bid_data({ bid_uuid });
      if (res?.valid) {
        navigate(
          `/project/view/${projectUId}/contract-command/bid-invites/${bid_uuid}/bid-invite-company`,
          {
            state: {
              isEdit: true,
              bidData: res?.data,
            },
          }
        );
      } else {
        showToast("error", res?.message || "Failed to fetch bid details.");
      }
    } catch (error) {
      console.error("Failed to fetch bid detail:", error);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusStyle = {
    Sent: {
      icon: "icon-sent",
      style: "tw-text-[#1e4ed8] tw-border-[#c0dbfe] tw-bg-[#f0f6ff] tw-px-2 tw-py-1 tw-gap-2",
    },
    Prepared: {
      icon: "icon-prepared",
      style: "tw-text-[#17803d] tw-border-[#c1f9d5] tw-bg-[#f1fdf4] tw-px-2 tw-py-1 tw-gap-2",
    },
    Draft: {
      icon: "icon-Timeline",
      style: "tw-text-[#b6b7b9] tw-border-[#b6b7b9] tw-bg-[#efefef] tw-px-3 tw-py-1 tw-gap-1",
    },
  };

  const columns = [
  
{
  name: "NAME",
  width: "15%",
  selector: (row) => row.name,
  sortable: true,
  minWidth: "200px",
  cell: (row) => (
    <div
      onClick={() =>
        navigate(
          `/project/view/${projectUId}/contract-command/bid-invites/${row._raw.bid_uuid}/bid-invite-company`,
          { state: { isView: true, bidData: row._raw } }
        )
      }
      className="tw-block tw-w-full tw-max-w-full tw-overflow-hidden hover:tw-text-blue-600  tw-cursor-pointer"
    >
      <TextWithTooltip
        text={capitalizeFirstLetter(row.name)}
        width="100%"
      />
    </div>
  ),
},
    {
      name: "TRADE CATEGORY",
      selector: (row) => row.category,
      cell: (row) => (
        <div className="tw-rounded-[20px] tw-text-[12px] tw-text-[#060606] tw-bg-[#f4f4f6] tw-font-[600] tw-px-3 tw-py-1">
          {row.category}
        </div>
      ),
    },
    {
      name: "COMPANY NAME",
      selector: (row) => row.companyName,
      sortable: true,
      minWidth: "250px",
    },
    {
      name: "CREATED",
      selector: (row) => row.date,
      cell: (row) => formatDateTime(row.date),
      sortable: true,
      minWidth: "200px",
    },
    {
      name: "STATUS",
      selector: (row) => row.status,
      cell: (row) => {
        const style = statusStyle[row.status] || statusStyle.Draft;
        return (
          <div className={`${style.style} tw-font-[500] tw-border tw-flex tw-items-center tw-text-[11px] tw-rounded-[20px]`}>
            <i className={`${style.icon}`}></i>
            <span>{row.status}</span>
          </div>
        );
      },
      sortable: true,
      minWidth: "200px",
    },
    {
      name: "ACTIONS",
      center: true,
      cell: (row) => {
        const canMarkAsSent = Boolean(row._raw?.content_text) && row._raw?.mark_as_sent !== 1;

        return (
          <ActionMenu
            onView={() => handleEdit(row._raw)}
            onEdit={() => handleEdit(row._raw)}
            showView={permissions?.view && row.status !== "Draft"}
            showEdit={permissions?.edit && row.status !== "Prepared" && row.status !== "Sent"}
            showDelete={permissions?.delete}
            editDisabled={isMarkAsCompleted}        // ← add
             deleteDisabled={isMarkAsCompleted}
            onDelete={() => handleDeleteClick(row._raw)}
            onMarkAsSent={canMarkAsSent ? () => handleMarkAsSent(row._raw) : undefined}
            showMarkAsSent={canMarkAsSent}
            markAsSentLoading={markingSentBidId === row._raw?.bid_id}
           c markAsSentDisabled={markingSentBidId === row._raw?.bid_id || isMarkAsCompleted}
            triggerDisabled={markingSentBidId === row._raw?.bid_id}
          />
        );
      },
    },
  ];

  const categorieOptions = tradeOptions;
  const statusOptions = ["All Status", "Sent", "Prepared", "Draft"];

  const filteredDetails = useMemo(() => {
    let data = [...normalizedData];
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      data = data.filter((d) =>
        [d.name || "", d.companyName || "", d.category || ""]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    if (filters.category) {
      data = data.filter(
        (d) => (d.category || "").toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.status) {
      data = data.filter(
        (d) => (d.status || "").toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.sortBy === "Newest") {
      data = [...data].sort(
        (a, b) => new Date(b._raw.created_date) - new Date(a._raw.created_date)
      );
    } else if (filters.sortBy === "Oldest") {
      data = [...data].sort(
        (a, b) => new Date(a._raw.created_date) - new Date(b._raw.created_date)
      );
    }

    return data;
  }, [searchQuery, filters, normalizedData]);
const isInitialEmpty = bidData.length === 0;
const isFilteredEmpty = filteredDetails.length === 0 && bidData.length > 0;
  // ── Pagination computed values ──────────────────────────────────────────────




  const handleFilterChange = (option) => {
    if (option === "All Category") {
      setFilters((prev) => ({ ...prev, category: "" }));
      return;
    }
    if (option === "All Status") {
      setFilters((prev) => ({ ...prev, status: "" }));
      return;
    }
    if (categorieOptions.includes(option)) {
      setFilters((prev) => ({ ...prev, category: option }));
    } else if (statusOptions.includes(option)) {
      setFilters((prev) => ({ ...prev, status: option }));
    } else {
      setFilters((prev) => ({ ...prev, sortBy: option }));
    }
  };



  const navigate = useNavigate();

  return (
    <div className="section">
      {isSubmitting && <FullPageLoader />}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />

      {/* Header */}
      <div className="header tw-flex tw-mt-2 tw-justify-between tw-items-center">
        <div className="tw-flex tw-items-center tw-gap-2 tw-min-w-0">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-[20px] tw-text-gray-600 tw-font-medium">Contract Command</span>
              <i className="icon-Save-and-Continue" />
              <span className="tw-text-[20px] tw-font-bold tw-text-gray-900">Bid Invites</span>
            </div>
            <p className="tw-text-[#1e293b] tw-text-[14px]">
              Draft trade-specific bid invitations with scope breakdowns, key dates, and submission requirements for subcontractors.
            </p>
          </div>
        </div>
        {permissions?.create_draft&&<button
         
       onClick={async () => {
                   try {
                    if (isMarkAsCompleted) return;  
                     setIsSubmitting(true);
                     const raw = await countAccess({
                       organization_id: organizationId ,
                        project_id: projectId,
                       module_name: "bid_invite",
                     });
                     const response = typeof raw === "string" ? JSON.parse(raw) : raw;
                     console.log(response)
                     if (response?.allowed) {
                       console.log(response?.allowed);
                      navigate(`/project/view/${projectUId}/contract-command/bid-invites/add`)
                     } else {
                       console.log(response?.message);
                       setUpgradeMessage(response?.message);
                       setShowUpgradeModal(true);
                     }
                   } catch (err) {
                     console.error("countAccess error:", err);
                     showToast("error", "Something went wrong");
                   }
                   finally {
                     setIsSubmitting(false);
                   }
                 }}
 disabled={isMarkAsCompleted}
    className={`group tw-flex tw-items-center tw-gap-2 tw-text-white tw-font-normal tw-px-4 tw-py-2 tw-rounded-md tw-shadow-sm tw-flex-shrink-0 tw-whitespace-nowrap
      tw-transition-all tw-duration-300 tw-ease-in-out
      ${isMarkAsCompleted
        ? "tw-bg-[#94a3b8] tw-cursor-not-allowed tw-opacity-60"
        : "tw-bg-[#1f4ed8] hover:tw-bg-[#1b44c4] hover:tw-shadow-lg hover:tw-shadow-blue-200/50 hover:tw-scale-[1.03] hover:-tw-translate-y-[1px] active:tw-scale-[0.98]"
      }`}
        >
          <i className="icon-New"></i> <span>Create Bid Invites</span>
        </button>}
      </div>

      {/* Table Card */}

<div className="tw-mt-[30px]">
  {isLoading ? (
    <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-[15px] tw-p-4">
      <ShimmerTable row={5} col={6} />
    </div>
  ) : error ? (
    <div className="tw-flex tw-flex-col tw-justify-center tw-items-center tw-py-16 tw-gap-3">
      <p className="tw-text-red-500 tw-text-sm">{error}</p>
      <button onClick={fetchBidList} className="tw-text-[#0140c1] tw-text-sm tw-underline">
        Retry
      </button>
    </div>
  ) : (
    <CustomDataTable
      columns={columns}
      data={filteredDetails}
      enablePagination={true}
      defaultPerPage={10}
      noWrapper={false}

      noDataComponent={
        <NoDataFound
          title="No Bid Invites Found"
          description={
            isFilteredEmpty
              ? "No bids match your search or filter criteria."
              : "No bid invites available."
          }
          buttonLabel={null}
        />
      }

    
      searchTerm={searchQuery}
      onSearchChange={isInitialEmpty ? null : setSearchQuery}

  
      filterComponent={
        isInitialEmpty ? null : (
          <>
            <FilterDropdown
              options={tradeOptions}
              value={filters.category}
              onChange={handleFilterChange}
              placeholder="All Category"
            />
            <FilterDropdown
              options={statusOptions}
              value={filters.status}
              onChange={handleFilterChange}
              placeholder="All Status"
            />
            <FilterDropdown
              options={["All", "Newest", "Oldest"]}
              value={filters.sortBy}
              onChange={handleFilterChange}
              placeholder="Sort By"
            />
          </>
        )
      }

      customStyles={{
        headRow: {
          style: {
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #edf2f7",
            minHeight: "56px",
          },
        },
        headCells: {
          style: {
            fontSize: "13px",
            fontWeight: "500",
            color: "#6e7178",
            textTransform: "uppercase",
            paddingLeft: "20px",
            paddingRight: "20px",
          },
        },
rows: {
  style: {
    minHeight: '58px',
    borderBottom: '1px solid #EAECF0',
    transition: 'background-color 0.15s ease',
    '&:last-of-type': { borderBottom: 'none' },
    '&:hover': {
      backgroundColor: '#f8faff',
      cursor: 'pointer',
    },
  },
},        cells: {
          style: {
            fontSize: "14px",
            color: "#4a5568",
            paddingLeft: "20px",
            paddingRight: "20px",
          },
        },
      }}
    />
  )}
</div>

      {deleteModal.show && (
        <DeleteModal
          action="delete"
          entity="bid"
          icon="icon-Delete-fill"
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}

   
         {showUpgradeModal && (
           <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9999] tw-flex tw-items-center tw-justify-center">
             <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[750px] tw-h-[569px] tw-px-[74px] tw-pt-[69px] tw-pb-10 tw-relative tw-text-center">
               <button
                 onClick={() => setShowUpgradeModal(false)}
                 className="tw-absolute tw-top-4 tw-right-4 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-gray-200 tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-50 tw-transition-colors"
               >
                 <i className="icon-Close tw-text-[14px]"></i>
               </button>
               <h2 className="tw-text-[30px]  tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug">
                 Unlock More with an Upgrade!
               </h2>
               <div className="tw-flex tw-justify-center tw-mb-4">
                 <div className="tw-relative tw-w-[200px] tw-h-[175px] tw-flex tw-items-center tw-justify-center">
                   <div className="tw-flex tw-justify-center tw-mb-6">
                     <img
                       src={upgradImg}
                       alt="Upgrade"
                       className="tw-w-36 tw-h-36 tw-object-contain"
                     />
                   </div>
                 </div>
               </div>
               <p className="tw-text-[18px] tw-text-[rgba(85, 85, 85, 0.33)] tw-mb-8 tw-leading-normal tw-px-2">
                 {upgradeMessage}
               </p>
               <button
                 onClick={() => setShowUpgradeModal(false)}
                 className="tw-w-[318px] tw-h-[48px] tw-py-3 tw-text-white tw-text-[16px] tw-font-medium tw-rounded-[6px] tw-transition-all tw-duration-200 hover:tw-opacity-90 hover:tw-shadow-lg"
                 style={{ background: "#0140c1" }}
               >
                 Upgrade Your Package
               </button>
             </div>
           </div>
         )}
    </div>
  );
};

export default BitInviteTable;
