import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { showToast } from '../../../../genriccomponents/techus-ToastNotification'
import FullPageLoader from '../../../../genriccomponents/loaders/FullPageLoader'
import {
  HealthCheckerUpload,
  GetCompanyUploadedUrl,
  CheckExistsHealthChecker,
  GetOneOrganization,
  GetOnePackage,
  countAccess,
} from '../../../../services/techus-services'
import usePermissions, { resolvePackageEnabled } from '../../../Common/usePermissions'
import {
  uploadFileToS3,
  getContractAuditCustomInputLimit,
  getContractAuditPdfUploadLimit,
  getContractAuditCustomInputLimitFromPackageDetail,
  getContractAuditPdfUploadLimitFromPackageDetail,
  getWordCount,
  getPlainText,
  getPermissionFlag,
} from './healthcheckerUtils'
import HealthCheckerNameField from './HealthCheckerNameField'
import HealthCheckerInputMethodCard from './HealthCheckerInputMethodCard'
import HealthCheckerInfoCards from './HealthCheckerInfoCards'
import HealthCheckerUpgradeModal from './HealthCheckerUpgradeModal'

const AddHealthChecker = () => {
  const navigate = useNavigate()
  const { permissions: contractAuditPerms, packagePermissions: contractAuditPackageEnabled } =
    usePermissions('contract_audit', 'contract_audit')
  const projectIdFromRedux = useSelector((s) => s?.project?.project_id)
  const projectUuidFromRedux = useSelector((s) => s?.project?.project_uuid)
  const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info)
  const projectId = projectIdFromRedux || localStorage.getItem('project_id')
  const projectUId = projectUuidFromRedux || localStorage.getItem('project_uuid')
  const organizationId = localStorage.getItem('organization_id')

  const getOrganizationUuid = () => {
    const direct =
      localStorage.getItem('organization_uuid') ||
      localStorage.getItem('organizationUuid') ||
      localStorage.getItem('org_uuid')
    if (direct) return direct
    for (const key of ['user_data', 'userData', 'userInfo', 'user']) {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        const uuid = parsed?.organization_uuid || parsed?.org_uuid || parsed?.organizationUuid || parsed?.data?.organization_uuid
        if (uuid) return uuid
      } catch { /* ignore */ }
    }
    return ''
  }

  const organizationUId = getOrganizationUuid()

  // ── State ──────────────────────────────────────────────────────────────────
  const [checkerName, setCheckerName] = useState('')
  const [nameError, setNameError] = useState('')
  const [nameChecking, setNameChecking] = useState(false)
  const [inputMethod, setInputMethod] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [customText, setCustomText] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [packageDetailWordLimit, setPackageDetailWordLimit] = useState(null)
  const [packageDetailPdfLimit, setPackageDetailPdfLimit] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  // ── Refs ───────────────────────────────────────────────────────────────────
  const fileInputRef = useRef(null)
  const nameCheckTimer = useRef(null)
  const nameCheckRequestRef = useRef(0)
  const selectedFilesRef = useRef([])
  const uploadedFilesRef = useRef([])
  const lastAllowedPdfStateRef = useRef({ selectedFiles: [], uploadedFiles: [] })

  // ── Derived limits ─────────────────────────────────────────────────────────
  const packageListWordLimit = useMemo(() => getContractAuditCustomInputLimit(packageList), [packageList])
  const packageListPdfLimit = useMemo(() => getContractAuditPdfUploadLimit(packageList), [packageList])
  const customInputWordLimit = packageDetailWordLimit ?? packageListWordLimit
  const pdfUploadFileLimit = packageDetailPdfLimit ?? packageListPdfLimit

  const canUsePdfInput =
    contractAuditPackageEnabled &&
    resolvePackageEnabled(packageList, 'audit_file') &&
    getPermissionFlag(contractAuditPerms, 'upload')

  const canUseCustomInput =
    contractAuditPackageEnabled &&
    resolvePackageEnabled(packageList, 'audit_input') &&
    getPermissionFlag(contractAuditPerms, 'custom_input')

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => () => { if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current) }, [])

  useEffect(() => {
    if (!organizationUId) return
    let cancelled = false
    const fetchLimits = async () => {
      try {
        const orgRaw = await GetOneOrganization({ organization_uuid: organizationUId })
        const orgRes = typeof orgRaw === 'string' ? JSON.parse(orgRaw) : orgRaw
        const packageUuid = orgRes?.data?.package_uuid
        if (!packageUuid) return
        const pkgRaw = await GetOnePackage({ package_uuid: packageUuid })
        const pkgRes = typeof pkgRaw === 'string' ? JSON.parse(pkgRaw) : pkgRaw
        if (!pkgRes?.valid) return
        if (!cancelled) {
          setPackageDetailWordLimit(getContractAuditCustomInputLimitFromPackageDetail(pkgRes?.data))
          setPackageDetailPdfLimit(getContractAuditPdfUploadLimitFromPackageDetail(pkgRes?.data))
        }
      } catch (err) {
        console.error('Failed to fetch contract audit package detail:', err)
      }
    }
    fetchLimits()
    return () => { cancelled = true }
  }, [organizationUId])

  useEffect(() => {
    selectedFilesRef.current = selectedFiles
    uploadedFilesRef.current = uploadedFiles
    if (!pdfUploadFileLimit || selectedFiles.length <= pdfUploadFileLimit) {
      lastAllowedPdfStateRef.current = { selectedFiles, uploadedFiles }
    }
  }, [pdfUploadFileLimit, selectedFiles, uploadedFiles])

  useEffect(() => {
    if (inputMethod !== 'pdf' || !pdfUploadFileLimit || selectedFiles.length <= pdfUploadFileLimit) return
    setSelectedFiles(lastAllowedPdfStateRef.current.selectedFiles)
    setUploadedFiles(lastAllowedPdfStateRef.current.uploadedFiles)
    showPdfLimitUpgrade(pdfUploadFileLimit)
  }, [inputMethod, pdfUploadFileLimit, selectedFiles])

  // ── Name validation ────────────────────────────────────────────────────────
  const formatCheckerName = (value = '') => value ? value.charAt(0).toUpperCase() + value.slice(1) : ''

  const checkCheckerNameExists = async (nameToCheck) => {
    const formatted = formatCheckerName(nameToCheck).trim()
    if (!formatted || !projectId) { setNameError(''); setNameChecking(false); return false }
    const reqId = ++nameCheckRequestRef.current
    setNameChecking(true)
    try {
      const raw = await CheckExistsHealthChecker({ checker_name: formatted, project_id: projectId })
      const res = typeof raw === 'string' ? JSON.parse(raw) : raw
      const exists =
        res?.exists === true || res?.data?.exists === true || /already exists/i.test(res?.message || '')
      if (reqId === nameCheckRequestRef.current) {
        setNameError(exists ? 'Health checker with this name already exists for this project.' : '')
      }
      return exists
    } catch (err) {
      console.error('CheckExistsHealthChecker error:', err)
      if (reqId === nameCheckRequestRef.current) setNameError('')
      return false
    } finally {
      if (reqId === nameCheckRequestRef.current) setNameChecking(false)
    }
  }

  const handleCheckerNameChange = (e) => {
    const formatted = formatCheckerName(e.target.value)
    setCheckerName(formatted)
    setNameError('')
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current)
    if (!formatted.trim()) { nameCheckRequestRef.current += 1; setNameChecking(false); return }
    nameCheckTimer.current = setTimeout(() => checkCheckerNameExists(formatted), 600)
  }

  // ── Upgrade modal helpers ──────────────────────────────────────────────────
  const showPdfLimitUpgrade = (limit = pdfUploadFileLimit) => {
    setUpgradeMessage(`Your current package allows up to ${limit} PDF file${limit > 1 ? 's' : ''} in Contract Audit upload. Upgrade your package to continue.`)
    setShowUpgradeModal(true)
  }

  // ── File upload ────────────────────────────────────────────────────────────
  const uploadSingleFile = async (file) => {
    if (!organizationUId) { showToast('error', 'Organization UUID not found. Please re-login.'); return }
    const tempKey = `${file.name}-${file.size}`
    setUploadedFiles((prev) => [...prev, { file, file_uuid: tempKey, uploading: true, error: null }])
    setSelectedFiles((prev) => [...prev, file])
    try {
      const urlRaw = await GetCompanyUploadedUrl({
        organization_uuid: organizationUId,
        file_name: file.name,
        document_category: 'perform_health_check',
      })
      const urlRes = typeof urlRaw === 'string' ? JSON.parse(urlRaw) : urlRaw
      if (!urlRes?.valid) throw new Error(urlRes?.message || 'Failed to get upload URL')
      const presignedUrl = urlRes.data?.upload_url
      if (!presignedUrl) throw new Error('No presigned URL returned')
      const serverFileUuid = urlRes.data?.file_uuid
      if (!serverFileUuid) throw new Error('No file_uuid in server response')
      await uploadFileToS3({ file, presignedUrl, onProgress: (pct) => console.log(`Uploading ${file.name}: ${pct}%`) })
      const raw = await HealthCheckerUpload({
        organization_uuid: organizationUId,
        file_uuid: serverFileUuid,
        project_id: projectId,
        original_file_name: file.name,
        file_size: file.size,
        document_category: 'perform_health_check',
      })
      const res = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (res?.valid) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file_uuid === tempKey
              ? { ...f, uploading: false, file_uuid: serverFileUuid, document_id: res?.document_id || res?.data?.document_id || null }
              : f
          )
        )
      } else {
        throw new Error(res?.message || 'Upload registration failed')
      }
    } catch (err) {
      const msg = err?.message || 'Upload failed'
      console.error('uploadSingleFile error →', err)
      setUploadedFiles((prev) =>
        prev.map((f) => f.file_uuid === `${file.name}-${file.size}` ? { ...f, uploading: false, error: msg } : f)
      )
      showToast('error', msg)
    }
  }

  const mergeFiles = (incoming) => {
    const arr = Array.isArray(incoming) ? incoming : Array.from(incoming)
    const current = selectedFilesRef.current
    const existingKeys = new Set(current.map((f) => `${f.name}-${f.size}`))
    const fresh = arr.filter((f) => !existingKeys.has(`${f.name}-${f.size}`))
    if (!fresh.length) return
    if (inputMethod === 'pdf' && pdfUploadFileLimit) {
      if (current.length + fresh.length > pdfUploadFileLimit) { showPdfLimitUpgrade(pdfUploadFileLimit); return }
    }
    fresh.forEach((f) => uploadSingleFile(f))
  }

  const handleFileInput = (e) => { if (e.target.files?.length) mergeFiles(e.target.files); e.target.value = '' }

  const handleFileRemove = (idx) => {
    const removed = selectedFiles[idx]
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
    setUploadedFiles((prev) =>
      prev.filter((f) => `${f.file.name}-${f.file.size}` !== `${removed.name}-${removed.size}`)
    )
  }

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf')
    if (files.length) mergeFiles(files)
    else showToast('error', 'Only PDF files are accepted.')
  }

  // ── Custom input callbacks ─────────────────────────────────────────────────
  const handleCustomInputChange = (html, nextCharCount, nextWordCount) => {
    setCustomText(html)
    setCharCount(nextCharCount)
    setWordCount(nextWordCount)
  }

  const handleLimitExceeded = (message) => {
    setUpgradeMessage(message)
    setShowUpgradeModal(true)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = checkerName.trim()
    if (!trimmedName) { setNameError('Health checker name is required.'); return }
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current)
    const nameExists = await checkCheckerNameExists(trimmedName)
    if (nameExists) return
    const plainText = getPlainText(customText).trim()
    if (inputMethod === 'pdf' && selectedFiles.length === 0) return showToast('error', 'Please upload at least one PDF.')
    if (inputMethod === 'txt' && !plainText) return showToast('error', 'Please enter contract text.')
    if (inputMethod === 'pdf' && pdfUploadFileLimit && selectedFiles.length > pdfUploadFileLimit) {
      showPdfLimitUpgrade(pdfUploadFileLimit)
      return
    }
    if (inputMethod === 'txt' && customInputWordLimit && getWordCount(plainText) > customInputWordLimit) {
      setUpgradeMessage(`Your current package allows up to ${customInputWordLimit} word${customInputWordLimit > 1 ? 's' : ''} in Custom Input. Upgrade your package to continue.`)
      setShowUpgradeModal(true)
      return
    }
    if (inputMethod === 'txt' || inputMethod === 'pdf') {
      try {
        setIsSubmitting(true)
        const raw = await countAccess({ organization_id: organizationId, module_name: 'contract_audit', sub_module_name: inputMethod })
        const res = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (!res?.allowed) {
          setUpgradeMessage(res?.message || 'You have reached your limit. Upgrade your package.')
          setShowUpgradeModal(true)
          return
        }
      } catch (err) {
        console.error('countAccess error:', err)
        showToast('error', 'Something went wrong')
        return
      } finally {
        setIsSubmitting(false)
      }
    }
    const submissionState = { checkerName: trimmedName, inputMethod, projectId, projectUId, organizationId, plainText }
    if (inputMethod === 'pdf') {
      const document_ids = uploadedFiles.filter((f) => f.document_id && !f.error && !f.uploading).map((f) => f.document_id)
      if (document_ids.length === 0) { showToast('error', 'No files uploaded successfully.'); return }
      submissionState.document_ids = document_ids
    }
    navigate(`/project/view/${projectUId}/contract-command/contract-audit/add/new/generate`, { state: submissionState })
  }

  const isDisabled =
    isSubmitting ||
    !checkerName.trim() ||
    !!nameError ||
    nameChecking ||
    !inputMethod ||
    (inputMethod === 'pdf' && selectedFiles.length === 0) ||
    (inputMethod === 'pdf' && uploadedFiles.some((f) => f.uploading)) ||
    (inputMethod === 'pdf' && uploadedFiles.some((f) => f.error)) ||
    (inputMethod === 'txt' && !getPlainText(customText).trim())

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="section">
      {isSubmitting && <FullPageLoader />}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />

      {/* Header */}
      <div className="header tw-mt-2 tw-flex tw-justify-between tw-items-center">
        <div className="tw-flex tw-items-center tw-gap-4">
          <button
            type="button"
            onClick={() => navigate(`/project/view/${projectUId}/contract-command/contract-audit`)}
            className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-[#b3bcce] tw-rounded-lg hover:tw-bg-[#0140c1] tw-transition-colors"
          >
            <i className="icon-Previous tw-text-white tw-text-lg" />
          </button>
          <div>
            <p className="tw-text-[#535353] tw-text-sm">Contract Command /</p>
            <h1 className="tw-text-[#000] tw-text-[20px] tw-font-bold">Contract Audit</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tw-mt-5 tw-flex tw-flex-col tw-gap-5">
        <HealthCheckerNameField
          checkerName={checkerName}
          nameError={nameError}
          nameChecking={nameChecking}
          onChange={handleCheckerNameChange}
          onBlur={() => {
            if (!checkerName.trim()) return
            if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current)
            checkCheckerNameExists(checkerName)
          }}
        />

        <HealthCheckerInputMethodCard
          inputMethod={inputMethod}
          onInputMethodChange={setInputMethod}
          canUsePdfInput={canUsePdfInput}
          canUseCustomInput={canUseCustomInput}
          fileInputRef={fileInputRef}
          selectedFiles={selectedFiles}
          uploadedFiles={uploadedFiles}
          isDragging={isDragging}
          pdfUploadFileLimit={pdfUploadFileLimit}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileInput={handleFileInput}
          onFileRemove={handleFileRemove}
          customText={customText}
          charCount={charCount}
          wordCount={wordCount}
          customInputWordLimit={customInputWordLimit}
          showUpgradeModal={showUpgradeModal}
          onCustomInputChange={handleCustomInputChange}
          onLimitExceeded={handleLimitExceeded}
          isDisabled={isDisabled}
        />

        <HealthCheckerInfoCards canUsePdfInput={canUsePdfInput} canUseCustomInput={canUseCustomInput} />
      </form>

      {showUpgradeModal && (
        <HealthCheckerUpgradeModal
          message={upgradeMessage}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  )
}

export default AddHealthChecker
