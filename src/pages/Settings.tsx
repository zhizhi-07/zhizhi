import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { BackIcon, ImageIcon } from '../components/Icons'
import { useSettings } from '../context/SettingsContext'
import { getStorageInfo, manualCleanStorage, compressStorageData } from '../utils/storage'

const Settings = () => {
  const navigate = useNavigate()
  const { showStatusBar, toggleStatusBar } = useSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 全局背景设置
  const [globalBackground, setGlobalBackground] = useState(() => {
    const saved = localStorage.getItem('global_background')
    return saved || ''
  })

  const [isUploading, setIsUploading] = useState(false)
  const [backgroundPreview, setBackgroundPreview] = useState(globalBackground)
  const [storageInfo, setStorageInfo] = useState(getStorageInfo())

  // 气泡设置
  const [userBubbleColor, setUserBubbleColor] = useState(() => {
    return localStorage.getItem('user_bubble_color') || '#95EC69'
  })
  const [aiBubbleColor, setAiBubbleColor] = useState(() => {
    return localStorage.getItem('ai_bubble_color') || '#FFFFFF'
  })
  const [userBubbleCSS, setUserBubbleCSS] = useState(() => {
    return localStorage.getItem('user_bubble_css') || ''
  })
  const [aiBubbleCSS, setAiBubbleCSS] = useState(() => {
    return localStorage.getItem('ai_bubble_css') || ''
  })
  const [showBubbleSettings, setShowBubbleSettings] = useState(false)

  useEffect(() => {
    setBackgroundPreview(globalBackground)
  }, [globalBackground])

  // 处理背景上传
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setBackgroundPreview(base64String)
      setGlobalBackground(base64String)
      localStorage.setItem('global_background', base64String)
      setIsUploading(false)
    }
    reader.onerror = () => {
      alert('图片读取失败')
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // 删除背景
  const handleRemoveBackground = () => {
    setGlobalBackground('')
    setBackgroundPreview('')
    localStorage.removeItem('global_background')
    setStorageInfo(getStorageInfo())
  }

  // 清理缓存
  const handleClearCache = () => {
    if (confirm('确定要清除所有缓存吗？这将删除所有聊天记录、壁纸和设置！')) {
      localStorage.clear()
      alert('缓存已清除，页面将刷新')
      window.location.reload()
    }
  }

  // 清理聊天记录
  const handleClearChatHistory = () => {
    if (confirm('确定要清除所有聊天记录吗？')) {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('chat_messages_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      setStorageInfo(getStorageInfo())
      alert(`已清除 ${keysToRemove.length} 个聊天记录`)
    }
  }

  // 智能清理存储（手动触发，有确认提示）
  const handleManualClean = () => {
    if (confirm('智能清理将优化存储空间：\n\n• 每个聊天保留最近 500 条消息\n• 朋友圈保留最近 200 条\n\n您的重要聊天记忆会被保留，是否继续？')) {
      manualCleanStorage()
      setStorageInfo(getStorageInfo())
      alert('智能清理完成！已优化存储空间')
    }
  }

  // 压缩数据（移除冗余字段）
  const handleCompressData = () => {
    if (confirm('压缩数据将移除消息中的冗余字段，优化存储效率。\n\n注意：此操作不会删除聊天内容，是否继续？')) {
      compressStorageData()
      setStorageInfo(getStorageInfo())
      alert('数据压缩完成！')
    }
  }

  // 保存气泡设置
  const handleSaveBubbleSettings = () => {
    localStorage.setItem('user_bubble_color', userBubbleColor)
    localStorage.setItem('ai_bubble_color', aiBubbleColor)
    localStorage.setItem('user_bubble_css', userBubbleCSS)
    localStorage.setItem('ai_bubble_css', aiBubbleCSS)
    alert('气泡设置已保存！')
    setShowBubbleSettings(false)
  }

  // 重置气泡设置
  const handleResetBubbleSettings = () => {
    if (confirm('确定要重置气泡设置为默认值吗？')) {
      const defaultUserColor = '#95EC69'
      const defaultAiColor = '#FFFFFF'
      setUserBubbleColor(defaultUserColor)
      setAiBubbleColor(defaultAiColor)
      setUserBubbleCSS('')
      setAiBubbleCSS('')
      localStorage.setItem('user_bubble_color', defaultUserColor)
      localStorage.setItem('ai_bubble_color', defaultAiColor)
      localStorage.removeItem('user_bubble_css')
      localStorage.removeItem('ai_bubble_css')
      alert('气泡设置已重置！')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题栏 - 玻璃效果 */}
      <div className="glass-effect px-4 py-3 flex items-center justify-between border-b border-gray-200/50">
        <button
          onClick={() => navigate(-1)}
          className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
        >
          <BackIcon size={24} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
          设置
        </h1>
        <div className="w-6"></div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3 pb-20">
        {/* API配置 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-xs text-gray-500 font-medium">API设置</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div 
              onClick={() => navigate('/api-list')}
              className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer"
            >
              <span className="text-gray-900 font-medium">API管理</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </div>
        </div>

        {/* 通用设置 */}
        <div className="mb-3">
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* 账号与安全 */}
            <div className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer border-b border-gray-100">
              <span className="text-gray-900 font-medium">账号与安全</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>

            {/* 新消息通知 */}
            <div className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer border-b border-gray-100">
              <span className="text-gray-900 font-medium">新消息通知</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>

            {/* 隐私 */}
            <div className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer">
              <span className="text-gray-900 font-medium">隐私</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </div>
        </div>

        {/* 显示设置 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-xs text-gray-500 font-medium">显示设置</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* 状态栏开关 */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex-1">
                <div className="text-gray-900 font-medium mb-0.5">显示状态栏</div>
                <div className="text-xs text-gray-500">显示顶部时间、信号和电池信息</div>
              </div>
              <button
                onClick={toggleStatusBar}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  showStatusBar ? 'bg-wechat-primary' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    showStatusBar ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>

            {/* 全局气泡自定义 */}
            <div 
              className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer border-b border-gray-100"
              onClick={() => setShowBubbleSettings(true)}
            >
              <div className="flex-1">
                <div className="text-gray-900 font-medium mb-0.5">全局聊天气泡</div>
                <div className="text-xs text-gray-500">应用于所有聊天，可在单个聊天中覆盖</div>
              </div>
              <span className="text-gray-400 text-xl">›</span>
            </div>

            {/* 全局背景 */}
            <div className="px-4 py-4">
              <div className="mb-3">
                <div className="text-gray-900 font-medium mb-0.5">全局背景</div>
                <div className="text-xs text-gray-500">应用于微信、联系人、发现等主界面</div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
              />
              
              <div className="flex items-center gap-3">
                {/* 背景缩略图 */}
                <div 
                  className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 flex items-center justify-center"
                  style={{
                    backgroundImage: backgroundPreview ? `url(${backgroundPreview})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: backgroundPreview ? 'transparent' : '#f5f7fa'
                  }}
                >
                  {!backgroundPreview && (
                    <ImageIcon size={32} className="text-gray-400" />
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2.5 bg-wechat-primary text-white rounded-xl ios-button font-medium text-sm"
                  >
                    {isUploading ? '上传中...' : backgroundPreview ? '更换' : '上传背景'}
                  </button>
                  {backgroundPreview && (
                    <button
                      onClick={handleRemoveBackground}
                      className="px-4 py-2.5 glass-card text-gray-700 rounded-xl ios-button font-medium text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 存储管理 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-xs text-gray-500 font-medium">存储管理</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* 存储使用情况 */}
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-900 font-medium">存储空间</span>
                <span className="text-sm text-gray-500">{storageInfo.used} KB / {storageInfo.total} KB</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    storageInfo.percentage > 80 ? 'bg-red-500' : 
                    storageInfo.percentage > 60 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">已使用 {storageInfo.percentage}%</div>
            </div>

            {/* 智能清理 */}
            <div 
              onClick={handleManualClean}
              className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer border-b border-gray-100"
            >
              <div className="flex-1">
                <div className="text-gray-900 font-medium">智能清理</div>
                <div className="text-xs text-gray-500">保留最近500条消息，释放存储空间</div>
              </div>
              <span className="text-gray-400 text-xl">›</span>
            </div>

            {/* 压缩数据 */}
            <div 
              onClick={handleCompressData}
              className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer border-b border-gray-100"
            >
              <div className="flex-1">
                <div className="text-gray-900 font-medium">压缩数据</div>
                <div className="text-xs text-gray-500">移除冗余字段，优化存储效率</div>
              </div>
              <span className="text-gray-400 text-xl">›</span>
            </div>

            {/* 清理聊天记录 */}
            <div 
              onClick={handleClearChatHistory}
              className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer border-b border-gray-100"
            >
              <span className="text-gray-900 font-medium">清理聊天记录</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>

            {/* 清除所有缓存 */}
            <div 
              onClick={handleClearCache}
              className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer"
            >
              <span className="text-red-500 font-medium">清除所有缓存</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </div>
        </div>

        {/* 其他设置 */}
        <div className="mb-3">
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* 通用 */}
            <div className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer border-b border-gray-100">
              <span className="text-gray-900 font-medium">通用</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>

            {/* 帮助与反馈 */}
            <div className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer border-b border-gray-100">
              <span className="text-gray-900 font-medium">帮助与反馈</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>
            
            {/* 关于汁汁 */}
            <div 
              onClick={() => navigate('/about')}
              className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer"
            >
              <span className="text-gray-900 font-medium">关于汁汁</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">v1.0.0</span>
                <span className="text-gray-400 text-xl">›</span>
              </div>
            </div>
          </div>
        </div>

        {/* 更新日志 */}
        <div className="mb-3">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div 
              onClick={() => navigate('/changelog')}
              className="flex items-center justify-between px-4 py-4 ios-button cursor-pointer"
            >
              <span className="text-gray-900 font-medium">更新日志</span>
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </div>
        </div>

        {/* 退出登录 */}
        <div className="mb-6">
          <button className="w-full glass-card rounded-2xl px-4 py-4 text-red-500 font-medium ios-button">
            退出登录
          </button>
        </div>
      </div>

      {/* 气泡设置模态框 */}
      {showBubbleSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 glass-effect px-6 py-4 border-b border-gray-200/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">聊天气泡设置</h2>
              <button
                onClick={() => setShowBubbleSettings(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 用户气泡设置 */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">我的气泡（发送）</h3>
                
                {/* 颜色选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    气泡颜色
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={userBubbleColor}
                      onChange={(e) => setUserBubbleColor(e.target.value)}
                      className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={userBubbleColor}
                      onChange={(e) => setUserBubbleColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wechat-primary"
                      placeholder="#95EC69"
                    />
                  </div>
                </div>

                {/* 自定义CSS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自定义CSS（高级）
                  </label>
                  <textarea
                    value={userBubbleCSS}
                    onChange={(e) => setUserBubbleCSS(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wechat-primary font-mono text-sm resize-none"
                    placeholder="例如：&#10;background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);&#10;border-radius: 16px;&#10;box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    输入CSS样式代码，将直接应用到气泡上
                  </p>
                </div>

                {/* 预览 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预览效果
                  </label>
                  <div className="flex justify-end">
                    <div
                      className="px-4 py-3 rounded-2xl text-gray-900 max-w-xs"
                      style={{
                        backgroundColor: userBubbleColor,
                        ...Object.fromEntries(
                          userBubbleCSS.split(';').filter(s => s.trim()).map(s => {
                            const [key, value] = s.split(':').map(s => s.trim())
                            return [key.replace(/-([a-z])/g, (g) => g[1].toUpperCase()), value]
                          })
                        )
                      }}
                    >
                      这是我发送的消息
                    </div>
                  </div>
                </div>
              </div>

              {/* 分隔线 */}
              <div className="border-t border-gray-200"></div>

              {/* AI气泡设置 */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">对方气泡（接收）</h3>
                
                {/* 颜色选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    气泡颜色
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={aiBubbleColor}
                      onChange={(e) => setAiBubbleColor(e.target.value)}
                      className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={aiBubbleColor}
                      onChange={(e) => setAiBubbleColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wechat-primary"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                {/* 自定义CSS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自定义CSS（高级）
                  </label>
                  <textarea
                    value={aiBubbleCSS}
                    onChange={(e) => setAiBubbleCSS(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wechat-primary font-mono text-sm resize-none"
                    placeholder="例如：&#10;background: #FFFFFF;&#10;border: 1px solid #E5E5E5;&#10;box-shadow: 0 2px 8px rgba(0,0,0,0.08);"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    输入CSS样式代码，将直接应用到气泡上
                  </p>
                </div>

                {/* 预览 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预览效果
                  </label>
                  <div className="flex justify-start">
                    <div
                      className="px-4 py-3 rounded-2xl text-gray-900 max-w-xs"
                      style={{
                        backgroundColor: aiBubbleColor,
                        ...Object.fromEntries(
                          aiBubbleCSS.split(';').filter(s => s.trim()).map(s => {
                            const [key, value] = s.split(':').map(s => s.trim())
                            return [key.replace(/-([a-z])/g, (g) => g[1].toUpperCase()), value]
                          })
                        )
                      }}
                    >
                      这是对方发送的消息
                    </div>
                  </div>
                </div>
              </div>

              {/* 按钮组 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleResetBubbleSettings}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl ios-button font-medium"
                >
                  重置为默认
                </button>
                <button
                  onClick={handleSaveBubbleSettings}
                  className="flex-1 px-4 py-3 bg-wechat-primary text-white rounded-xl ios-button font-medium"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings

