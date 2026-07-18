import React, { useRef, useState, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import { motion } from "framer-motion";

/**
 * Props:
 * - imageSrc: dataURL or image url
 * - onClose: () => void
 * - onSave: (base64) => void
 * - initialSize (optional): { width, height }
 */
const ImageCropModal = ({ imageSrc, onClose, onSave, initialSize }) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [rndProps, setRndProps] = useState({
    x: 20,
    y: 20,
    width: initialSize?.width || 200,
    height: initialSize?.height || 200,
  });

  const clampToImageBounds = (next) => {
  const img = imageRef.current;
  const container = containerRef.current;
  if (!img || !container) return next;

  const imgRect = img.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const imageLeft = imgRect.left - containerRect.left;
  const imageTop = imgRect.top - containerRect.top;
  const imageWidth = imgRect.width;
  const imageHeight = imgRect.height;

  const maxSize = Math.min(imageWidth, imageHeight);

  let size = Math.min(next.width, next.height, maxSize);
  size = Math.max(40, size);

  let x = next.x;
  let y = next.y;

  if (x < imageLeft) x = imageLeft;
  if (y < imageTop) y = imageTop;
  if (x + size > imageLeft + imageWidth) x = imageLeft + imageWidth - size;
  if (y + size > imageTop + imageHeight) y = imageTop + imageHeight - size;

  return {
    x,
    y,
    width: size,
    height: size,
  };
};

  // useEffect(() => {
  //   const img = imageRef.current;
  //   if (!img) return;
  //   const onLoad = () => {
  //     const container = containerRef.current;
  //     if (!container) return;
  //     const { width: cw, height: ch } = container.getBoundingClientRect();
  //     const size = Math.floor(Math.min(cw, ch) * 0.6);
  //     setRndProps({
  //       x: Math.floor((cw - size) / 2),
  //       y: Math.floor((ch - size) / 2),
  //       width: size,
  //       height: size,
  //     });
  //   };
  //   if (img.complete) onLoad();
  //   else img.addEventListener("load", onLoad);
  //   return () => img.removeEventListener("load", onLoad);
  // }, [imageSrc]);
useEffect(() => {
  const img = imageRef.current;
  if (!img) return;

  const onLoad = () => {
    const container = containerRef.current;
    if (!container) return;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const imageLeft = imgRect.left - containerRect.left;
    const imageTop = imgRect.top - containerRect.top;
    const imageWidth = imgRect.width;
    const imageHeight = imgRect.height;

    const size = Math.floor(Math.min(imageWidth, imageHeight) * 0.6);

    setRndProps({
      x: Math.floor(imageLeft + (imageWidth - size) / 2),
      y: Math.floor(imageTop + (imageHeight - size) / 2),
      width: size,
      height: size,
    });
  };

  if (img.complete) onLoad();
  else img.addEventListener("load", onLoad);

  return () => img.removeEventListener("load", onLoad);
}, [imageSrc]);
  const getCroppedBase64 = useCallback(() => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container) return null;

    const imgRect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const scaleX = naturalWidth / imgRect.width;
    const scaleY = naturalHeight / imgRect.height;

    const containerRect = container.getBoundingClientRect();
    const boxX = rndProps.x;
    const boxY = rndProps.y;
    const boxW = rndProps.width;
    const boxH = rndProps.height;

    const sx = Math.max(
      0,
      Math.round((boxX - (imgRect.left - containerRect.left)) * scaleX)
    );
    const sy = Math.max(
      0,
      Math.round((boxY - (imgRect.top - containerRect.top)) * scaleY)
    );
    const sw = Math.max(1, Math.round(boxW * scaleX));
    const sh = Math.max(1, Math.round(boxH * scaleY));

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    if (dpr > 1) {
      canvas.width = sw * dpr;
      canvas.height = sh * dpr;
      canvas.style.width = `${sw}px`;
      canvas.style.height = `${sh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    return canvas.toDataURL("image/jpeg", 0.92);
  }, [rndProps]);

  const handleSave = () => {
    const base64 = getCroppedBase64();
    if (!base64) return;
    onSave(base64);
  };

  const rndStyle = {
    border: "2px dashed #0140c1",
    borderRadius: "8px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    touchAction: "none",
    background: "rgba(255,255,255,0.02)",
     zIndex: 20,
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-[9997] tw-flex tw-items-center tw-justify-center tw-mt-[0px]">
      {/* overlay */}
      <div
        className="tw-absolute tw-inset-0 tw-bg-black/60 tw-backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="tw-relative tw-z-50 tw-w-[92%] tw-max-w-[900px] tw-bg-white tw-rounded-lg tw-shadow-2xl tw-p-4"
      >
        <h3 className="tw-text-lg tw-font-semibold tw-text-[#0140c1]">
          Crop Image
        </h3>

        <div className="tw-w-full tw-h-[520px] md:tw-h-[480px] tw-border tw-border-gray-200 tw-rounded-md tw-overflow-hidden">
          <div
            ref={containerRef}
            className="tw-relative tw-w-full tw-h-full tw-bg-gray-50 tw-flex tw-items-center tw-justify-center"
            style={{ touchAction: "none" }}
          >
            <img
              // crossOrigin="anonymous"
              ref={imageRef}
              src={imageSrc}
              alt="To crop"
              className="tw-max-w-full tw-max-h-full tw-object-contain"
              style={{ userSelect: "none", pointerEvents: "none" }}
              draggable={false}
            />
{/* 
            <Rnd
              size={{ width: rndProps.width, height: rndProps.height }}
              position={{ x: rndProps.x, y: rndProps.y }}
              bounds="parent"
              onDragStop={(e, d) => {
                setRndProps((prev) => ({ ...prev, x: d.x, y: d.y }));
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                setRndProps({
                  x: position.x,
                  y: position.y,
                  width: Math.max(40, parseInt(ref.style.width, 10)),
                  height: Math.max(40, parseInt(ref.style.height, 10)),
                });
              }}
              onResize={(e, direction, ref, delta, position) => {
                setRndProps({
                  x: position.x,
                  y: position.y,
                  width: Math.max(40, parseInt(ref.style.width, 10)),
                  height: Math.max(40, parseInt(ref.style.height, 10)),
                });
              }}
              enableResizing={{
                top: true,
                right: true,
                bottom: true,
                left: true,
                topRight: true,
                bottomRight: true,
                bottomLeft: true,
                topLeft: true,
              }}
              style={rndStyle}
              className="crop-rnd tw-cursor-move"
              lockAspectRatio={false}
            >
              <div className="tw-w-full tw-h-full tw-relative tw-flex tw-items-center tw-justify-center tw-select-none">
                <div
                  className="tw-absolute -tw-top-5 tw-left-1/2 -tw-translate-x-1/2
                  tw-px-2 tw-py-1 tw-rounded-md tw-text-xs tw-bg-[#0140c1] tw-text-white tw-cursor-move"
                >
                  Drag
                </div>
              </div>
            </Rnd> */}
            {/* <Rnd
  size={{ width: rndProps.width, height: rndProps.height }}
  position={{ x: rndProps.x, y: rndProps.y }}
  bounds="parent"
  onDragStop={(e, d) => {
    setRndProps((prev) => ({ ...prev, x: d.x, y: d.y }));
  }}
  onResizeStop={(e, direction, ref, delta, position) => {
    const size = Math.max(40, parseInt(ref.style.width, 10));

    setRndProps({
      x: position.x,
      y: position.y,
      width: size,
      height: size, // ✅ force square
    });
  }}
  onResize={(e, direction, ref, delta, position) => {
    const size = Math.max(40, parseInt(ref.style.width, 10));

    setRndProps({
      x: position.x,
      y: position.y,
      width: size,
      height: size, // ✅ force square
    });
  }}
  enableResizing={{
    top: true,
    right: true,
    bottom: true,
    left: true,
    topRight: true,
    bottomRight: true,
    bottomLeft: true,
    topLeft: true,
  }}
  style={rndStyle}
  className="crop-rnd tw-cursor-move"
  lockAspectRatio={1} // ✅ IMPORTANT
></Rnd> */}
<Rnd
  size={{ width: rndProps.width, height: rndProps.height }}
  position={{ x: rndProps.x, y: rndProps.y }}
  bounds="parent"
  lockAspectRatio={1}
  style={rndStyle}
  className="crop-rnd tw-cursor-move"
  onDragStop={(e, d) => {
    setRndProps((prev) =>
      clampToImageBounds({
        ...prev,
        x: d.x,
        y: d.y,
      })
    );
  }}
  onResize={(e, direction, ref, delta, position) => {
    const size = Math.max(40, parseInt(ref.style.width, 10));

    setRndProps(
      clampToImageBounds({
        x: position.x,
        y: position.y,
        width: size,
        height: size,
      })
    );
  }}
  onResizeStop={(e, direction, ref, delta, position) => {
    const size = Math.max(40, parseInt(ref.style.width, 10));

    setRndProps(
      clampToImageBounds({
        x: position.x,
        y: position.y,
        width: size,
        height: size,
      })
    );
  }}
>
  <div className="tw-w-full tw-h-full tw-relative tw-flex tw-items-center tw-justify-center tw-select-none">
    <div
      className="tw-absolute -tw-top-5 tw-left-1/2 -tw-translate-x-1/2
      tw-px-2 tw-py-1 tw-rounded-md tw-text-xs tw-bg-[#0140c1] tw-text-white tw-cursor-move"
    >
      Drag
    </div>
  </div>
</Rnd>
          </div>
        </div>

        {/* Footer */}
        <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-text-sm tw-text-gray-600">Selection</div>
            <div className="tw-w-16 tw-h-16 tw-border tw-border-gray-200 tw-rounded tw-overflow-hidden tw-flex tw-items-center tw-justify-center tw-bg-white">
              <PreviewThumbnail imageRef={imageRef} rndProps={rndProps} />
            </div>
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <button
              onClick={handleSave}
              className="tw-px-4 tw-py-2 tw-bg-[#0140c1] tw-text-white tw-rounded-md hover:tw-bg-[#0140c1] tw-transition"
              type="button"
            >
              Crop & Save
            </button>
            <button
              onClick={onClose}
              className="tw-px-3 tw-py-2 tw-bg-gray-200 tw-text-gray-800 tw-rounded-md hover:tw-bg-gray-300 tw-transition"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Small preview component - renders a scaled thumbnail of the selected region
 */
// const PreviewThumbnail = ({ imageRef, rndProps }) => {
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const img = imageRef.current;
//     const canvas = canvasRef.current;
//     if (!img || !canvas) return;

//     const imgRect = img.getBoundingClientRect();
//     const naturalW = img.naturalWidth;
//     const naturalH = img.naturalHeight;
//     const scaleX = naturalW / imgRect.width;
//     const scaleY = naturalH / imgRect.height;

//     const sx = Math.max(0, Math.round(rndProps.x * scaleX));
//     const sy = Math.max(0, Math.round(rndProps.y * scaleY));
//     const sw = Math.max(1, Math.round(rndProps.width * scaleX));
//     const sh = Math.max(1, Math.round(rndProps.height * scaleY));

//     const ctx = canvas.getContext("2d");
//     const w = 64;
//     const h = 64;
//     canvas.width = w;
//     canvas.height = h;
//     ctx.clearRect(0, 0, w, h);

//     try {
//       ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
//     } catch {
//       // silently ignore until image loads
//     }
//   }, [imageRef, rndProps]);

//   return <canvas ref={canvasRef} className="tw-w-16 tw-h-16" />;
// };

const PreviewThumbnail = ({ imageRef, rndProps }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const container = img.parentElement;
    if (!container) return;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    const scaleX = naturalW / imgRect.width;
    const scaleY = naturalH / imgRect.height;

    const imageLeft = imgRect.left - containerRect.left;
    const imageTop = imgRect.top - containerRect.top;

    const sx = Math.max(0, Math.round((rndProps.x - imageLeft) * scaleX));
    const sy = Math.max(0, Math.round((rndProps.y - imageTop) * scaleY));
    const sw = Math.max(1, Math.round(rndProps.width * scaleX));
    const sh = Math.max(1, Math.round(rndProps.height * scaleY));

    const ctx = canvas.getContext("2d");
    const w = 64;
    const h = 64;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    try {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    } catch {
      // silently ignore until image loads
    }
  }, [imageRef, rndProps]);

  return <canvas ref={canvasRef} className="tw-w-16 tw-h-16" />;
};

export default ImageCropModal;
