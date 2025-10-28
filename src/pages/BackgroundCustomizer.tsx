import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { BackIcon, ImageIcon } from '../components/Icons'
import { useSettings } from '../context/SettingsContext'
import { saveImage, getImage, deleteImage } from '../utils/imageStorage'

const BackgroundCustomizer = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const desktopFileInputRef = useRef<HTMLInputElement>(null)
  const musicFileInputRef = useRef<HTMLInputElement>(null)
  
  // 桌面背景
  const [desktopBackground, setDesktopBackground] = useState('')
  const [desktopUploading, setDesktopUploading] = useState(false)
  
  // 音乐背景
  const [musicBackground, setMusicBackground] = useState('')
  const [musicUploading, setMusicUploading] = useState(false)

  // 加载背景
  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        // 加载桌面背景
        const savedDesktop = await getImage('desktop_background')
        if (savedDesktop) {
          setDesktopBackground(savedDesktop)
        }
        
        // 加载音乐背景
        const savedMusic = await getImage('music_player_background')
        if (savedMusic) {
          setMusicBackground(savedMusic)
        }
      } catch (error) {
        console.error('加载背景失败:', error)
      }
    }
    loadBackgrounds()
  }, [])

  // 处理桌面背景上传
  const handleDesktopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setDesktopUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64String = reader.result as string
        try {
          await saveImage('desktop_background', base64String)
          setDesktopBackground(base64String)
          setDesktopUploading(false)
          alert('桌面背景已保存！')
          // 触发更新
          window.dispatchEvent(new Event('desktopBackgroundUpdate'))
        } catch (error) {
          console.error('保存失败:', error)
          alert('保存失败，请重试')
          setDesktopUploading(false)
        }
      }
      reader.onerror = () => {
        alert('图片读取失败')
        setDesktopUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('图片处理失败:', error)
      alert('图片处理失败，请重试')
      setDesktopUploading(false)
    }
  }

  // 处理音乐背景上传
  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setMusicUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64String = reader.result as string
        try {
          await saveImage('music_player_background', base64String)
          setMusicBackground(base64String)
          setMusicUploading(false)
          alert('音乐背景已保存！')
          // 触发更新
          window.dispatchEvent(new Event('musicBackgroundUpdate'))
        } catch (error) {
          console.error('保存失败:', error)
          alert('保存失败，请重试')
          setMusicUploading(false)
        }
      }
      reader.onerror = () => {
        alert('图片读取失败')
        setMusicUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('图片处理失败:', error)
      alert('图片处理失败，请重试')
      setMusicUploading(false)
    }
  }

  // 删除桌面背景
  const handleRemoveDesktop = async () => {
    if (confirm('确定要删除桌面背景吗？')) {
      try {
        await deleteImage('desktop_background')
        setDesktopBackground('')
        alert('桌面背景已删除！')
        window.dispatchEvent(new Event('desktopBackgroundUpdate'))
      } catch (error) {
        console.error('删除失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  // 删除音乐背景
  const handleRemoveMusic = async () => {
    if (confirm('确定要删除音乐背景吗？')) {
      try {
        await deleteImage('music_player_background')
        setMusicBackground('')
        alert('音乐背景已删除！')
        window.dispatchEvent(new Event('musicBackgroundUpdate'))
      } catch (error) {
        console.error('删除失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f7fa]">
      {/* 隐藏的文件输入 */}
      <input
        ref={desktopFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleDesktopUpload}
        className="hidden"
      />
      <input
        ref={musicFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleMusicUpload}
        className="hidden"
      />
      
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
          
          <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
            背景设置
          </h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 背景设置列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 桌面背景 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">桌面背景</h2>
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <p className="text-xs text-gray-500 mb-3">设置Desktop页面的整体背景</p>
            
            <div className="flex items-center gap-3">
              {/* 背景缩略图 */}
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: desktopBackground ? `url(${desktopBackground})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: desktopBackground ? 'transparent' : '#f5f7fa'
                }}
              >
                {!desktopBackground && (
                  <ImageIcon size={32} className="text-gray-400" />
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => desktopFileInputRef.current?.click()}
                  disabled={desktopUploading}
                  className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl ios-button font-medium text-sm"
                >
                  {desktopUploading ? '上传中...' : desktopBackground ? '更换背景' : '上传背景'}
                </button>
                {desktopBackground && (
                  <button
                    onClick={handleRemoveDesktop}
                    className="w-full px-4 py-2.5 glass-card text-gray-700 rounded-xl ios-button font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 音乐背景 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">音乐背景</h2>
          <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
            <p className="text-xs text-gray-500 mb-3">设置桌面上音乐播放器卡片的背景</p>
            
            <div className="flex items-center gap-3">
              {/* 背景缩略图 */}
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: musicBackground ? `url(${musicBackground})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: musicBackground ? 'transparent' : '#f5f7fa'
                }}
              >
                {!musicBackground && (
                  <ImageIcon size={32} className="text-gray-400" />
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex-1 flex flex-col gap-2">
                <button
                  onClick={() => musicFileInputRef.current?.click()}
                  disabled={musicUploading}
                  className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl ios-button font-medium text-sm"
                >
                  {musicUploading ? '上传中...' : musicBackground ? '更换背景' : '上传背景'}
                </button>
                {musicBackground && (
                  <button
                    onClick={handleRemoveMusic}
                    className="w-full px-4 py-2.5 glass-card text-gray-700 rounded-xl ios-button font-medium text-sm"
                  >
                    删除背景
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 p-4 glass-card rounded-2xl backdrop-blur-md bg-white/60 border border-white/50">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">使用说明</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 桌面背景会显示在Desktop页面的整体背景</li>
            <li>• 音乐背景只会显示在音乐播放器卡片内</li>
            <li>• 建议使用高质量图片，效果更佳</li>
            <li>• 图片会自动保存到IndexedDB，无大小限制</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BackgroundCustomizer
