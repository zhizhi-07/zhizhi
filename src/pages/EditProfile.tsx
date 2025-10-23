import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef } from 'react'
import { BackIcon, ImageIcon } from '../components/Icons'
import { useUser } from '../context/UserContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const EditProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, updateUser } = useUser()
  const { showStatusBar } = useSettings()
  const field = location.state?.field || 'name'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [value, setValue] = useState(
    field === 'name' ? currentUser?.name || '' :
    field === 'signature' ? currentUser?.signature || '' :
    currentUser?.avatar || 'default'
  )

  const [isUploading, setIsUploading] = useState(false)

  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    setIsUploading(true)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setValue(base64String)
      setIsUploading(false)
    }
    reader.onerror = () => {
      alert('图片读取失败')
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (currentUser) {
      updateUser(currentUser.id, { [field]: value })
      navigate(-1)
    }
  }

  const getTitle = () => {
    switch (field) {
      case 'name': return '更改名字'
      case 'signature': return '个性签名'
      case 'avatar': return '更换头像'
      default: return '编辑'
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
      {/* 顶部标题栏 */}
      <div className="glass-effect px-4 py-3 flex items-center justify-between border-b border-gray-200/50">
        <button
          onClick={() => navigate(-1)}
          className="ios-button text-gray-700 hover:text-gray-900"
        >
          取消
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          {getTitle()}
        </h1>
        <button
          onClick={handleSave}
          className="ios-button text-primary font-medium"
        >
          保存
        </button>
      </div>

      {/* 编辑内容 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3">
        {field === 'avatar' ? (
          <>
            {/* 上传自定义头像 */}
            <div className="mb-4">
              <div className="px-4 py-2">
                <span className="text-sm text-gray-600 font-medium">上传头像</span>
                <p className="text-xs text-gray-400 mt-1">点击上传本地图片，支持 JPG、PNG、GIF 格式</p>
              </div>
              <div className="glass-card rounded-2xl p-6 flex justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="relative w-32 h-32 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center ios-button overflow-hidden"
                >
                  {value && value.startsWith('data:image') ? (
                    <>
                      <img
                        src={value}
                        alt="头像预览"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <span className="text-white opacity-0 hover:opacity-100 text-sm">点击更换</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {isUploading ? (
                        <div className="text-gray-400">上传中...</div>
                      ) : (
                        <>
                          <ImageIcon size={32} className="text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">上传头像</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card rounded-2xl p-4">
            {field === 'signature' ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="填写个性签名"
                maxLength={100}
                className="w-full h-32 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 resize-none"
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="请输入名字"
                maxLength={20}
                className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 py-2"
              />
            )}
            <div className="text-right text-xs text-gray-400 mt-2">
              {value.length}/{field === 'signature' ? 100 : 20}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditProfile

