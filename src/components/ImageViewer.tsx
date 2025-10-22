import { useState } from 'react'

interface ImageViewerProps {
  images: string[]
  initialIndex: number
  onClose: () => void
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [rotation, setRotation] = useState(0)

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    setRotation(0)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    setRotation(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') handlePrevious()
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'r' || e.key === 'R') handleRotate()
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 text-3xl w-10 h-10 flex items-center justify-center"
      >
        ×
      </button>

      {/* 旋转按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleRotate()
        }}
        className="absolute top-4 right-16 text-white hover:text-gray-300 z-10 text-2xl w-10 h-10 flex items-center justify-center"
        title="旋转 (R)"
      >
        ↻
      </button>

      {/* 图片计数 */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 text-white text-lg z-10">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* 图片 */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`图片 ${currentIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain transition-transform duration-300"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>

      {/* 左右切换按钮 */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handlePrevious()
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-4xl"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-4xl"
          >
            ›
          </button>
        </>
      )}

      {/* 提示文字 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm opacity-70">
        按 ESC 关闭 · 按 R 旋转 · 方向键切换
      </div>
    </div>
  )
}
