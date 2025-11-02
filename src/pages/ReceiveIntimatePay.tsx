import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import { useCharacter } from '../context/ContactsContext'
import { createCharacterIntimatePayRelation } from '../utils/walletUtils'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import intimatePayIcon from '../assets/intimate-pay-icon.webp'

const ReceiveIntimatePay = () => {
  const navigate = useNavigate()
  const { characterId, monthlyLimit } = useParams<{ characterId: string; monthlyLimit: string }>()
  const { showStatusBar } = useSettings()
  const { getCharacter } = useCharacter()
  const [character, setCharacter] = useState<any>(null)

  useEffect(() => {
    if (characterId) {
      const char = getCharacter(characterId)
      setCharacter(char)
    }
  }, [characterId, getCharacter])

  const updateIntimatePayStatus = (status: 'accepted' | 'rejected') => {
    if (!characterId || !character) return
    
    // 更新聊天消息中的亲密付状态
    const messagesKey = `chat_messages_${characterId}`
    const savedMessages = localStorage.getItem(messagesKey)
    if (savedMessages) {
      const messages = JSON.parse(savedMessages)
      // 从后往前找最新的待处理亲密付消息
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].messageType === 'intimate_pay' && 
            messages[i].type === 'received' && 
            messages[i].intimatePay?.status === 'pending') {
          messages[i].intimatePay.status = status
          
          // 添加系统提示消息
          const systemMessage = {
            id: Date.now(),
            type: 'system',
            content: status === 'accepted' 
              ? `你接受了${character.name}的亲密付` 
              : `你拒绝了${character.name}的亲密付`,
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp: Date.now(),
            messageType: 'system'
          }
          messages.push(systemMessage)
          
          localStorage.setItem(messagesKey, JSON.stringify(messages))
          break
        }
      }
    }
  }

  const handleAccept = () => {
    if (!characterId || !monthlyLimit || !character) {
      alert('参数错误')
      return
    }

    const limit = parseFloat(monthlyLimit)
    if (isNaN(limit) || limit <= 0) {
      alert('额度无效')
      return
    }

    const success = createCharacterIntimatePayRelation(
      character.id,
      character.name,
      limit,
      character.avatar
    )

    if (success) {
      // 更新消息状态
      updateIntimatePayStatus('accepted')
      alert('已接受亲密付！')
      // 返回聊天页面，使用replace避免历史记录循环
      navigate(`/chat/${characterId}`, { replace: true })
    } else {
      alert('接受失败，可能已经开通过了')
    }
  }

  const handleReject = () => {
    if (confirm('确定要拒绝这个亲密付吗？')) {
      // 更新消息状态
      updateIntimatePayStatus('rejected')
      // 返回聊天页面，使用replace避免历史记录循环
      navigate(`/chat/${characterId}`, { replace: true })
    }
  }

  if (!character || !monthlyLimit) {
    return (
      <div className="h-screen flex flex-col bg-[#EDEDED]">
        {showStatusBar && <StatusBar />}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-sm">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
      {/* iOS状态栏 */}
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white flex items-center border-b border-gray-200">
        <button 
          onClick={() => navigate(`/chat/${characterId}`, { replace: true })}
          className="px-4 py-4 active:opacity-50 cursor-pointer flex items-center justify-center"
        >
          <BackIcon size={24} className="text-gray-900" />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-medium text-gray-900 pr-14">接受亲密付</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6">
        {/* 角色信息 */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 overflow-hidden">
              {character.avatar.startsWith('data:image') ? (
                <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{character.avatar}</span>
              )}
            </div>
            <div className="text-lg font-semibold text-gray-900 mb-2">{character.name}</div>
            <div className="text-sm text-gray-500">为你开通了亲密付</div>
          </div>
        </div>

        {/* 额度信息 */}
        <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl p-6 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">每月可用额度</div>
            <div className="text-[48px] font-light text-gray-900 mb-4">
              ¥{parseFloat(monthlyLimit).toFixed(2)}
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto overflow-hidden">
              <img src={intimatePayIcon} alt="亲密付" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="bg-[#FFF9E6] rounded-2xl p-4 mb-6">
          <div className="text-sm font-medium text-[#B8860B] mb-2">亲密付说明</div>
          <div className="space-y-2">
            <p className="text-xs text-[#B8860B] leading-relaxed">
              • 接受后，你每月可使用对方的零钱进行消费
            </p>
            <p className="text-xs text-[#B8860B] leading-relaxed">
              • 每月1日自动重置额度
            </p>
            <p className="text-xs text-[#B8860B] leading-relaxed">
              • 对方可以随时查看你的消费记录
            </p>
            <p className="text-xs text-[#B8860B] leading-relaxed">
              • 对方可以随时修改额度或关闭亲密付
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3 pb-6">
          <button
            onClick={handleAccept}
            className="w-full bg-gradient-to-r from-pink-400 to-red-400 text-white py-4 rounded-xl text-[16px] font-medium active:opacity-80 shadow-lg"
          >
            接受亲密付
          </button>
          <button
            onClick={handleReject}
            className="w-full bg-white text-gray-700 py-4 rounded-xl text-[16px] font-medium active:bg-gray-50 border border-gray-200"
          >
            暂不接受
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReceiveIntimatePay
