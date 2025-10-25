import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

interface CustomFont {
  id: string
  name: string
  url: string
  fontFamily: string
  createdAt: number
}

const FontCustomizer = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  
  // 从localStorage读取自定义字体列表
  const [customFonts, setCustomFonts] = useState<CustomFont[]>(() => {
    const saved = localStorage.getItem('custom_fonts')
    return saved ? JSON.parse(saved) : []
  })
  
  // 当前使用的字体
  const [currentFont, setCurrentFont] = useState(() => {
    const saved = localStorage.getItem('chat_font_family')
    return saved || 'system'
  })
  
  // 添加字体表单
  const [showAddForm, setShowAddForm] = useState(false)
  const [fontName, setFontName] = useState('')
  const [fontUrl, setFontUrl] = useState('')
  const [fontFamily, setFontFamily] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewText, setPreviewText] = useState('你好，这是预览文字')
  const [loadingFonts, setLoadingFonts] = useState(false)
  
  // 字体加载缓存（避免重复加载）
  const loadedFontsCache = useRef<Set<string>>(new Set())

  // 保存自定义字体到localStorage
  const saveCustomFonts = (fonts: CustomFont[]) => {
    localStorage.setItem('custom_fonts', JSON.stringify(fonts))
    setCustomFonts(fonts)
  }

  // 加载字体（带缓存和超时）
  const loadFont = async (font: CustomFont) => {
    // 检查是否已加载
    if (loadedFontsCache.current.has(font.id)) {
      console.log(`⚡ 字体已缓存: ${font.name}`)
      return true
    }
    
    try {
      // 检查字体是否已在document.fonts中
      const existingFont = Array.from(document.fonts).find(
        (f: any) => f.family === font.fontFamily
      )
      
      if (existingFont) {
        loadedFontsCache.current.add(font.id)
        console.log(`⚡ 字体已存在: ${font.name}`)
        return true
      }
      
      const fontFace = new FontFace(font.fontFamily, `url(${font.url})`, {
        display: 'swap'
      })
      
      // 添加超时机制（10秒）
      const loadPromise = fontFace.load()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('字体加载超时')), 10000)
      })
      
      await Promise.race([loadPromise, timeoutPromise])
      document.fonts.add(fontFace)
      loadedFontsCache.current.add(font.id)
      console.log(`✅ 字体加载成功: ${font.name}`)
      return true
    } catch (error) {
      console.error(`❌ 字体加载失败: ${font.name}`, error)
      return false
    }
  }

  // 添加自定义字体
  const handleAddFont = async () => {
    if (!fontName.trim() || !fontUrl.trim() || !fontFamily.trim()) {
      alert('请填写完整的字体信息')
      return
    }

    setIsLoading(true)

    try {
      const newFont: CustomFont = {
        id: `custom_${Date.now()}`,
        name: fontName.trim(),
        url: fontUrl.trim(),
        fontFamily: fontFamily.trim(),
        createdAt: Date.now()
      }

      // 尝试加载字体
      const success = await loadFont(newFont)
      
      if (success) {
        const updatedFonts = [...customFonts, newFont]
        saveCustomFonts(updatedFonts)
        
        // 清空表单
        setFontName('')
        setFontUrl('')
        setFontFamily('')
        setShowAddForm(false)
        
        alert('字体添加成功！')
      } else {
        alert('字体加载失败，请检查：\n\n1. 字体链接是否正确\n2. 链接是否支持跨域（CORS）\n3. 网络连接是否正常')
      }
    } catch (error) {
      console.error('添加字体失败:', error)
      alert('添加字体失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsLoading(false)
    }
  }

  // 删除自定义字体
  const handleDeleteFont = (fontId: string) => {
    if (confirm('确定要删除这个字体吗？')) {
      const updatedFonts = customFonts.filter(f => f.id !== fontId)
      saveCustomFonts(updatedFonts)
      
      // 如果删除的是当前使用的字体，切换回系统默认
      if (currentFont === fontId) {
        applyFont('system', 'system')
      }
    }
  }

  // 应用字体
  const applyFont = (fontId: string, fontFamilyValue: string) => {
    localStorage.setItem('chat_font_family', fontId)
    localStorage.setItem('chat_font_family_value', fontFamilyValue)
    setCurrentFont(fontId)
    
    // 应用到全局
    if (fontId === 'system') {
      document.documentElement.style.removeProperty('--chat-font-family')
    } else {
      document.documentElement.style.setProperty('--chat-font-family', fontFamilyValue)
    }
    
    // 触发storage事件
    window.dispatchEvent(new Event('storage'))
  }

  // 初始化：加载所有自定义字体
  useEffect(() => {
    const loadAllFonts = async () => {
      if (customFonts.length === 0) return
      
      setLoadingFonts(true)
      console.log(`🔄 开始加载 ${customFonts.length} 个字体...`)
      
      // 并行加载所有字体（更快）
      const loadPromises = customFonts.map(font => loadFont(font))
      await Promise.all(loadPromises)
      
      setLoadingFonts(false)
      console.log(`✅ 所有字体加载完成`)
    }
    loadAllFonts()
    
    // 应用当前字体
    const savedFontValue = localStorage.getItem('chat_font_family_value')
    if (savedFontValue && currentFont !== 'system') {
      document.documentElement.style.setProperty('--chat-font-family', savedFontValue)
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 border-b border-gray-200/50 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">‹</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">字体设置</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-2xl">{showAddForm ? '×' : '+'}</span>
        </button>
      </div>

      {/* 字体列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        {/* 加载提示 */}
        {loadingFonts && (
          <div className="glass-card rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm text-gray-600">正在加载字体...</span>
          </div>
        )}
        {/* 添加字体表单 */}
        {showAddForm && (
          <div className="glass-card rounded-2xl p-5 mb-4">
            <h3 className="font-bold text-gray-900 text-base mb-4">添加自定义字体</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">字体名称</label>
                <input
                  type="text"
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  placeholder="例如：我的字体"
                  className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-1 block">字体链接（URL）</label>
                <input
                  type="text"
                  value={fontUrl}
                  onChange={(e) => setFontUrl(e.target.value)}
                  placeholder="https://example.com/font.woff2"
                  className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-1 block">字体族名称（font-family）</label>
                <input
                  type="text"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  placeholder="例如：MyCustomFont"
                  className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 预览 */}
              {fontFamily && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">预览文字</label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <div className="bg-white/50 rounded-xl p-4 border border-gray-200">
                    <div style={{ fontFamily: fontFamily }} className="text-base">
                      {previewText}
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleAddFont}
                disabled={isLoading || !fontName.trim() || !fontUrl.trim() || !fontFamily.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium ios-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '加载中...' : '添加字体'}
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 mb-2">💡 使用提示：</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• 支持 .woff2, .woff, .ttf, .otf 格式</li>
                <li>• 推荐使用 .woff2 格式，体积小加载快</li>
                <li>• 字体链接必须支持跨域访问（CORS）</li>
                <li>• 可以使用 Google Fonts、字体天下等网站</li>
              </ul>
            </div>
          </div>
        )}

        {/* 系统默认字体 */}
        <div
          onClick={() => applyFont('system', 'system')}
          className={`glass-card rounded-2xl p-5 ios-button cursor-pointer transition-all mb-3 ${
            currentFont === 'system' 
              ? 'ring-2 ring-blue-500 shadow-lg' 
              : 'hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-base">系统默认</h3>
                {currentFont === 'system' && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    使用中
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">使用系统默认字体</p>
            </div>
          </div>
          <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
            <div className="text-gray-900 leading-relaxed">
              <div className="text-base mb-2">你好，这是系统默认字体</div>
              <div className="text-sm text-gray-600">The quick brown fox jumps over the lazy dog</div>
            </div>
          </div>
        </div>

        {/* 自定义字体列表 */}
        <div className="space-y-3">
          {customFonts.map((font) => (
            <div
              key={font.id}
              className={`glass-card rounded-2xl p-5 transition-all ${
                currentFont === font.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-base">{font.name}</h3>
                    {currentFont === font.id && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        使用中
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{font.url}</p>
                </div>
                <button
                  onClick={() => handleDeleteFont(font.id)}
                  className="ml-2 w-8 h-8 flex items-center justify-center ios-button text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                <div 
                  className="text-gray-900 leading-relaxed"
                  style={{ fontFamily: font.fontFamily }}
                >
                  <div className="text-base mb-2">你好，这是{font.name}</div>
                  <div className="text-sm text-gray-600">The quick brown fox jumps over the lazy dog</div>
                  <div className="text-xs text-gray-500 mt-2">0123456789 ！@#￥%……&*（）</div>
                </div>
              </div>
              
              <button
                onClick={() => applyFont(font.id, font.fontFamily)}
                className="w-full mt-3 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium ios-button"
              >
                使用这个字体
              </button>
            </div>
          ))}
        </div>

        {customFonts.length === 0 && !showAddForm && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500 text-sm mb-2">还没有自定义字体</p>
            <p className="text-gray-400 text-xs">点击右上角 + 添加字体</p>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-6 glass-card rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-3">💡 使用说明</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <p>• 点击右上角 + 添加自定义字体</p>
            <p>• 输入字体名称、链接和 font-family 名称</p>
            <p>• 支持在线字体链接（需支持跨域）</p>
            <p>• 可以从 Google Fonts 等网站获取字体链接</p>
            <p>• 字体会自动保存，下次打开仍然可用</p>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  )
}

export default FontCustomizer
