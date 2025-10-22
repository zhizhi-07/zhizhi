import { useNavigate, useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { BackIcon, ImageIcon } from '../components/Icons'
import { useCharacter } from '../context/CharacterContext'
import { useBackground } from '../context/BackgroundContext'
import memoryIcon from '../assets/memory-icon.png'
import memorySummaryIcon from '../assets/memory-summary-icon.png'
import diaryIcon from '../assets/diary-icon.png'
import { blacklistManager } from '../utils/blacklistManager'
import { ScheduleSettings } from '../components/ScheduleSettings'

// 拉黑图标 - 使用绝对路径
const blockedIcon = '/拉黑.png'
const notBlockedIcon = '/没有拉黑.png'

const ChatSettings = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getCharacter } = useCharacter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const character = id ? getCharacter(id) : undefined
  const { background, setBackground } = useBackground()

  const [narratorEnabled, setNarratorEnabled] = useState(() => {
    const saved = localStorage.getItem(`narrator_enabled_${id}`)
    return saved === 'true'
  })

  const [aiMomentsEnabled, setAiMomentsEnabled] = useState(() => {
    const saved = localStorage.getItem(`ai_moments_enabled_${id}`)
    return saved === 'true'
  })

  const [aiProactiveEnabled, setAiProactiveEnabled] = useState(() => {
    const saved = localStorage.getItem(`ai_proactive_enabled_${id}`)
    return saved === 'true'
  })

  const [aiMessageLimit, setAiMessageLimit] = useState(() => {
    const saved = localStorage.getItem('ai_message_limit')
    return saved ? parseInt(saved) : 15
  })

  // 记忆总结间隔设置
  const [memorySummaryInterval, setMemorySummaryInterval] = useState(() => {
    const saved = localStorage.getItem(`memory_summary_interval_${id}`)
    return saved ? parseInt(saved) : 30
  })

  // 气泡设置
  const [userBubbleColor, setUserBubbleColor] = useState(() => {
    return localStorage.getItem(`user_bubble_color_${id}`) || ''
  })
  const [aiBubbleColor, setAiBubbleColor] = useState(() => {
    return localStorage.getItem(`ai_bubble_color_${id}`) || ''
  })
  const [userBubbleCSS, setUserBubbleCSS] = useState(() => {
    return localStorage.getItem(`user_bubble_css_${id}`) || ''
  })
  const [aiBubbleCSS, setAiBubbleCSS] = useState(() => {
    return localStorage.getItem(`ai_bubble_css_${id}`) || ''
  })
  const [showBubbleSettings, setShowBubbleSettings] = useState(false)
  const [showScheduleSettings, setShowScheduleSettings] = useState(false)

  // 拉黑状态
  const [isBlocked, setIsBlocked] = useState(() => {
    if (!id) return false
    const status = blacklistManager.getBlockStatus('user', id)
    return status.blockedByMe
  })

  const [isUploading, setIsUploading] = useState(false)
  const [backgroundPreview, setBackgroundPreview] = useState(background)

  useEffect(() => {
    setBackgroundPreview(background)
  }, [background])

  // 处理壁纸上传
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 限制图片大小为2MB，防止存储空间溢出
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB，请压缩后上传')
      return
    }

    setIsUploading(true)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setBackgroundPreview(base64String)
      setBackground(base64String)
      console.log('🎨 壁纸已上传并保存到全局背景')
      setIsUploading(false)
    }
    reader.onerror = () => {
      alert('图片读取失败')
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // 删除壁纸
  const handleRemoveBackground = () => {
    setBackground('')
    setBackgroundPreview('')
    console.log('🎨 壁纸已删除')
  }

  // 切换旁白功能
  const handleToggleNarrator = () => {
    const newValue = !narratorEnabled
    setNarratorEnabled(newValue)
    if (id) {
      localStorage.setItem(`narrator_enabled_${id}`, String(newValue))
    }
  }

  // 切换AI朋友圈功能
  const handleToggleAiMoments = () => {
    const newValue = !aiMomentsEnabled
    setAiMomentsEnabled(newValue)
    if (id) {
      localStorage.setItem(`ai_moments_enabled_${id}`, String(newValue))
    }
  }

  // 切换AI主动发消息功能
  const handleToggleAiProactive = () => {
    const newValue = !aiProactiveEnabled
    setAiProactiveEnabled(newValue)
    if (id) {
      localStorage.setItem(`ai_proactive_enabled_${id}`, String(newValue))
      // 触发storage事件，通知ChatDetail页面
      window.dispatchEvent(new Event('storage'))
    }
  }

  // 更新AI消息数量限制
  const handleUpdateMessageLimit = (value: number) => {
    setAiMessageLimit(value)
    localStorage.setItem('ai_message_limit', String(value))
  }

  // 更新记忆总结间隔
  const handleUpdateMemorySummaryInterval = (value: number) => {
    setMemorySummaryInterval(value)
    if (id) {
      localStorage.setItem(`memory_summary_interval_${id}`, String(value))
      // 触发storage事件，通知ChatDetail页面
      window.dispatchEvent(new Event('storage'))
    }
  }

  // 保存气泡设置
  const handleSaveBubbleSettings = () => {
    if (id) {
      localStorage.setItem(`user_bubble_color_${id}`, userBubbleColor)
      localStorage.setItem(`ai_bubble_color_${id}`, aiBubbleColor)
      localStorage.setItem(`user_bubble_css_${id}`, userBubbleCSS)
      localStorage.setItem(`ai_bubble_css_${id}`, aiBubbleCSS)
      alert('气泡设置已保存！')
      setShowBubbleSettings(false)
    }
  }

  // 重置气泡设置（使用全局设置）
  const handleResetBubbleSettings = () => {
    if (confirm('确定要重置为全局气泡设置吗？')) {
      setUserBubbleColor('')
      setAiBubbleColor('')
      setUserBubbleCSS('')
      setAiBubbleCSS('')
      if (id) {
        localStorage.removeItem(`user_bubble_color_${id}`)
        localStorage.removeItem(`ai_bubble_color_${id}`)
        localStorage.removeItem(`user_bubble_css_${id}`)
        localStorage.removeItem(`ai_bubble_css_${id}`)
      }
      alert('已重置为全局气泡设置！')
    }
  }

  // 切换拉黑状态
  const handleToggleBlacklist = () => {
    if (!id || !character) return
    
    const newStatus = blacklistManager.toggleBlock('user', id)
    setIsBlocked(newStatus)
    
    if (newStatus) {
      alert(`已将 ${character.name} 加入黑名单\n\nTA发送的消息将显示警告图标⚠️\nAI会意识到被拉黑`)
    } else {
      alert(`已将 ${character.name} 移出黑名单`)
    }
  }

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">角色不存在</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-10 bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
        >
          <BackIcon size={24} />
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          聊天设置
        </h1>
        <div className="w-6"></div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3 pb-20">
        {/* 角色信息 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">聊天对象</span>
          </div>
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
              {character.avatar?.startsWith('data:image') ? (
                <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{character.avatar || '🤖'}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{character.name}</h3>
              <p className="text-sm text-gray-500">{character.username}</p>
            </div>
            <button
              onClick={() => navigate(`/character/${character.id}`)}
              className="text-sm text-primary ios-button"
            >
              查看详情
            </button>
          </div>
        </div>

        {/* AI记忆查看 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">AI 记忆</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* 查看记忆 */}
            <div 
              className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
              onClick={() => navigate(`/memory/${id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src={memoryIcon} alt="记忆" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">查看记忆</h3>
                  <p className="text-xs text-gray-500">查看 AI 记住的关于你的信息</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            {/* 记忆总结 */}
            <div 
              className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
              onClick={() => navigate(`/memory-summary/${id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src={memorySummaryIcon} alt="记忆总结" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">记忆总结</h3>
                  <p className="text-xs text-gray-500">AI 总结当前对话的重要信息</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            {/* TA的日记 */}
            <div 
              className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => navigate(`/diary/${id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src={diaryIcon} alt="日记" className="w-10 h-10 object-contain" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">TA的日记</h3>
                  <p className="text-xs text-gray-500">查看 TA 写的日记</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* 记忆总结间隔设置 */}
            <div className="px-4 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">总结间隔</h3>
                  <p className="text-xs text-gray-500">每隔多少轮对话自动总结</p>
                </div>
                <span className="text-sm font-semibold text-wechat-primary">{memorySummaryInterval} 轮</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={memorySummaryInterval}
                onChange={(e) => handleUpdateMemorySummaryInterval(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-wechat-primary"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10轮</span>
                <span>100轮</span>
              </div>
            </div>
          </div>
        </div>

        {/* 聊天壁纸 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">聊天壁纸</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            
            <div className="px-4 py-4 flex items-center gap-3">
              {/* 壁纸缩略图 */}
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
                  {isUploading ? '上传中...' : backgroundPreview ? '更换' : '上传壁纸'}
                </button>
                {backgroundPreview && (
                  <button
                    onClick={handleRemoveBackground}
                    className="px-4 py-2.5 glass-card text-gray-700 rounded-xl ios-button font-medium text-sm"
                  >
                    移除
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 旁白功能 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">旁白功能</span>
            <p className="text-xs text-gray-400 mt-1">AI会用旁白描述动作、表情、环境等</p>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={handleToggleNarrator}
              className="w-full px-4 py-4 flex items-center justify-between ios-button"
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="font-medium text-gray-900">启用旁白</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {narratorEnabled ? '已开启' : '已关闭'}
                  </div>
                </div>
              </div>
              <div 
                className={`w-12 h-7 rounded-full transition-all ${
                  narratorEnabled ? 'bg-wechat-primary' : 'bg-gray-300'
                }`}
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full mt-1 transition-all shadow-md ${
                    narratorEnabled ? 'ml-6' : 'ml-1'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* AI读取消息数量 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">AI记忆长度</span>
            <p className="text-xs text-gray-400 mt-1">AI每次回复时读取的历史消息数量（包含通话记录）</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900">读取消息数</span>
              <span className="text-lg font-semibold text-wechat-primary">{aiMessageLimit} 条</span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={aiMessageLimit}
              onChange={(e) => handleUpdateMessageLimit(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-wechat-primary"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>5条</span>
              <span>100条</span>
              <span>200条</span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 提示：数量越大，AI记忆越完整，但API消耗越多。建议30-100条。
            </p>
          </div>
        </div>

        {/* AI朋友圈功能 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">AI朋友圈</span>
            <p className="text-xs text-gray-400 mt-1">AI会主动发布朋友圈，并与你的朋友圈互动</p>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={handleToggleAiMoments}
              className="w-full px-4 py-4 flex items-center justify-between ios-button"
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="font-medium text-gray-900">启用AI朋友圈</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {aiMomentsEnabled ? '已开启 - AI会主动发布和互动' : '已关闭'}
                  </div>
                </div>
              </div>
              <div 
                className={`w-12 h-7 rounded-full transition-all ${
                  aiMomentsEnabled ? 'bg-wechat-primary' : 'bg-gray-300'
                }`}
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full mt-1 transition-all shadow-md ${
                    aiMomentsEnabled ? 'ml-6' : 'ml-1'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* AI主动发消息功能 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">AI主动发消息</span>
            <p className="text-xs text-gray-400 mt-1">AI会像真人一样主动发消息给你</p>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={handleToggleAiProactive}
              className="w-full px-4 py-4 flex items-center justify-between ios-button border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="font-medium text-gray-900">启用主动发消息</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {aiProactiveEnabled ? '已开启 - AI会主动找你聊天' : '已关闭'}
                  </div>
                </div>
              </div>
              <div 
                className={`w-12 h-7 rounded-full transition-all ${
                  aiProactiveEnabled ? 'bg-wechat-primary' : 'bg-gray-300'
                }`}
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full mt-1 transition-all shadow-md ${
                    aiProactiveEnabled ? 'ml-6' : 'ml-1'
                  }`}
                />
              </div>
            </button>

            {/* 定时消息设置 */}
            <button
              onClick={() => setShowScheduleSettings(true)}
              className="w-full px-4 py-4 flex items-center justify-between ios-button"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900">定时消息设置</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    设置早安、晚安等定时问候
                  </div>
                </div>
              </div>
              <span className="text-gray-400 text-xl">›</span>
            </button>
          </div>
        </div>

        {/* 聊天气泡设置 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">聊天气泡</span>
            <p className="text-xs text-gray-400 mt-1">自定义此聊天的气泡样式，优先于全局设置</p>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowBubbleSettings(true)}
              className="w-full px-4 py-4 flex items-center justify-between ios-button"
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="font-medium text-gray-900">气泡样式</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {userBubbleColor || aiBubbleColor ? '已自定义' : '使用全局设置'}
                  </div>
                </div>
              </div>
              <span className="text-gray-400 text-xl">›</span>
            </button>
          </div>
        </div>

        {/* 拉黑功能 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">黑名单</span>
            <p className="text-xs text-gray-400 mt-1">拉黑后，对方的消息会显示警告图标，AI会意识到被拉黑</p>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={handleToggleBlacklist}
              className="w-full px-4 py-4 flex items-center justify-between ios-button"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src={isBlocked ? blockedIcon : notBlockedIcon} 
                    alt={isBlocked ? '已拉黑' : '未拉黑'} 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {isBlocked ? '已拉黑' : '未拉黑'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {isBlocked ? 'TA的消息会显示警告图标' : '正常聊天状态'}
                  </div>
                </div>
              </div>
              <div 
                className={`w-12 h-7 rounded-full transition-all ${
                  isBlocked ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <div 
                  className={`w-5 h-5 bg-white rounded-full mt-1 transition-all shadow-md ${
                    isBlocked ? 'ml-6' : 'ml-1'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* 危险操作 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-red-600 font-medium">危险操作</span>
            <p className="text-xs text-gray-400 mt-1">以下操作不可恢复，请谨慎操作</p>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={() => {
                if (confirm(`确定要清除与 ${character.name} 的所有聊天记录吗？\n\n将会清除：\n• 所有聊天消息\n• TA的日记\n• AI记忆\n• 记忆总结\n• 续火花记录\n\n此操作不可恢复！`)) {
                  if (confirm('再次确认：真的要清除所有数据吗？')) {
                    // 清除聊天消息
                    localStorage.removeItem(`chat_messages_${id}`)
                    // 清除日记
                    localStorage.removeItem(`diaries_${id}`)
                    // 清除记忆
                    localStorage.removeItem(`memories_${id}`)
                    localStorage.removeItem(`memory_summary_${id}`)
                    localStorage.removeItem(`initial_memories_extracted_${id}`)
                    // 清除续火花
                    localStorage.removeItem(`streak_data_${id}`)
                    // 清除对话轮数
                    localStorage.removeItem(`conversation_rounds_${id}`)
                    
                    alert('✅ 所有聊天记录已清除！')
                    // 返回聊天页面
                    navigate(`/chat/${id}`)
                  }
                }
              }}
              className="w-full px-4 py-4 flex items-center justify-between ios-button hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-red-600">清除聊天记录</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    删除所有消息、日记、记忆等数据
                  </div>
                </div>
              </div>
              <span className="text-red-400 text-xl">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* 气泡设置模态框 - 复制自Settings.tsx */}
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
                    气泡颜色（留空使用全局设置）
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={userBubbleColor || '#95EC69'}
                      onChange={(e) => setUserBubbleColor(e.target.value)}
                      className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={userBubbleColor}
                      onChange={(e) => setUserBubbleColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wechat-primary"
                      placeholder="留空使用全局设置"
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
                    placeholder="例如：&#10;background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);&#10;border-radius: 16px;"
                  />
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
                        backgroundColor: userBubbleColor || '#95EC69',
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
                    气泡颜色（留空使用全局设置）
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={aiBubbleColor || '#FFFFFF'}
                      onChange={(e) => setAiBubbleColor(e.target.value)}
                      className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={aiBubbleColor}
                      onChange={(e) => setAiBubbleColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wechat-primary"
                      placeholder="留空使用全局设置"
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
                    placeholder="例如：&#10;background: #FFFFFF;&#10;border: 1px solid #E5E5E5;"
                  />
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
                        backgroundColor: aiBubbleColor || '#FFFFFF',
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
                  重置为全局
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

      {/* 定时消息设置弹窗 */}
      {showScheduleSettings && (
        <ScheduleSettings onClose={() => setShowScheduleSettings(false)} />
      )}
    </div>
  )
}

export default ChatSettings

