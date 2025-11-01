import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import { BackIcon, VolumeIcon } from '../components/Icons'

// 声音设置接口
interface SoundSetting {
  id: string
  title: string
  description: string
  currentFile?: string
  storageKey: string
}

const SoundUploadSettings = () => {
  const navigate = useNavigate()
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  
  // 声音设置项
  const soundSettings: SoundSetting[] = [
    {
      id: 'message',
      title: '消息提示音',
      description: 'AI发送消息时播放的提示音',
      storageKey: 'custom_message_sound'
    },
    {
      id: 'call',
      title: '通话提示音',
      description: '来电时播放的铃声',
      storageKey: 'custom_call_sound'
    }
  ]
  
  // 从localStorage读取当前设置
  const [uploadedSounds, setUploadedSounds] = useState<{ [key: string]: string }>(() => {
    const saved: { [key: string]: string } = {}
    soundSettings.forEach(setting => {
      const storedSound = localStorage.getItem(setting.storageKey)
      if (storedSound) {
        saved[setting.id] = storedSound
      }
    })
    return saved
  })
  
  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setting: SoundSetting) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 验证音频文件类型
    if (!file.type.startsWith('audio/')) {
      alert('请选择音频文件（mp3, wav, m4a等格式）')
      return
    }
    
    // 读取文件
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      
      // 保存到localStorage
      localStorage.setItem(setting.storageKey, base64)
      
      // 更新状态
      setUploadedSounds(prev => ({
        ...prev,
        [setting.id]: file.name
      }))
      
      console.log(`已上传${setting.title}: ${file.name}`)
    }
    reader.readAsDataURL(file)
  }
  
  // 删除已上传的声音
  const handleRemoveSound = (setting: SoundSetting) => {
    localStorage.removeItem(setting.storageKey)
    setUploadedSounds(prev => {
      const updated = { ...prev }
      delete updated[setting.id]
      return updated
    })
  }
  
  // 播放预览
  const handlePlayPreview = (setting: SoundSetting) => {
    const soundData = localStorage.getItem(setting.storageKey)
    if (soundData) {
      const audio = new Audio(soundData)
      audio.play()
    }
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 flex flex-col">
      {/* 状态栏 + 导航栏 */}
      <div className="backdrop-blur-xl bg-white/80 border-b border-white/50 shadow-sm">
        <StatusBar />
        
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <BackIcon size={24} className="text-blue-500" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">声音设置</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 主内容 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* 说明卡片 */}
        <div className="mb-6 backdrop-blur-xl bg-white/70 rounded-2xl p-4 shadow-lg border border-white/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
              <VolumeIcon size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">自定义提示音</h3>
              <p className="text-sm text-gray-600">上传您喜欢的音频文件作为消息和通话提示音</p>
            </div>
          </div>
        </div>

        {/* 声音设置列表 */}
        <div className="space-y-4">
          {soundSettings.map((setting) => (
            <div
              key={setting.id}
              className="backdrop-blur-xl bg-white/70 rounded-2xl p-5 shadow-lg border border-white/50"
            >
              {/* 标题和描述 */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{setting.title}</h3>
                <p className="text-sm text-gray-600">{setting.description}</p>
              </div>

              {/* 当前状态 */}
              {uploadedSounds[setting.id] ? (
                <div className="space-y-3">
                  {/* 文件信息 */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <VolumeIcon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {uploadedSounds[setting.id]}
                      </div>
                      <div className="text-xs text-gray-500">已上传</div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePlayPreview(setting)}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-xl active:scale-95 transition-transform shadow-lg"
                    >
                      播放预览
                    </button>
                    <button
                      onClick={() => handleRemoveSound(setting)}
                      className="flex-1 py-2.5 px-4 bg-white/80 text-red-500 text-sm font-medium rounded-xl active:scale-95 transition-transform border border-red-200/50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* 上传按钮 */}
                  <button
                    onClick={() => fileInputRefs.current[setting.id]?.click()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-xl active:scale-95 transition-transform shadow-lg"
                  >
                    上传音频文件
                  </button>
                  
                  {/* 隐藏的文件输入 */}
                  <input
                    ref={(el) => fileInputRefs.current[setting.id] = el}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setting)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 格式说明 */}
        <div className="mt-6 backdrop-blur-xl bg-white/50 rounded-2xl p-4 border border-white/50">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">支持的音频格式</h4>
          <p className="text-xs text-gray-600">
            MP3、WAV、M4A、OGG 等常见音频格式
          </p>
        </div>

        {/* 底部空白 */}
        <div className="h-8" />
      </div>
    </div>
  )
}

export default SoundUploadSettings
