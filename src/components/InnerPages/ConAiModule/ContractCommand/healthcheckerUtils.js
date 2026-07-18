export const uploadFileToS3 = ({ file, presignedUrl, onProgress }) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`S3 upload failed (status ${xhr.status})`))
    })
    xhr.addEventListener('error', () => reject(new Error('Network error during S3 upload')))
    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/pdf')
    xhr.send(file)
  })

export const quillFormats = ['bold', 'italic', 'underline', 'list', 'bullet', 'align', 'link']

const CUSTOM_INPUT_LIMIT_KEYS = ['txt', 'custom_input', 'custom', 'text_input']
const PDF_UPLOAD_LIMIT_KEYS = ['pdf', 'custom_file_upload', 'file_upload', 'upload_pdf']

const getPositiveCount = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const getNodeCount = (node) => {
  if (!node || typeof node !== 'object') return null
  const fields = [node.item_count, node.count, node.word_count, node.words_count, node.limit, node.max_count, node.value]
  for (const field of fields) {
    const count = getPositiveCount(field)
    if (count) return count
  }
  return null
}

const looksLikeCustomInputNode = (key, node) => {
  const k = String(key || '').toLowerCase()
  if (CUSTOM_INPUT_LIMIT_KEYS.includes(k)) return true
  const text = [node?.name, node?.label, node?.title, node?.display_text_2, node?.sub_module_name]
    .filter(Boolean).join(' ').toLowerCase()
  return text.includes('custom input') || text.includes('text input') || text.includes('word')
}

const findCustomInputLimit = (node) => {
  if (!node || typeof node !== 'object') return null
  for (const key of CUSTOM_INPUT_LIMIT_KEYS) {
    const count = getNodeCount(node?.children?.[key] || node?.[key])
    if (count) return count
  }
  const entries = node?.children && typeof node.children === 'object'
    ? Object.entries(node.children)
    : Object.entries(node)
  for (const [key, value] of entries) {
    if (!value || typeof value !== 'object') continue
    if (looksLikeCustomInputNode(key, value)) {
      const count = getNodeCount(value)
      if (count) return count
    }
    const nested = findCustomInputLimit(value)
    if (nested) return nested
  }
  return null
}

export const getContractAuditCustomInputLimit = (packageList) =>
  findCustomInputLimit(packageList?.contract_command?.children?.contract_audit)

const looksLikePdfUploadNode = (key, node) => {
  const k = String(key || '').toLowerCase()
  if (PDF_UPLOAD_LIMIT_KEYS.includes(k)) return true
  const text = [node?.name, node?.label, node?.title, node?.display_text_2, node?.sub_module_name]
    .filter(Boolean).join(' ').toLowerCase()
  return text.includes('custom file upload') || text.includes('upload pdf') || text.includes('file count')
}

const findPdfUploadLimit = (node) => {
  if (!node || typeof node !== 'object') return null
  for (const key of PDF_UPLOAD_LIMIT_KEYS) {
    const count = getNodeCount(node?.children?.[key] || node?.[key])
    if (count) return count
  }
  const entries = node?.children && typeof node.children === 'object'
    ? Object.entries(node.children)
    : Object.entries(node)
  for (const [key, value] of entries) {
    if (!value || typeof value !== 'object') continue
    if (looksLikePdfUploadNode(key, value)) {
      const count = getNodeCount(value)
      if (count) return count
    }
    const nested = findPdfUploadLimit(value)
    if (nested) return nested
  }
  return null
}

export const getContractAuditPdfUploadLimit = (packageList) =>
  findPdfUploadLimit(packageList?.contract_command?.children?.contract_audit)

const normalizeText = (value = '') => String(value).trim().toLowerCase()

const hasChildren = (node) => {
  if (!node || typeof node !== 'object') return false
  if (Array.isArray(node.children)) return node.children.length > 0
  if (node.children && typeof node.children === 'object') return Object.keys(node.children).length > 0
  return false
}

const findFeatureNode = (node, predicate) => {
  if (!node) return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const match = findFeatureNode(item, predicate)
      if (match) return match
    }
    return null
  }
  if (typeof node !== 'object') return null
  if (predicate(node)) return node
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const match = findFeatureNode(child, predicate)
      if (match) return match
    }
  } else if (node.children && typeof node.children === 'object') {
    for (const child of Object.values(node.children)) {
      const match = findFeatureNode(child, predicate)
      if (match) return match
    }
  }
  return null
}

export const getContractAuditCustomInputLimitFromPackageDetail = (packageDetail) => {
  const root = findFeatureNode(
    packageDetail?.features,
    (node) => normalizeText(node?.name) === 'contract audit' && hasChildren(node)
  )
  if (!root) return null
  const node = findFeatureNode(
    root,
    (n) => normalizeText(n?.name).includes('custom input') || normalizeText(n?.display_text_2).includes('word')
  )
  return getNodeCount(node)
}

export const getContractAuditPdfUploadLimitFromPackageDetail = (packageDetail) => {
  const root = findFeatureNode(
    packageDetail?.features,
    (node) => normalizeText(node?.name) === 'contract audit' && hasChildren(node)
  )
  if (!root) return null
  const node = findFeatureNode(
    root,
    (n) =>
      normalizeText(n?.name).includes('custom file upload') ||
      normalizeText(n?.name).includes('upload pdf') ||
      normalizeText(n?.display_text_2).includes('file count')
  )
  return getNodeCount(node)
}

export const getWordCount = (text = '') => {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

export const getPlainText = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.innerText || ''
}

const isPermissionEnabled = (value) => {
  if (value === true || value === 1) return true
  if (!value || typeof value !== 'object') return false
  if (value.enabled != null) return value.enabled !== false && value.enabled !== 0
  if (value.allowed != null) return value.allowed === true || value.allowed === 1
  if (value.selected != null) return value.selected === true || value.selected === 1
  if (value.value != null && typeof value.value !== 'object') return Boolean(value.value)
  return false
}

export const getPermissionFlag = (permissions, key) => {
  if (!permissions || !key) return false
  return isPermissionEnabled(permissions?.[key]) || isPermissionEnabled(permissions?.children?.[key])
}
