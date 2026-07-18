import React, { useState, useMemo, useEffect } from 'react'
import { MoreHorizontal } from 'lucide-react'
import Dropdown from '../../Common/DropDown'
import CustomDataTable from '../../../genriccomponents/ReactTable'
import { useNavigate, useLocation } from 'react-router-dom'
import ActionMenu from '../../../genriccomponents/ActionMenu'
import NoDataFound from '../../../genriccomponents/NoDataFound'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import FullPageLoader from '../../../genriccomponents/loaders/FullPageLoader'
import TextWithTooltip from '../../Common/ToolTip'
import { GetCompanyDocumentList } from '../../../services/techus-services'
import { bytesToMB, capitalizeFirstLetter, formatDateTime } from '../../../utils/commonUtils'
import { ShimmerTable } from 'react-shimmer-effects'
import DeleteModal from '../../../genriccomponents/DeleteModal'
import usePermissions from '../../Common/usePermissions'
import LogoTab from './LogoTab'
import { countAccess } from '../../../services/techus-services'
import upgradImg from "/src/assets/Images/no_data_images/upgrade_1.webp";
import { useSelector } from 'react-redux'
import RfpAnalyzerTab from './RfpAnalyzerTab'
import TakeoffEstimationTab from './Takeoffestimation';

const StatusBadge = ({ status }) => {
  const config = {
    Processing: {
      bg: 'tw-bg-[#fef3f1]',
      border: 'tw-border-[#fdd4c1]',
      text: 'tw-text-[#c16217]',
      icon: 'icon-Timeline'
    },
    Processed: {
      bg: 'tw-bg-[#f1fdf4]',
      border: 'tw-border-[#c1f9d5]',
      text: 'tw-text-[#17803d]',
      icon: 'icon-Got-it'
    },
    Uploaded: {
      bg: 'tw-bg-[#f1f5fd]',
      border: 'tw-border-[#c1d4f9]',
      text: 'tw-text-[#1740c1]',
      icon: 'icon-Got-it'
    },
    Failed: {
      bg: 'tw-bg-[#fdf1f1]',
      border: 'tw-border-[#f9c1c1]',
      text: 'tw-text-[#c11717]',
      icon: 'icon-Failed'
    }
  }

  const c = config[status] || config.Uploaded
  return (
    <span
      className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1 tw-rounded-full tw-text-[13px] tw-font-medium tw-border ${c.bg} ${c.border} ${c.text}`}
    >
      {status === 'Processed' || status === 'Uploaded' || status === 'Failed' ? (
        <span className='tw-flex tw-items-center tw-justify-center'>
          <i className={`${c.icon} tw-text-[14px] tw-font-bold`} />
        </span>
      ) : (
        <i className={`${c.icon} tw-text-[14px]`} />
      )}
      {status}
    </span>
  )
}

const CompanyKnowledgeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortByName, setSortByName] = useState('')
  const [selectedDateTime, setSelectedDateTime] = useState(null)
  const navigate = useNavigate()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info)

  const TABS = [
    { key: 'Logo', icon: 'icon-image' },
    { key: 'Proposal Drafter', icon: 'icon-Document' },
    { key: 'Bid Intelligence', icon: 'icon-AI-line' },
    { key: 'Takeoff & Estimation', icon: 'icon-Takeoff--Estimation' },
  ]

  const TAB_TO_SUB_MODULE = {
    'Proposal Drafter': 'proposal_drafting',
    'Bid Intelligence': 'rfp_analyzer',
    'Takeoff & Estimation': 'takeoff',
  }

  const TAB_PACKAGE_KEY = {
    'Proposal Drafter': packageList?.org_kb?.children?.kb_subcategory?.children?.kb_proposal?.enabled,
    'Bid Intelligence': packageList?.org_kb?.children?.kb_subcategory?.children?.kb_bid?.enabled,
    'Takeoff & Estimation': packageList?.org_kb?.children?.kb_subcategory?.children?.kb_takeoff?.enabled,
    'Logo': true,
  }

  const statusMap = {
    All: null,
    Upload: 1,
    Processing: 2,
    Processed: 3,
    Failed: 0
  }

  const location = useLocation()
  const organization_uuid = localStorage.getItem('organization_uuid')
  const organization_id = localStorage.getItem('organization_id')
  const { permissions, packagePermissions } = usePermissions('company_knowledge_management', 'org_kb')

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Logo')
  const [properList, setProperList] = useState([])

  const compList = async () => {
    setIsInitialLoad(true)
    const resp = await GetCompanyDocumentList(organization_uuid)
    const parsedResp = JSON.parse(resp)
    if (parsedResp.valid) {
      setProperList(parsedResp.data)
    } else {
      setProperList([])
    }
    setIsInitialLoad(false)
  }

  const filteredData = useMemo(() => {
    const tabTypeMap = {
      'Proposal Drafter': ['proposal_drafting', 'Proposal Drafting'],
      'Bid Intelligence': ['rfp_analyzer', 'RFP Analyzer'],
      'Takeoff & Estimation': ['takeoff', 'Takeoff & Estimation'],
    }

    const allowedTypes = tabTypeMap[activeTab] || []
    let result = properList.filter(
      file =>
        allowedTypes.includes(file.type) ||
        allowedTypes.includes(file.document_category)
    )
    if (statusFilter !== 'All') {
      result = result.filter(r => r.status === statusMap[statusFilter])
    }
    if (searchTerm.trim()) {
      result = result.filter(r =>
        r.filename.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (selectedDateTime) {
      const selectedDateOnly = new Date(selectedDateTime)
      selectedDateOnly.setHours(0, 0, 0, 0)
      result = result.filter(item => {
        if (!item.uploaded_date) return false
        const itemDate = new Date(item.uploaded_date)
        if (isNaN(itemDate.getTime())) return false
        const itemDateOnly = new Date(itemDate)
        itemDateOnly.setHours(0, 0, 0, 0)
        return itemDateOnly >= selectedDateOnly
      })
    }
    if (sortByName === 'Name (A-Z)') {
      result = [...result].sort((a, b) => (a.filename || '').localeCompare(b.filename || ''))
    } else if (sortByName === 'Name (Z-A)') {
      result = [...result].sort((a, b) => (b.filename || '').localeCompare(a.filename || ''))
    }
    return result
  }, [activeTab, searchTerm, statusFilter, sortByName, selectedDateTime, properList, permissions])

  useEffect(() => {
    compList()
  }, [])

  // const TYPE_LABEL_MAP = {
  //   proposal_drafting: 'Proposal Drafting',
  //   rfp_analyzer: 'RFP Analyzer',
  //   takeoff: 'Takeoff & Estimation',
  //   others: 'Others'
  // }

  const STATUS_MAP = {
    1: 'Uploaded',
    2: 'Processing',
    3: 'Processed',
    0: 'Failed'
  }

  const columns = useMemo(
    () => [
      {
        name: 'NAME',
        selector: r => r.filename,
        sortable: true,
        width: '18%',
        cell: r => (
          <span
            className='tw-text-[15px] tw-my-2 tw-text-wrap tw-text-[#585858] tw-cursor-pointer hover:tw-text-blue-600'
            onClick={(e) => {
              e.stopPropagation()
              navigate(
                organization_uuid ? `/knowledge-base/preview` : '/admin/knowledge-base/preview',
                { state: { viewData: r, category: activeTab, data: r } }
              )
            }}
          >
            {r.filename ? capitalizeFirstLetter(r.filename) : '-'}
          </span>
        )
      },
      {
        name: 'TYPE',
        selector: r => r.file_extension,
        width: '10%',
        sortable: true,
        cell: r => <span className='tw-uppercase'>{r.file_extension}</span>
      },
      {
        name: 'SIZE',
        selector: r => bytesToMB(r.size),
        width: '12%',
        sortable: true,
        cell: r => <span>{`${bytesToMB(r.size)}MB`}</span>
      },
      {
        name: 'UPLOADED BY',
        selector: r => r.uploadedBy,
        width: '16%',
        cell: r => <TextWithTooltip text={r.uploaded_by} />,
        sortable: true
      },
      {
        name: 'UPLOADED AT',
        selector: r => r.uploaded_date ? new Date(r.uploaded_date).getTime() : 0,
        width: '16%',
        cell: r => <TextWithTooltip text={formatDateTime(r.uploaded_date)} />,
        sortable: true
      },
      {
        name: 'STATUS',
        width: '16%',
        sortable: true,
        cell: r => <StatusBadge status={STATUS_MAP[r.status]} />
      },
      {
        name: 'ACTIONS',
        center: true,
        width: '11%',
        cell: row => (
          <ActionMenu
            onView={() => {
              navigate(
                organization_uuid ? `/knowledge-base/preview` : '/admin/knowledge-base/preview',
                { state: { viewData: row, category: activeTab, data: row } }
              )
            }}
            onDelete={() => {
              setItemToDelete(row)
              setIsDeleteModalOpen(true)
            }}
            showEdit={false}
            showDelete={permissions?.delete}
            showView={permissions?.view}
            deleteDisabled={true}
          />
        )
      }
    ],
    [navigate, activeTab, permissions]
  )

  const tableCustomStyles = {
    table: { style: { backgroundColor: 'white' } },
    headRow: {
      style: {
        backgroundColor: '#F9FAFB',
        borderTop: '1px solid #EAECF0',
        borderBottom: '1px solid #EAECF0',
        minHeight: '44px'
      }
    },
    headCells: {
      style: {
        fontSize: '15px',
        fontWeight: '500',
        color: '#6e7178',
        paddingLeft: '24px',
        paddingRight: '24px',
        textTransform: 'uppercase'
      }
    },
    rows: {
      style: {
        minHeight: '58px',
        borderBottom: '1px solid #EAECF0',
        transition: 'background-color 0.15s ease',
        '&:last-of-type': { borderBottom: 'none' },
        '&:hover': { backgroundColor: '#f8faff', cursor: 'pointer' },
      },
    },
    cells: {
      style: {
        paddingLeft: '24px',
        paddingRight: '24px',
        fontSize: '15px',
        color: '#585858'
      }
    }
  }

  const handleConfirmDelete = async () => {
    try {
      setIsDeleteModalOpen(false)
      setIsPageLoading(true)
      if (itemToDelete) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await compList()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsPageLoading(false)
      setItemToDelete(null)
    }
  }

  useEffect(() => {
    if (TAB_PACKAGE_KEY[activeTab] === false) {
      const firstEnabled = TABS.find(({ key }) => TAB_PACKAGE_KEY[key] !== false)
      if (firstEnabled) setActiveTab(firstEnabled.key)
    }
  }, [packageList])

  const isInitialEmpty = properList.length === 0
  const isFilteredEmpty = filteredData.length === 0 && properList.length > 0
  void packagePermissions
  return (
    <div className='tw-min-h-screen'>
      {isPageLoading && <FullPageLoader />}

      {/* ── Page header ── */}
      <div className='tw-p-[20px_25px] tw-bg-white'>
        <h1 className='tw-text-[20px] tw-font-bold tw-text-[#002149]'>
          Knowledge Base
        </h1>
        <p className='tw-text-[14px] tw-text-[#1e293b] tw-tracking-[0.31px]'>
          Upload and organize company documents so the AI can deliver personalized, context-aware outputs
        </p>
      </div>

      <div>
        {/* ── Tabs ── */}
        <div className='tw-border tw-border-[#e0e0e0] tw-bg-white'>
          <div className='tw-flex tw-justify-start tw-gap-2'>
            {TABS.filter(({ key }) => TAB_PACKAGE_KEY[key] !== false).map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`tw-w-auto tw-px-6 tw-justify-center tw-flex tw-items-center tw-gap-3 tw-py-4 tw-text-[15px] tw-font-medium tw-transition-colors tw-border-b-2 ${
                  activeTab === key
                    ? 'tw-border-[#0140c1] tw-text-[#0140c1]'
                    : 'tw-border-transparent tw-text-[#6e7178]'
                }`}
              >
                {icon === 'dots' ? (
                  <MoreHorizontal
                    className={activeTab === key ? 'tw-text-[#0140c1]' : ''}
                    size={18}
                  />
                ) : (
                  <i className={`${icon} tw-text-[20px]`} />
                )}
                <span>{key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'Logo' ? (

          <LogoTab organization_uuid={organization_uuid} />

        ) : activeTab === 'Bid Intelligence' ? (

          <div className='tw-w-full tw-px-[30px] tw-py-[25px] !tw-pb-[25px]'>
            <RfpAnalyzerTab />
          </div>

        ) : activeTab === 'Takeoff & Estimation' ? (

          <TakeoffEstimationTab />

        ) : (
          <>
            {/* Title + Upload button */}
            <div className='tw-flex tw-justify-between tw-items-center tw-p-[25px_30px_30px]'>
              <h2 className='tw-text-[18px] tw-font-bold tw-text-[#000]'>
                {activeTab}
              </h2>

              {permissions?.upload && (
                <button
                  onClick={async () => {
                    try {
                      setIsPageLoading(true)
                      const raw = await countAccess({
                        organization_id: organization_id,
                        module_name: 'company_document',
                        sub_module_name: TAB_TO_SUB_MODULE[activeTab] ?? ''
                      })
                      const response = typeof raw === 'string' ? JSON.parse(raw) : raw
                      if (response?.allowed) {
                        navigate(
                          organization_uuid
                            ? `/knowledge-base/upload`
                            : `/admin/knowledge-base/upload`,
                          { state: { category: activeTab } }
                        )
                      } else {
                        setUpgradeMessage(response?.message)
                        setShowUpgradeModal(true)
                      }
                    } catch (err) {
                      console.error('countAccess error:', err)
                    } finally {
                      setIsPageLoading(false)
                    }
                  }}
                  className='tw-flex tw-items-center tw-gap-2 tw-bg-[#0140c1] hover:tw-bg-blue-700 tw-text-white tw-px-4 tw-py-2.5 tw-rounded-[5px] tw-text-[16px] tw-font-normal tw-transition-all'
                >
                  <i className='icon-Upload-Document tw-text-[18px]' />
                  Upload Document
                </button>
              )}
            </div>

            {/* Document table */}
            <div className='tw-w-full tw-px-[30px] !tw-pb-[25px]'>
              {isInitialLoad ? (
                <div className='tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4'>
                  <ShimmerTable row={8} col={8} />
                </div>
              ) : (
                <CustomDataTable
                  columns={columns}
                  data={filteredData}
                  customStyles={tableCustomStyles}
                  enablePagination={true}
                  defaultPerPage={10}
                  noDataComponent={
                    <NoDataFound
                      title='No Documents Found'
                      description={
                        isFilteredEmpty
                          ? 'No documents match your search or filter criteria.'
                          : 'There are no documents uploaded in this category yet.'
                      }
                      buttonLabel={null}
                    />
                  }
                  searchTerm={searchTerm}
                  onSearchChange={isInitialEmpty ? null : setSearchTerm}
                  searchPlaceholder='Search Document Name'
                  filterComponent={
                    isInitialEmpty ? null : (
                      <>
                        <Dropdown
                          options={['All', 'Upload', 'Processing', 'Processed', 'Failed']}
                          value={statusFilter}
                          onChange={(v) => setStatusFilter(v || 'All')}
                          width='tw-w-32'
                          placeholder='All'
                        />
                        <Dropdown
                          options={['Default', 'Name (A-Z)', 'Name (Z-A)']}
                          value={sortByName === 'Default' || sortByName === '' ? '' : sortByName}
                          onChange={setSortByName}
                          width='tw-w-44'
                          placeholder='Sort by Name'
                        />
                        <div className='tw-relative tw-w-64'>
                          <DatePicker
                            selected={selectedDateTime}
                            onChange={date => setSelectedDateTime(date)}
                            dateFormat='MMM d, yyyy'
                            isClearable
                            placeholderText='Date'
                            portalId='root-portal'
                            popperPlacement='bottom-end'
                            className='tw-w-full tw-h-10 tw-pl-10 tw-pr-4 tw-border tw-border-[#e0e0e0] tw-rounded-[5px] tw-text-sm tw-outline-none focus:tw-border-blue-500'
                          />
                          <i className='icon-Calendar tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400 tw-text-[18px]' />
                        </div>
                      </>
                    )
                  }
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Delete modal ── */}
      {isDeleteModalOpen && itemToDelete && (
        <DeleteModal
          action='delete'
          entity='document'
          icon='icon-Document'
          onClose={() => {
            setIsDeleteModalOpen(false)
            setItemToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* ── Upgrade modal ── */}
      {showUpgradeModal && (
        <div className='tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9999] tw-flex tw-items-center tw-justify-center'>
          <div className='tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[750px] tw-h-[569px] tw-px-[74px] tw-pt-[69px] tw-pb-10 tw-relative tw-text-center'>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className='tw-absolute tw-top-4 tw-right-4 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-gray-200 tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-gray-50 tw-transition-colors'
            >
              <i className='icon-Close tw-text-[14px]' />
            </button>
            <h2 className='tw-text-[30px] tw-font-bold tw-text-[#000000] tw-mb-8 tw-leading-snug'>
              Unlock More with an Upgrade!
            </h2>
            <div className='tw-flex tw-justify-center tw-mb-4'>
              <div className='tw-relative tw-w-[200px] tw-h-[175px] tw-flex tw-items-center tw-justify-center'>
                <div className='tw-flex tw-justify-center tw-mb-6'>
                  <img src={upgradImg} alt='Upgrade' className='tw-w-36 tw-h-36 tw-object-contain' />
                </div>
              </div>
            </div>
            <p className='tw-text-[18px] tw-text-[rgba(85,85,85,0.33)] tw-mb-8 tw-leading-normal tw-px-2'>
              {upgradeMessage}
            </p>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className='tw-w-[318px] tw-h-[48px] tw-py-3 tw-text-white tw-text-[16px] tw-font-medium tw-rounded-[6px] tw-transition-all tw-duration-200 hover:tw-opacity-90 hover:tw-shadow-lg'
              style={{ background: '#0140c1' }}
            >
              Upgrade Your Package
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompanyKnowledgeManagement
