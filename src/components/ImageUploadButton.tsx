import { useRef } from 'react'
import { ImageIcon } from './Icons'
import { isValidImageFile, isValidImageSize, compressImage } from '../utils/imageUtils'

interface ImageUploadButtonProps {
  onImageSelect: (base64: string) => void
  disabled?: boolean
}

const ImageUploadButton = ({ onImageSelect, disabled = false }: ImageUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!isValidImageFile(file)) {
      alert('请选择有效的图片文件（JPG、PNG、GIF、WebP）')
      return
    }

    // 验证文件大小
    if (!isValidImageSize(file, 10)) {
      alert('图片大小不能超过10MB')
      return
    }

    try {
      // 压缩图片
      const base64 = await compressImage(file, 1024, 1024, 0.8)
      onImageSelect(base64)
      
      // 清空input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('图片处理失败:', error)
      alert('图片处理失败，请重试')
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="上传图片识别"
      >
        <ImageIcon size={24} className="text-gray-600" />
      </button>
    </>
  )
}

export default ImageUploadButton
