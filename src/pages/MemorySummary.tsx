import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import { useMemory } from '../hooks/useMemory'
import memorySummaryIcon from '../assets/memory-summary-icon.webp'

const MemorySummary = () => {
  const { characterId } = useParams()
  const id = characterId // 保持兼容性
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { getCharacter } = useCharacter()
  const character = id ? getCharacter(id) : undefined
  
  // 传入角色名称和性格，让记忆总结也用角色的语气
  const memorySystem = useMemory(
    id || '', 
    character?.name, 
    character?.description
  )

  const [summary, setSummary] = useState('')
  const [summaryInterval, setSummaryInterval] = useState(30)
  const [isGenerating, setIsGenerating] = useState(false)

  // 从 localStorage 加载自动生成的总结和设置
  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`memory_summary_${id}`)
      if (saved) {
        setSummary(saved)
        console.log('📝 已加载记忆总结')
      }
      
      const interval = localStorage.getItem(`memory_summary_interval_${id}`)
      if (interval) {
        setSummaryInterval(parseInt(interval))
      }
    }
  }, [id])

  // 手动生成总结
  const handleManualSummary = async () => {
    if (!id || isGenerating) return

    try {
      setIsGenerating(true)
      console.log('🔄 开始手动生成记忆总结...')

      // 获取聊天记录
      const messagesJson = localStorage.getItem(`chat_messages_${id}`)
      if (!messagesJson) {
        alert('暂无聊天记录')
        return
      }

      const messages = JSON.parse(messagesJson)
      const userMessages = messages.filter((m: any) => m.type === 'sent')
      const aiMessages = messages.filter((m: any) => m.type === 'received')

      if (userMessages.length === 0 || aiMessages.length === 0) {
        alert('聊天记录不足，无法生成总结')
        return
      }

      // 获取最近的对话内容（最多取最近 50 轮）
      const recentUserMessages = userMessages.slice(-50)
      const recentAiMessages = aiMessages.slice(-50)

      // 合并对话内容
      const userContent = recentUserMessages.map((m: any) => 
        m.content || m.emojiDescription || m.photoDescription || m.voiceText || ''
      ).join('\n')

      const aiContent = recentAiMessages.map((m: any) => 
        m.content || m.emojiDescription || m.photoDescription || m.voiceText || ''
      ).join('\n')

      // 调用记忆系统提取记忆和生成总结
      const result = await memorySystem.extractMemories(userContent, aiContent)
      
      if (result.summary && result.summary.trim()) {
        // 获取旧的总结
        const oldSummary = localStorage.getItem(`memory_summary_${id}`) || ''
        
        // 添加分隔符和新总结
        const separator = oldSummary ? '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' : ''
        const timestamp = new Date().toLocaleString('zh-CN')
        const newSummary = oldSummary + separator + `【手动总结 - ${timestamp}】\n\n${result.summary}`
        
        setSummary(newSummary)
        localStorage.setItem(`memory_summary_${id}`, newSummary)
        console.log('✅ 手动总结已累积保存')
        console.log(`📊 总结历史长度: ${newSummary.length} 字符`)
        alert('总结已更新！')
      } else {
        console.log('ℹ️ 对话内容不足，无法生成总结')
        alert('对话内容太少，暂时无法生成总结。请继续聊天后再试。')
      }
    } catch (error) {
      console.error('❌ 手动生成总结失败:', error)
      alert('生成总结失败，请检查 API 设置')
    } finally {
      setIsGenerating(false)
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
          <h1 className="text-base font-semibold text-gray-900">记忆总结</h1>
          <button
            onClick={handleManualSummary}
            disabled={isGenerating}
            className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors ${
              isGenerating 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-wechat-primary bg-wechat-primary/10 hover:bg-wechat-primary/20'
            }`}
          >
            {isGenerating ? '生成中...' : '手动总结'}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {!summary ? (
          <div className="text-center py-12">
            <img src={memorySummaryIcon} alt="记忆总结" className="w-24 h-24 mx-auto mb-4 opacity-60" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">AI 记忆总结</h2>
            <p className="text-sm text-gray-500 px-4">
              每 {summaryInterval} 轮对话后，AI 会自动总结关于你的重要信息
            </p>
            <p className="text-xs text-gray-400 mt-2 px-4">
              暂无总结，请继续对话或点击右上角"手动总结"按钮
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 总结内容 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <img src={memorySummaryIcon} alt="总结" className="w-6 h-6 object-contain" />
                <span>关于你的总结</span>
              </h2>
              <div className="prose prose-sm max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  style={{ lineHeight: '1.8' }}
                >
                  {summary}
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600">
                💡 提示：总结每 {summaryInterval} 轮对话自动更新，只包含你明确说过的信息。
              </p>
              <p className="text-xs text-blue-500 mt-2">
                可在聊天设置中调整总结间隔（10-100轮），或点击右上角"手动总结"立即更新
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemorySummary
