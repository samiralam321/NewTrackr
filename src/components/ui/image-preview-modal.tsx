'use client'

import { useEffect, useState, useCallback } from "react"
import { X, ZoomIn, ZoomOut, ExternalLink, Download } from "lucide-react"

interface ImagePreviewModalProps {
  imageUrl: string | null
  alt?: string
  isOpen: boolean
  onClose: () => void
}

export function ImagePreviewModal({
  imageUrl,
  alt = "Post image preview",
  isOpen,
  onClose
}: ImagePreviewModalProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  // Reset zoom on open/close
  useEffect(() => {
    if (isOpen) {
      setIsZoomed(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ESC key listener to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen || !imageUrl) return null

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
      onClick={(e) => {
        // Close if clicking outside the image or on the backdrop
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
        {/* Zoom Toggle */}
        <button
          type="button"
          onClick={() => setIsZoomed(prev => !prev)}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white flex items-center justify-center transition-all backdrop-blur-md shadow-lg border border-white/10"
          title={isZoomed ? "Zoom out" : "Zoom in"}
          aria-label={isZoomed ? "Zoom out" : "Zoom in"}
        >
          {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </button>

        {/* Open Original in New Tab */}
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 hover:text-white flex items-center justify-center transition-all backdrop-blur-md shadow-lg border border-white/10"
          title="Open original image in new tab"
          aria-label="Open original image in new tab"
        >
          <ExternalLink className="w-5 h-5" />
        </a>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all backdrop-blur-md shadow-lg border border-white/20"
          title="Close (Esc)"
          aria-label="Close image preview"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Main Image Container */}
      <div 
        className="w-full h-full flex items-center justify-center p-3 sm:p-6 md:p-10 overflow-auto cursor-zoom-out"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200">
          <img
            src={imageUrl}
            alt={alt}
            onClick={(e) => {
              e.stopPropagation()
              setIsZoomed(prev => !prev)
            }}
            className={`
              block transition-all duration-200 object-contain select-none shadow-2xl rounded-lg
              ${isZoomed 
                ? 'max-w-none max-h-none scale-125 md:scale-150 cursor-zoom-out my-auto mx-auto' 
                : 'max-w-[92vw] max-h-[86vh] cursor-zoom-in'
              }
            `}
          />
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs pointer-events-none hidden sm:block">
        Click image to {isZoomed ? 'zoom out' : 'zoom in'} • Esc to close
      </div>
    </div>
  )
}
