/**
 * ChatDetail 主组件 - 使用拆分后的子组件
 * 这是一个简化版本，逐步替换原有的大文件
 */

import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCharacter } from '../../context/CharacterContext'
import { useUser } from '../../context/UserContext'
import { useBackground } from '../../context/BackgroundContext'

// 导入拆分的组件和Hook
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import MessageList from './MessageList'
import { useMessages } from './useMessages'

// 导入原有的其他组件
import ChatMenu from '../../components/ChatMenu'
import CallScreen from '../../components/CallScreen'

const ChatDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { characters } = useCharacter()
  const { currentUser } = useUser()
  const { background: globalBackground } = useBackground()
  
  // 获取角色信息
  const character = characters.find(c => c.id === id)
  
  // 使用消息管理Hook
  const { messages, addMessage } = useMessages(id)
  
  // UI状态
  const [inputValue, setInputValue] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  
  // 背景设置
  const [chatBackground] = useState(() => {
    return localStorage.getItem(`chat_background_${id}`) || ''
  })
  
  const background = chatBackground || globalBackground
  
  // 气泡颜色
  const userBubbleColor = localStorage.getItem('user_bubble_color') || '#95EC69'
  const aiBubbleColor = localStorage.getItem('ai_bubble_color') || '#ffffff'
  
  // 头像设置
  const characterAvatar = character?.avatar || '🤖'
  const userAvatar = currentUser?.avatar || '👤'
  const isCharacterCustomAvatar = characterAvatar?.startsWith('http') || characterAvatar?.startsWith('data:')
  const isUserCustomAvatar = userAvatar?.startsWith('http') || userAvatar?.startsWith('data:')
  
  // 发送消息
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isAiTyping) return
    
    // 添加用户消息
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    addMessage({
      type: 'sent',
      content: inputValue.trim(),
      time: timeStr,
      messageType: 'text'
    })
    
    setInputValue('')
    
    // TODO: 调用AI回复逻辑
    // 这里需要集成原有的AI逻辑
    
  }, [inputValue, isAiTyping, addMessage])
  
  // 附件按钮点击
  const handleAddClick = () => {
    setShowMenu(!showMenu)
  }
  
  // 表情按钮点击  
  const handleEmojiClick = () => {
    // TODO: 显示表情面板
    console.log('表情面板')
  }
  
  // 菜单点击
  const handleMenuClick = () => {
    navigate(`/chat-settings/${id}`)
  }
  
  // 转账处理
  const handleReceiveTransfer = useCallback((messageId: number) => {
    console.log('接收转账:', messageId)
    // TODO: 实现转账接收逻辑
  }, [])
  
  const handleRejectTransfer = useCallback((messageId: number) => {
    console.log('拒绝转账:', messageId)
    // TODO: 实现转账拒绝逻辑
  }, [])
  
  // 如果正在通话，显示通话界面
  if (isInCall) {
    return (
      <CallScreen
        characterId={id || ''}
        characterName={character?.name || 'AI'}
        onEndCall={() => setIsInCall(false)}
      />
    )
  }
  
  // 背景样式
  const backgroundStyle = background ? {
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {}
  
  return (
    <div className="h-screen flex flex-col" style={backgroundStyle}>
      {/* 聊天头部 */}
      <ChatHeader
        characterName={character?.name || 'AI'}
        characterId={id || ''}
        onMenuClick={handleMenuClick}
      />
      
      {/* 消息列表区域 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <MessageList
          messages={messages}
          characterName={character?.name}
          characterAvatar={characterAvatar}
          userAvatar={userAvatar}
          isCharacterCustomAvatar={isCharacterCustomAvatar}
          isUserCustomAvatar={isUserCustomAvatar}
          isAiTyping={isAiTyping}
          userBubbleColor={userBubbleColor}
          aiBubbleColor={aiBubbleColor}
          onReceiveTransfer={handleReceiveTransfer}
          onRejectTransfer={handleRejectTransfer}
        />
      </div>
      
      {/* 聊天输入框 */}
      <div className={`${background ? 'glass-dark' : 'glass-effect'}`}>
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          onAddClick={handleAddClick}
          onEmojiClick={handleEmojiClick}
          disabled={isAiTyping}
          placeholder="发送消息..."
        />
      </div>
      
      {/* 聊天菜单 */}
      {showMenu && (
        <ChatMenu
          characterId={id || ''}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}

export default ChatDetail
