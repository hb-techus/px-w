
import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { addLogo } from '../../../services/techus-services'
import CONFIG from '../../../config/config'


const CropModal = ({ imageSrc, onCancel, onSave, isSaving }) => {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)

  const CANVAS_W = 680
  const CANVAS_H = 370
  const MIN_CROP_W = 60
  const MIN_CROP_H = 60
  const HANDLE_SIZE = 6

  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [imgLoaded, setImgLoaded] = useState(false)

  const [crop, setCrop] = useState({
    x: 175,
    y: 95,
    width: 330,
    height: 180
  })

  const [draggingCrop, setDraggingCrop] = useState(false)
  const [draggingImage, setDraggingImage] = useState(false)
  const [resizing, setResizing] = useState(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const baseScale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height)
      const iw = img.width * baseScale
      const ih = img.height * baseScale

      setOffset({
        x: (CANVAS_W - iw) / 2,
        y: (CANVAS_H - ih) / 2
      })
      setImgLoaded(true)
    }
    img.src = imageSrc
  }, [imageSrc])

  const clampCrop = (next) => {
    let { x, y, width, height } = next

    width = Math.max(MIN_CROP_W, width)
    height = Math.max(MIN_CROP_H, height)

    x = Math.max(0, Math.min(x, CANVAS_W - width))
    y = Math.max(0, Math.min(y, CANVAS_H - height))

    return { x, y, width, height }
  }

  const drawHandles = (ctx, x, y, width, height) => {
    const half = HANDLE_SIZE / 2
    const points = [
      [x, y],
      [x + width / 2, y],
      [x + width, y],
      [x, y + height / 2],
      [x + width, y + height / 2],
      [x, y + height],
      [x + width / 2, y + height],
      [x + width, y + height]
    ]

    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#0140c1'
    ctx.lineWidth = 1

    points.forEach(([px, py]) => {
      ctx.beginPath()
      ctx.rect(px - half, py - half, HANDLE_SIZE, HANDLE_SIZE)
      ctx.fill()
      ctx.stroke()
    })
  }

  const draw = (currentOffset, currentZoom, currentCrop) => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    const baseScale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height)
    const scale = baseScale * currentZoom
    const iw = img.width * scale
    const ih = img.height * scale

    ctx.drawImage(img, currentOffset.x, currentOffset.y, iw, ih)

    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    const { x, y, width, height } = currentCrop

    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()
    ctx.clearRect(x, y, width, height)
    ctx.drawImage(img, currentOffset.x, currentOffset.y, iw, ih)
    ctx.restore()

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)

    drawHandles(ctx, x, y, width, height)
  }

  useEffect(() => {
    if (imgLoaded) {
      draw(offset, zoom, crop)
    }
  }, [imgLoaded, offset, zoom, crop])

  const pointInRect = (mx, my, rect) => {
    return (
      mx >= rect.x &&
      mx <= rect.x + rect.width &&
      my >= rect.y &&
      my <= rect.y + rect.height
    )
  }

  const getHandle = (mx, my) => {
    const { x, y, width, height } = crop
    const s = 14

    const handles = [
      { name: 'tl', x, y },
      { name: 'top', x: x + width / 2, y },
      { name: 'tr', x: x + width, y },
      { name: 'left', x, y: y + height / 2 },
      { name: 'right', x: x + width, y: y + height / 2 },
      { name: 'bl', x, y: y + height },
      { name: 'bottom', x: x + width / 2, y: y + height },
      { name: 'br', x: x + width, y: y + height }
    ]

    for (const h of handles) {
      if (Math.abs(mx - h.x) <= s && Math.abs(my - h.y) <= s) {
        return h.name
      }
    }

    return null
  }

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const handle = getHandle(mx, my)

    if (handle) {
      setResizing(handle)
      setDragStart({ x: mx, y: my })
      return
    }

    if (pointInRect(mx, my, crop)) {
      setDraggingCrop(true)
      setDragStart({
        x: mx - crop.x,
        y: my - crop.y
      })
      return
    }

    setDraggingImage(true)
    setDragStart({
      x: mx - offset.x,
      y: my - offset.y
    })
  }

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    if (resizing) {
      setCrop((prev) => {
        let { x, y, width, height } = prev
        const right = x + width
        const bottom = y + height

        if (resizing === 'right') {
          width = mx - x
        } else if (resizing === 'left') {
          x = mx
          width = right - mx
        } else if (resizing === 'bottom') {
          height = my - y
        } else if (resizing === 'top') {
          y = my
          height = bottom - my
        } else if (resizing === 'br') {
          width = mx - x
          height = my - y
        } else if (resizing === 'bl') {
          x = mx
          width = right - mx
          height = my - y
        } else if (resizing === 'tr') {
          width = mx - x
          y = my
          height = bottom - my
        } else if (resizing === 'tl') {
          x = mx
          y = my
          width = right - mx
          height = bottom - my
        }

        return clampCrop({ x, y, width, height })
      })
      return
    }

    if (draggingCrop) {
      setCrop((prev) =>
        clampCrop({
          ...prev,
          x: mx - dragStart.x,
          y: my - dragStart.y
        })
      )
      return
    }

    if (draggingImage) {
      setOffset({
        x: mx - dragStart.x,
        y: my - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setResizing(null)
    setDraggingCrop(false)
    setDraggingImage(false)
  }

  const handleZoom = (e) => {
    const nextZoom = parseFloat(e.target.value)
    const img = imgRef.current
    if (!img) return

    const baseScale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height)
    const oldScale = baseScale * zoom
    const newScale = baseScale * nextZoom

    const cx = crop.x + crop.width / 2
    const cy = crop.y + crop.height / 2

    setOffset((prev) => ({
      x: cx - (cx - prev.x) * (newScale / oldScale),
      y: cy - (cy - prev.y) * (newScale / oldScale)
    }))

    setZoom(nextZoom)
  }

  const getCroppedBase64 = () => {
    const img = imgRef.current
    if (!img) return null

    const baseScale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height)
    const scale = baseScale * zoom
    const iw = img.width * scale
    const ih = img.height * scale

    const out = document.createElement('canvas')
    out.width = crop.width
    out.height = crop.height

    const ctx = out.getContext('2d')
    ctx.drawImage(
      img,
      offset.x - crop.x,
      offset.y - crop.y,
      iw,
      ih
    )

    return out.toDataURL('image/png')
  }

  return (
    <div className='tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/40'>
      <div className='tw-bg-white tw-rounded-xl tw-shadow-2xl tw-w-[740px] tw-p-6 tw-relative'>
        <div className='tw-flex tw-justify-between tw-items-center tw-mb-4'>
          <h2 className='tw-text-[18px] tw-font-semibold tw-text-[#1a1a1a]'>Crop Your Logo</h2>
          <button onClick={onCancel} className='tw-text-gray-400 hover:tw-text-gray-600 tw-text-xl tw-leading-none'>✕</button>
        </div>

        <div className='tw-rounded-lg tw-overflow-hidden'>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              display: 'block',
              background: '#888',
              cursor: 'crosshair'
            }}
          />
        </div>

        <div className='tw-mt-5 tw-mb-6'>
          <label className='tw-block tw-text-[14px] tw-text-[#555] tw-mb-2'>Zoom</label>
          <input
            type='range'
            min='1'
            max='3'
            step='0.01'
            value={zoom}
            onChange={handleZoom}
            className='tw-w-full tw-accent-[#0140c1]'
          />
        </div>

        <div className='tw-flex tw-justify-end tw-gap-3'>
          <button
            onClick={onCancel}
            className='tw-px-5 tw-py-2.5 tw-rounded-[6px] tw-border tw-border-[#d0d5dd] tw-text-[14px] tw-text-[#344054]'
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const b = getCroppedBase64()
              if (b) onSave(b)
            }}
            disabled={isSaving || !imgLoaded}
            className='tw-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2.5 tw-rounded-[6px] tw-bg-[#0140c1] tw-text-white tw-text-[14px] tw-font-medium disabled:tw-opacity-60'
          >
            {isSaving ? 'Saving...' : 'Save Logo'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── Main Logo Tab ─────────────────────────────────────────────────────────────
const LogoTab = () => {
  const organizationImage = useSelector((s) => s?.auth?.user?.[0]?.organization_image)

  const remoteImageUrl = organizationImage
    ? `${CONFIG.VITE_AWS_ENDPOINT}/organization_images/${organizationImage}`
    : null

  const [view, setView] = useState(remoteImageUrl ? 'saved' : 'upload')
  const [displaySrc, setDisplaySrc] = useState(remoteImageUrl)
  const [rawImageSrc, setRawImageSrc] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // ── 1. One shared file input ref — used by both Upload view and Edit button
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (remoteImageUrl && !displaySrc) {
      setDisplaySrc(remoteImageUrl)
      setView('saved')
    }
  }, [remoteImageUrl])

  // ── 2. Read file → base64 → open crop modal
  const readFile = (file) => {
    if (!file) return
 const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
const allowedExtensions = ['.png', '.jpg', '.jpeg']
const fileExtension = '.' + file.name.split('.').pop().toLowerCase()

if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) return
   if (file.size > 50 * 1024 * 1024) {
  alert('File size exceeds 20MB. Please upload a smaller image.')
  return
}
    const reader = new FileReader()
    reader.onload = (e) => {
      setRawImageSrc(e.target.result)
      setView('crop')
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    readFile(e.dataTransfer.files[0])
  }

  // ── 3. Edit button: just trigger the file picker — no CORS, no canvas tricks
  const handleEditClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''   // reset so same file can be re-picked
      fileInputRef.current.click()
    }
  }

  const handleSaveLogo = async (croppedBase64) => {
    setIsSaving(true)
    try {
      const org_id = localStorage.getItem('organization_id')
      await addLogo({ organization_id: org_id, imgsrc: croppedBase64 })
      setDisplaySrc(croppedBase64)
      setView('saved')
    } catch (err) {
      console.error('Logo save failed', err)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Upload View ────────────────────────────────────────────────────────────
  const UploadView = () => (
    <div className='tw-flex tw-items-center tw-justify-center tw-py-10'>
      <div className='tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-[#e8eaed] tw-w-[760px] tw-p-10 tw-flex tw-flex-col tw-items-center'>
        <h2 className='tw-text-[20px] tw-font-bold tw-text-[#1a1a1a] tw-mb-1'>Upload Company Logo</h2>
        <p className='tw-text-[14px] tw-text-[#6e7178] tw-mb-7'>Upload an image to set as your company logo</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`tw-w-[300px] tw-h-[250px] tw-rounded-xl tw-border-2 tw-border-dashed tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-cursor-pointer tw-transition-all
            ${isDragging
              ? 'tw-border-[#0140c1] tw-bg-[#f0f4ff]'
              : 'tw-border-[#d0d5dd] tw-bg-[#f8f9fa] hover:tw-border-[#0140c1] hover:tw-bg-[#f0f4ff]'}`}
        >
          <div className='tw-w-12 tw-h-12 tw-rounded-full tw-bg-[#eef2ff] tw-flex tw-items-center tw-justify-center'>
            <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='#0140c1' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' />
              <polyline points='17 8 12 3 7 8' />
              <line x1='12' y1='3' x2='12' y2='15' />
            </svg>
          </div>
          <div className='tw-text-center'>
            <span className='tw-text-[#0140c1] tw-font-semibold tw-text-[14px]'>Click to upload</span>
            <span className='tw-text-[#6e7178] tw-text-[14px]'> or drag and drop</span>
          </div>
          <p className='tw-text-[12px] tw-text-[#9ca3af]'>PNG, JPG, JPEG up to 10MB</p>
        </div>
      </div>
    </div>
  )

  // ── Saved View ─────────────────────────────────────────────────────────────
  const SavedView = () => (
    <div className='tw-flex tw-items-center tw-justify-center tw-py-10'>
      <div className='tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-[#e8eaed] tw-w-[760px] tw-p-10 tw-flex tw-flex-col tw-items-center'>
        <h2 className='tw-text-[20px] tw-font-bold tw-text-[#1a1a1a] tw-mb-1'>Company Logo</h2>
        <p className='tw-text-[14px] tw-text-[#6e7178] tw-mb-7'>Your saved company logo</p>

        {/* <div className='tw-w-[300px] tw-h-[180px] tw-rounded-xl tw-border tw-border-[#e8eaed] tw-bg-white tw-flex tw-items-center tw-justify-center tw-mb-7 tw-shadow-sm'>
          {displaySrc
            ? <div className="tw-w-[300px] tw-rounded-xl tw-border tw-border-[#e8eaed] tw-bg-white tw-mb-7 tw-shadow-sm tw-overflow-hidden">
  <img
    src={displaySrc}
    alt="Company Logo"
    className="tw-w-full tw-h-auto tw-block"
  />
</div>
            : <span className='tw-text-[#9ca3af] tw-text-sm'>No logo</span>
          }
        </div> */}
        <div className='tw-w-[300px] tw-rounded-xl tw-border tw-border-[#e8eaed] tw-bg-white tw-mb-7 tw-shadow-sm tw-overflow-hidden'>
  {displaySrc ? (
    <img
      src={displaySrc}
      alt='Company Logo'
      className='tw-w-full tw-h-auto tw-block'
    />
  ) : (
    <div className='tw-h-[180px] tw-flex tw-items-center tw-justify-center'>
      <span className='tw-text-[#9ca3af] tw-text-sm'>No logo</span>
    </div>
  )}
</div>

        {/* Edit button → triggers file picker directly */}
        <button
          onClick={handleEditClick}
          className='tw-flex tw-items-center tw-gap-2 tw-bg-[#0140c1] hover:tw-bg-blue-700 tw-text-white tw-px-6 tw-py-2.5 tw-rounded-[8px] tw-text-[15px] tw-font-medium tw-transition-colors'
        >
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' />
            <path d='M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' />
          </svg>
          Edit Logo
        </button>
      </div>
    </div>
  )

  return (
    <div className='tw-min-h-[400px]'>
      {/* Single hidden file input shared by both Upload dropzone and Edit button */}
      <input
        ref={fileInputRef}
        type='file'
       accept='image/png,image/jpeg,image/jpg,.jpg,.jpeg,.png'
        className='tw-hidden'
        onChange={(e) => readFile(e.target.files[0])}
      />

      {view === 'upload' && <UploadView />}
      {view === 'saved' && <SavedView />}
      {view === 'crop' && rawImageSrc && (
        <CropModal
          imageSrc={rawImageSrc}
          onCancel={() => setView(displaySrc ? 'saved' : 'upload')}
          onSave={handleSaveLogo}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

export default LogoTab
