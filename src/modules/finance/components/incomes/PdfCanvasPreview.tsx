'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

type Props = {
  fileUrl: string | null
  zoomPercent: number | null
}

export default function PdfCanvasPreview({ fileUrl, zoomPercent }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [pinchScale, setPinchScale] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const element = containerRef.current
    const ro = new ResizeObserver(() => {
      setContainerWidth(element.clientWidth || 0)
    })
    ro.observe(element)
    setContainerWidth(element.clientWidth || 0)
    return () => ro.disconnect()
  }, [])

  // Pinch-to-zoom (re-render pages at new width for crispness).
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    let startDistance = 0
    let startScale = 1

    const getDistance = (t1: Touch, t2: Touch) => {
      const dx = t2.clientX - t1.clientX
      const dy = t2.clientY - t1.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startDistance = getDistance(e.touches[0], e.touches[1])
        startScale = pinchScale
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDistance > 0) {
        // Prevent browser page-zoom; we want zoom inside the preview.
        e.preventDefault()
        const nextDistance = getDistance(e.touches[0], e.touches[1])
        const ratio = nextDistance / startDistance
        setPinchScale(clamp(startScale * ratio, 0.7, 2.5))
      }
    }

    const onTouchEnd = () => {
      startDistance = 0
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', onTouchEnd, { passive: true })
    element.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
      element.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [pinchScale])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setError(null)
    setPinchScale(1)
  }

  const onDocumentLoadError = (err: Error) => {
    console.error('PDF load error:', err)
    setError(err.message || 'Gagal memuat PDF')
  }

  const pageWidth = useMemo(() => {
    // Fit to container width with comfortable padding.
    const available = Math.max(0, containerWidth - 24)
    if (available <= 0) return undefined

    const explicit = zoomPercent == null ? 1 : Math.min(2.5, Math.max(0.7, zoomPercent / 100))
    return Math.floor(available * pinchScale * explicit)
  }, [containerWidth, pinchScale, zoomPercent])

  const devicePixelRatio = useMemo(() => {
    if (typeof window === 'undefined') return 1
    // Cap to keep it crisp without being too heavy.
    return Math.min(window.devicePixelRatio || 1, 2)
  }, [])

  return (
    <div
      ref={containerRef}
      data-pdf-container
      className="w-full h-full overflow-auto bg-gray-100"
      style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
    >
      <div className="min-h-full py-4 flex flex-col items-center gap-4">
        {error ? (
          <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg">
            Gagal menampilkan preview PDF. ({error})
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none">
                <div className="bg-black/70 text-white text-xs px-3 py-2 rounded-full shadow">
                  Memuat PDF…
                </div>
              </div>
            }
          >
            {numPages &&
              Array.from({ length: numPages }, (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={pageWidth}
                  devicePixelRatio={devicePixelRatio}
                  className="shadow-xl rounded-lg border border-gray-200 bg-white"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              ))}
          </Document>
        )}
      </div>
    </div>
  )
}
