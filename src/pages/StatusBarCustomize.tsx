/**
 * 状态栏美化设置页面
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { BackIcon } from '../components/Icons'
import { useSettings } from '../context/SettingsContext'

const StatusBarCustomize = () => {
  const navigate = useNavigate()
  const { showStatusBar, toggleStatusBar } = useSettings()
  
  // 专注模式相关状态
  const [focusMode, setFocusMode] = useState(() => {
    const saved = localStorage.getItem('focus_mode')
    return saved ? JSON.parse(saved) : null
  })
  const [focusModeIcon, setFocusModeIcon] = useState(focusMode?.icon || '')
  const [focusModeName, setFocusModeName] = useState(focusMode?.name || '')
  const [focusModeColor, setFocusModeColor] = useState(focusMode?.color || '#9333ea')
  const [focusModeShowBg, setFocusModeShowBg] = useState(focusMode?.showBg !== false)
  const focusModeIconInputRef = useRef<HTMLInputElement>(null)
  
  // 时间显示背景色
  const [timeBackgroundEnabled, setTimeBackgroundEnabled] = useState(() => {
    const saved = localStorage.getItem('time_background_enabled')
    return saved === 'true'
  })
  
  const [timeBackgroundColor, setTimeBackgroundColor] = useState(() => {
    return localStorage.getItem('time_background_color') || '#22c55e'
  })

  // 保存专注模式设置
  const handleToggleFocusMode = () => {
    if (focusMode) {
      setFocusMode(null)
      localStorage.removeItem('focus_mode')
      setFocusModeIcon('')
      setFocusModeName('')
    } else {
      const newMode = {
        icon: focusModeIcon,
        name: focusModeName,
        color: focusModeColor,
        showBg: focusModeShowBg
      }
      setFocusMode(newMode)
      localStorage.setItem('focus_mode', JSON.stringify(newMode))
    }
  }

  // 更新专注模式配置
  const updateFocusMode = (updates: any) => {
    if (focusMode) {
      const newMode = { ...focusMode, ...updates }
      setFocusMode(newMode)
      localStorage.setItem('focus_mode', JSON.stringify(newMode))
    }
  }

  // 图标上传
  const handleFocusModeIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setFocusModeIcon(dataUrl)
        updateFocusMode({ icon: dataUrl })
      }
      reader.readAsDataURL(file)
    }
  }

  // 保存时间背景色设置
  const handleToggleTimeBackground = () => {
    const newValue = !timeBackgroundEnabled
    setTimeBackgroundEnabled(newValue)
    localStorage.setItem('time_background_enabled', String(newValue))
  }

  const handleTimeColorChange = (color: string) => {
    setTimeBackgroundColor(color)
    localStorage.setItem('time_background_color', color)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <BackIcon size={24} />
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">状态栏美化</h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="glass-card rounded-2xl m-4 overflow-hidden backdrop-blur-md bg-white/80 border border-white/50">
          
          {/* 显示状态栏 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <div className="flex-1">
              <div className="text-gray-900 font-medium mb-0.5">显示状态栏</div>
              <div className="text-xs text-gray-500">显示顶部时间、信号和电池信息</div>
            </div>
            <button
              onClick={toggleStatusBar}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                showStatusBar ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  showStatusBar ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* 专注模式 */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="text-gray-900 font-medium mb-0.5">专注模式</div>
                <div className="text-xs text-gray-500">在状态栏显示自定义图标和文字</div>
              </div>
              <button
                onClick={handleToggleFocusMode}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  focusMode ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    focusMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>
            
            {/* 专注模式自定义 */}
            {focusMode && (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                {/* 图标上传 */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">图标</label>
                  <input
                    ref={focusModeIconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFocusModeIconUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    {focusModeIcon && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                        <img src={focusModeIcon} alt="图标" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <button
                      onClick={() => focusModeIconInputRef.current?.click()}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs"
                    >
                      {focusModeIcon ? '更换图标' : '上传图标'}
                    </button>
                    {focusModeIcon && (
                      <button
                        onClick={() => {
                          setFocusModeIcon('')
                          updateFocusMode({ icon: '' })
                        }}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 名称 */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">名称</label>
                  <input
                    type="text"
                    value={focusModeName}
                    onChange={(e) => {
                      setFocusModeName(e.target.value)
                      updateFocusMode({ name: e.target.value })
                    }}
                    placeholder="请输入模式名称"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                
                {/* 显示背景开关 */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-600">显示背景色</label>
                  <button
                    onClick={() => {
                      const newValue = !focusModeShowBg
                      setFocusModeShowBg(newValue)
                      updateFocusMode({ showBg: newValue })
                    }}
                    className={`relative w-12 h-6 rounded-full transition-all ${
                      focusModeShowBg ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                        focusModeShowBg ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
                
                {/* 背景颜色选择 */}
                {focusModeShowBg && (
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">背景颜色</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={focusModeColor}
                        onChange={(e) => {
                          setFocusModeColor(e.target.value)
                          updateFocusMode({ color: e.target.value })
                        }}
                        className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={focusModeColor}
                        onChange={(e) => {
                          setFocusModeColor(e.target.value)
                          updateFocusMode({ color: e.target.value })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                        placeholder="#9333ea"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 时间显示 */}
          <div className="px-4 py-4">
            <div className="text-gray-900 font-medium mb-4">时间显示</div>
            
            {/* 显示背景色开关 */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-700">显示背景色</div>
              <button
                onClick={handleToggleTimeBackground}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                  timeBackgroundEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    timeBackgroundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></div>
              </button>
            </div>
            
            {/* 背景颜色选择 */}
            {timeBackgroundEnabled && (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700">背景颜色</div>
                <div className="flex-1 flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    style={{ backgroundColor: timeBackgroundColor }}
                    onClick={() => document.getElementById('color-picker')?.click()}
                  />
                  <input
                    id="color-picker"
                    type="color"
                    value={timeBackgroundColor}
                    onChange={(e) => handleTimeColorChange(e.target.value)}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={timeBackgroundColor}
                    onChange={(e) => handleTimeColorChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatusBarCustomize
