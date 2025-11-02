/**
 * 图片上传区块组件
 * 用于上传和预览图片
 */

import React, { useRef } from 'react'
import { ImageIcon } from '../../../components/Icons'

interface ImageUploadSectionProps {
  title: string
  currentImage: string
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  placeholder?: string
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  title,
  currentImage,
  onUpload,
  onRemove,
  placeholder = '点击上传图片'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mb-4">
      <div className="text-gray-700 font-medium mb-2">{title}</div>
      <div className="flex items-center gap-4">
        {currentImage ? (
          <div className="relative">
            <img
              src={currentImage}
              alt={title}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {currentImage ? '更换图片' : placeholder}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}

