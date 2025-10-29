import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import React from 'react'
import StatusBar from '../components/StatusBar'
import { 
  BackIcon,
  ChatIcon,
  SettingsIcon,
  FileIcon,
  MusicIcon,
  FootprintIcon,
  ImageIcon,
  PhoneAppIcon,
  CalendarIcon,
  GameIcon,
  MomentsIcon,
  BrowserIcon
} from '../components/Icons'
import { useSettings } from '../context/SettingsContext'

interface IconConfig {
  id: string
  name: string
  customIcon?: string
  defaultIcon: React.ComponentType<any>
}

const IconCustomizer = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // 当前编辑的图标
  const [editingIcon, setEditingIcon] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [cropSize, setCropSize] = useState(200)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [showCropModal, setShowCropModal] = useState(false)
  
  // 桌面应用图标配置（使用Desktop.tsx中的图标组件）
  const defaultIconConfigs: IconConfig[] = [
    { id: 'wechat-app', name: '微信', defaultIcon: ChatIcon },
    { id: 'preset', name: '预设', defaultIcon: SettingsIcon },
    { id: 'worldbook', name: '世界书', defaultIcon: FileIcon },
    { id: 'music-app', name: '音乐', defaultIcon: MusicIcon },
    { id: 'settings', name: '系统设置', defaultIcon: SettingsIcon },
    { id: 'footprint', name: '足迹', defaultIcon: FootprintIcon },
    { id: 'photos', name: '相册', defaultIcon: ImageIcon },
    { id: 'aiphone', name: '查手机', defaultIcon: PhoneAppIcon },
    { id: 'calendar', name: '日历', defaultIcon: CalendarIcon },
    { id: 'games', name: '游戏', defaultIcon: GameIcon },
    { id: 'moments', name: '朋友圈', defaultIcon: MomentsIcon },
    { id: 'offline', name: '线下', defaultIcon: ChatIcon },
    { id: 'customize', name: '美化', defaultIcon: SettingsIcon },
    { id: 'api-config', name: 'API配置', defaultIcon: SettingsIcon },
    { id: 'browser', name: '浏览器', defaultIcon: BrowserIcon },
  ]
  
  const [icons, setIcons] = useState<IconConfig[]>(() => {
    const saved = localStorage.getItem('custom_desktop_icons')
    if (saved) {
      try {
        const savedIcons = JSON.parse(saved)
        // 合并保存的自定义图标和默认配置
        return defaultIconConfigs.map(defaultIcon => {
          const savedIcon = savedIcons.find((s: any) => s.id === defaultIcon.id)
          return {
            ...defaultIcon,
            customIcon: savedIcon?.customIcon
          }
        })
      } catch (e) {
        return defaultIconConfigs
      }
    }
    return defaultIconConfigs
  })

  // 保存图标配置
  const saveIcons = (newIcons: IconConfig[]) => {
    setIcons(newIcons)
    localStorage.setItem('custom_desktop_icons', JSON.stringify(newIcons))
    // 触发自定义事件，让Desktop页面实时重新加载图标
    window.dispatchEvent(new Event('customIconUpdate'))
  }

  // 选择图片
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setSelectedImage(event.target?.result as string)
        setImageSize({ width: img.width, height: img.height })
        
        // 初始化裁剪位置为居中
        const minSize = Math.min(img.width, img.height)
        setCropSize(minSize)
        setCropPosition({
          x: (img.width - minSize) / 2,
          y: (img.height - minSize) / 2
        })
        
        setShowCropModal(true)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // 确认裁剪
  const handleCropConfirm = () => {
    if (!selectedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      // 设置画布大小为256x256（高清图标）
      canvas.width = 256
      canvas.height = 256

      // 绘制裁剪后的图片
      ctx.drawImage(
        img,
        cropPosition.x,
        cropPosition.y,
        cropSize,
        cropSize,
        0,
        0,
        256,
        256
      )

      // 转换为base64
      const croppedImage = canvas.toDataURL('image/png')

      // 更新图标配置
      if (editingIcon) {
        const newIcons = icons.map(icon =>
          icon.id === editingIcon
            ? { ...icon, customIcon: croppedImage }
            : icon
        )
        saveIcons(newIcons)
      }

      // 关闭模态框
      setShowCropModal(false)
      setSelectedImage(null)
      setEditingIcon(null)
    }
    img.src = selectedImage
  }

  // 重置图标
  const handleResetIcon = (iconId: string) => {
    if (confirm('确定要恢复默认图标吗？')) {
      const newIcons = icons.map(icon =>
        icon.id === iconId
          ? { ...icon, customIcon: undefined }
          : icon
      )
      saveIcons(newIcons)
    }
  }

  // 重置所有图标
  const handleResetAll = () => {
    if (confirm('确定要恢复所有默认图标吗？')) {
      const newIcons = icons.map(icon => ({ ...icon, customIcon: undefined }))
      saveIcons(newIcons)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f7fa]">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* 隐藏的画布用于裁剪 */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
          >
            <BackIcon size={24} />
          </button>
          
          <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
            自定义图标
          </h1>
          
          <button
            onClick={handleResetAll}
            className="text-sm text-blue-500 ios-button"
          >
            全部重置
          </button>
        </div>
      </div>

      {/* 图标列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-4">
          {icons.map((icon) => (
            <div
              key={icon.id}
              className="glass-card rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all backdrop-blur-md bg-white/80 border border-white/50"
            >
              <div className="flex flex-col items-center gap-2">
                {/* 图标预览 */}
                <div className="relative w-20 h-20 rounded-2xl glass-card flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  {icon.customIcon ? (
                    <img
                      src={icon.customIcon}
                      alt={icon.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    React.createElement(icon.defaultIcon, { size: 32, className: "text-gray-300" })
                  )}
                </div>
                
                {/* 图标名称 */}
                <span className="text-xs text-gray-700 text-center font-medium">
                  {icon.name}
                </span>
                
                {/* 操作按钮 */}
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      setEditingIcon(icon.id)
                      fileInputRef.current?.click()
                    }}
                    className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium whitespace-nowrap"
                  >
                    {icon.customIcon ? '更换' : '自定义'}
                  </button>
                  {icon.customIcon && (
                    <button
                      onClick={() => handleResetIcon(icon.id)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium whitespace-nowrap"
                    >
                      重置
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 使用说明 */}
        <div className="mt-6 p-4 glass-card rounded-2xl backdrop-blur-md bg-white/60 border border-white/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">使用说明</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 点击"自定义"按钮上传图片</li>
            <li>• 拖动和缩放裁剪框调整图标区域</li>
            <li>• 建议使用正方形图片，效果更佳</li>
            <li>• 支持PNG、JPG等常见格式</li>
          </ul>
        </div>
      </div>

      {/* 裁剪模态框 */}
      {showCropModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* 顶部 */}
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">裁剪图标</h2>
              <button
                onClick={() => {
                  setShowCropModal(false)
                  setSelectedImage(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* 裁剪区域 */}
            <div className="p-6">
              <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden">
                {/* 原图 */}
                <img
                  src={selectedImage}
                  alt="preview"
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'brightness(0.5)'
                  }}
                />
                
                {/* 裁剪框 */}
                <div
                  className="absolute border-4 border-blue-500 bg-transparent cursor-move"
                  style={{
                    left: `${(cropPosition.x / imageSize.width) * 100}%`,
                    top: `${(cropPosition.y / imageSize.height) * 100}%`,
                    width: `${(cropSize / imageSize.width) * 100}%`,
                    height: `${(cropSize / imageSize.height) * 100}%`,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }}
                  onMouseDown={(e) => {
                    const startX = e.clientX
                    const startY = e.clientY
                    const startPosX = cropPosition.x
                    const startPosY = cropPosition.y
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const container = e.currentTarget as HTMLElement
                      const rect = container.getBoundingClientRect()
                      const scaleX = imageSize.width / rect.width
                      const scaleY = imageSize.height / rect.height
                      
                      const deltaX = (e.clientX - startX) * scaleX
                      const deltaY = (e.clientY - startY) * scaleY
                      
                      const newX = Math.max(0, Math.min(imageSize.width - cropSize, startPosX + deltaX))
                      const newY = Math.max(0, Math.min(imageSize.height - cropSize, startPosY + deltaY))
                      
                      setCropPosition({ x: newX, y: newY })
                    }
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }
                    
                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                >
                  {/* 裁剪框内的图片预览 */}
                  <img
                    src={selectedImage}
                    alt="crop preview"
                    className="absolute pointer-events-none"
                    style={{
                      left: `-${cropPosition.x}px`,
                      top: `-${cropPosition.y}px`,
                      width: `${imageSize.width}px`,
                      height: `${imageSize.height}px`
                    }}
                  />
                </div>
              </div>

              {/* 裁剪大小调整 */}
              <div className="mt-4">
                <label className="text-sm text-gray-600 block mb-2">裁剪大小</label>
                <input
                  type="range"
                  min={Math.min(100, Math.min(imageSize.width, imageSize.height))}
                  max={Math.min(imageSize.width, imageSize.height)}
                  value={cropSize}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value)
                    setCropSize(newSize)
                    
                    // 调整位置确保不超出边界
                    setCropPosition({
                      x: Math.min(cropPosition.x, imageSize.width - newSize),
                      y: Math.min(cropPosition.y, imageSize.height - newSize)
                    })
                  }}
                  className="w-full"
                />
              </div>

              {/* 按钮组 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCropModal(false)
                    setSelectedImage(null)
                  }}
                  className="flex-1 px-4 py-3 glass-card text-gray-700 rounded-xl font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleCropConfirm}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IconCustomizer
