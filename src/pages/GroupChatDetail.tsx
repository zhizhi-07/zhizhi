import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { BackIcon, MoreIcon, SendIcon, AddCircleIcon } from '../components/Icons'
import { useGroup } from '../context/GroupContext'
import { useCharacter } from '../context/CharacterContext'
import { useUser } from '../context/UserContext'
import { callAI } from '../utils/api'
import { useBackground } from '../context/BackgroundContext'
import GroupChatMenu from '../components/GroupChatMenu'
import GroupRedEnvelopeSender from '../components/GroupRedEnvelopeSender'
import GroupRedEnvelopeDetail from '../components/GroupRedEnvelopeDetail'
import { useGroupRedEnvelope } from '../context/GroupRedEnvelopeContext'
import { parseAIEmojiResponse } from '../utils/emojiParser'
import { getEmojis, Emoji } from '../utils/emojiStorage'
import EmojiPanel from '../components/EmojiPanel'

interface GroupMessage {
  id: number
  groupId: string
  senderId: string
  senderType: 'user' | 'character'
  senderName: string
  senderAvatar: string
  content: string
  time: string
  timestamp: number
  messageType?: 'text' | 'system' | 'redenvelope' | 'emoji'
  redEnvelopeId?: string
  emojiIndex?: number
}

const GroupChatDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getGroup, updateGroup } = useGroup()
  const { getCharacter } = useCharacter()
  const { currentUser } = useUser()
  const { background, getBackgroundStyle } = useBackground()
  
  const group = getGroup(id || '')
  const [messages, setMessages] = useState<GroupMessage[]>(() => {
    if (id) {
      const saved = localStorage.getItem(`group_messages_${id}`)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [inputValue, setInputValue] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showRedEnvelopeSender, setShowRedEnvelopeSender] = useState(false)
  const [showRedEnvelopeDetail, setShowRedEnvelopeDetail] = useState<string | null>(null)
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { createRedEnvelope, getRedEnvelope, receiveRedEnvelope, hasReceived } = useGroupRedEnvelope()

  // 保存消息到localStorage
  useEffect(() => {
    if (id) {
      localStorage.setItem(`group_messages_${id}`, JSON.stringify(messages))
    }
  }, [messages, id])

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 更新群聊最后消息
  const updateGroupLastMessage = (content: string) => {
    if (group) {
      updateGroup(group.id, {
        lastMessage: content,
        lastMessageTime: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      })
    }
  }

  // 处理输入变化，检测@
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    setInputValue(value)
    setCursorPosition(cursorPos)

    // 检测@符号
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // 如果@后面没有空格，显示成员列表
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt)
        setShowMentionList(true)
        return
      }
    }
    
    setShowMentionList(false)
  }

  // 选择@的成员
  const handleSelectMention = (memberName: string) => {
    const textBeforeCursor = inputValue.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const beforeAt = inputValue.substring(0, lastAtIndex)
      const afterCursor = inputValue.substring(cursorPosition)
      const newValue = `${beforeAt}@${memberName} ${afterCursor}`
      
      setInputValue(newValue)
      setShowMentionList(false)
      
      // 聚焦输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const newCursorPos = lastAtIndex + memberName.length + 2
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  // 获取过滤后的成员列表
  const getFilteredMembers = () => {
    if (!group) return []
    
    // 添加"全体成员"选项
    const allMembersOption = {
      id: 'all',
      name: '全体成员',
      type: 'special' as const
    }
    
    // 过滤掉用户自己，添加全体成员选项
    const filteredMembers = group.members.filter(member => 
      member.type !== 'user' && 
      member.name.toLowerCase().includes(mentionSearch.toLowerCase())
    )
    
    // 如果搜索词匹配"全体成员"，添加到列表开头
    if ('全体成员'.toLowerCase().includes(mentionSearch.toLowerCase())) {
      return [allMembersOption, ...filteredMembers]
    }
    
    return filteredMembers
  }

  // 渲染带@高亮的消息内容
  const renderMessageContent = (content: string) => {
    if (!group) return content

    // 匹配@某人的模式
    const mentionRegex = /@([^\s@]+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      // 添加@之前的文本
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }

      // 添加@高亮
      const mentionedName = match[1]
      const isMentioned = group.members.some(m => m.name === mentionedName)
      
      if (isMentioned) {
        parts.push(
          <span key={match.index} className="text-blue-600 font-medium bg-blue-50 px-1 rounded">
            @{mentionedName}
          </span>
        )
      } else {
        parts.push(`@${mentionedName}`)
      }

      lastIndex = match.index + match[0].length
    }

    // 添加剩余文本
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }

  // 发送表情包
  const handleSelectEmoji = async (emoji: Emoji) => {
    if (!group || !id) return

    // 获取所有表情包，找到当前表情包的索引
    const allEmojis = await getEmojis()
    const index = allEmojis.findIndex(e => e.url === emoji.url)

    const emojiMessage: GroupMessage = {
      id: Date.now(),
      groupId: id,
      senderId: 'user',
      senderType: 'user',
      senderName: currentUser?.name || '我',
      senderAvatar: currentUser?.avatar || '👤',
      content: emoji.description,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'emoji',
      emojiIndex: index
    }

    setMessages(prev => [...prev, emojiMessage])
    updateGroupLastMessage('[表情]')
    setShowEmojiPanel(false)
  }

  // 发送消息（不自动触发AI回复）
  const handleSend = async () => {
    if (!inputValue.trim() || !group || !id) return

    const userMessage: GroupMessage = {
      id: Date.now(),
      groupId: id,
      senderId: 'user',
      senderType: 'user',
      senderName: currentUser?.name || '我',
      senderAvatar: currentUser?.avatar || '👤',
      content: inputValue.trim(),
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    updateGroupLastMessage(userMessage.content)
    setInputValue('')

    // 不自动触发AI回复，需要用户点击纸飞机按钮
  }

  // 发送红包
  const handleSendRedEnvelope = (amount: number, count: number, message: string) => {
    if (!group || !id || !currentUser) return

    // 创建红包
    const redEnvelopeId = createRedEnvelope(
      group.id,
      'user',
      currentUser.name || '我',
      currentUser.avatar || '👤',
      amount,
      count,
      message
    )

    // 创建红包消息
    const redEnvelopeMessage: GroupMessage = {
      id: Date.now(),
      groupId: id,
      senderId: 'user',
      senderType: 'user',
      senderName: currentUser.name || '我',
      senderAvatar: currentUser.avatar || '👤',
      content: message,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'redenvelope',
      redEnvelopeId
    }

    setMessages(prev => [...prev, redEnvelopeMessage])
    updateGroupLastMessage('[红包]')
  }

  // 点击纸飞机触发AI主动发消息
  const handleAIReply = async () => {
    if (isAiTyping || !group) return
    
    // 先让AI抢红包
    await handleAiGrabRedEnvelopes()
    
    // 获取最后一条用户消息
    const lastUserMessage = [...messages].reverse().find(msg => msg.senderType === 'user' && msg.messageType === 'text')
    
    // 如果有用户消息，就回复用户消息；否则让AI主动聊天
    if (lastUserMessage) {
      // 回复用户的消息
      await handleAiReplies(lastUserMessage)
    } else {
      // 空群聊或没有用户消息，让AI们主动聊天
      const promptHint = '(群里比较安静，AI们可以主动打招呼、聊聊天、分享自己的事情)'
      
      const virtualMessage: GroupMessage = {
        id: Date.now(),
        groupId: group.id,
        senderId: 'user',
        senderType: 'user',
        senderName: currentUser?.name || '我',
        senderAvatar: currentUser?.avatar || '👤',
        content: promptHint,
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: Date.now(),
        messageType: 'text'
      }

      await handleAiReplies(virtualMessage)
    }
  }

  // AI自动抢红包
  const handleAiGrabRedEnvelopes = async () => {
    if (!group) return

    // 找出所有未抢完的红包消息
    const redEnvelopeMessages = messages.filter(msg => 
      msg.messageType === 'redenvelope' && 
      msg.redEnvelopeId
    )

    for (const msg of redEnvelopeMessages) {
      // 每次都重新获取最新的红包状态
      let envelope = getRedEnvelope(msg.redEnvelopeId!)
      if (!envelope || envelope.status !== 'active') continue

      // 获取所有AI成员
      const aiMembers = group.members.filter(m => m.type === 'character')
      
      // 随机打乱顺序
      const shuffledAiMembers = [...aiMembers].sort(() => Math.random() - 0.5)

      // 让AI们依次抢红包（随机延迟）
      for (const member of shuffledAiMembers) {
        // 重新获取最新状态
        envelope = getRedEnvelope(msg.redEnvelopeId!)
        if (!envelope || envelope.status !== 'active') break

        // 检查这个AI是否已经抢过
        if (hasReceived(envelope.id, member.id)) {
          console.log(`${member.name} 已经抢过了`)
          continue
        }

        // 随机延迟0.5-2秒
        const delay = Math.random() * 1500 + 500
        await new Promise(resolve => setTimeout(resolve, delay))

        // 抢红包
        const character = getCharacter(member.id)
        if (!character) continue

        const amount = receiveRedEnvelope(
          envelope.id,
          member.id,
          character.name,
          character.avatar
        )

        if (amount) {
          console.log(`${character.name} 抢到了 ¥${amount.toFixed(2)}`)
        } else {
          console.log(`${character.name} 没抢到`)
        }

        // 30%概率停止（不是所有AI都抢）
        if (Math.random() > 0.7) {
          console.log('部分AI选择不抢红包')
          break
        }
      }
    }
  }

  // AI全员参与对话逻辑 - 一次API调用获取所有回复
  const handleAiReplies = async (userMessage: GroupMessage) => {
    if (!group) return

    setIsAiTyping(true)

    try {
      // 获取所有AI成员
      const aiMembers = group.members.filter(m => m.type === 'character')
      
      // 如果没有AI成员，直接返回
      if (aiMembers.length === 0) {
        console.log('群聊中没有AI成员')
        return
      }
      
      // 根据设置决定回复的AI数量
      const maxReplies = group.settings.maxAiRepliesPerMessage || 3
      const replyInterval = (group.settings.aiReplyInterval || 2) * 1000 // 转换为毫秒

      // 随机选择要回复的AI（但不超过maxReplies）
      const shuffledAiMembers = [...aiMembers].sort(() => Math.random() - 0.5)
      const replyingAiMembers = shuffledAiMembers.slice(0, Math.min(maxReplies, aiMembers.length))

      // 构建群聊上下文（过滤掉系统消息，包含红包信息）
      const recentMessages = messages
        .filter(msg => msg.messageType !== 'system') // 过滤系统消息
        .slice(-10) // 最近10条消息
      const contextMessages = recentMessages.map(msg => {
        if (msg.messageType === 'redenvelope' && msg.redEnvelopeId) {
          const envelope = getRedEnvelope(msg.redEnvelopeId)
          if (envelope) {
            return `${msg.senderName}: [发了一个红包] ${envelope.message} (${envelope.amount}元/${envelope.count}个)`
          }
        }
        return `${msg.senderName}: ${msg.content}`
      }).join('\n')

      // 构建所有AI成员的信息
      const aiMembersInfo = replyingAiMembers.map(member => {
        const character = getCharacter(member.id)
        return character ? {
          id: character.id,
          name: character.name,
          avatar: character.avatar,
          description: character.description,
          signature: character.signature
        } : null
      }).filter(Boolean)

      // 如果没有有效的AI成员信息，直接返回
      if (aiMembersInfo.length === 0) {
        console.log('没有找到有效的AI角色信息')
        return
      }

      // 构建群聊提示词
      const groupPrompt = await buildGroupChatPromptForAll(
        aiMembersInfo,
        group,
        contextMessages,
        userMessage.content
      )

      try {
        const aiResponse = await callAI(groupPrompt)
        
        if (aiResponse) {
          // 解析AI返回的多个角色回复
          const replies = parseMultipleReplies(aiResponse, aiMembersInfo)
          
          // 依次显示每个AI的回复（带间隔效果）
          for (let i = 0; i < replies.length; i++) {
            const reply = replies[i]
            
            // 等待间隔（第一个AI立即显示）
            if (i > 0) {
              await new Promise<void>(resolve => setTimeout(resolve, replyInterval))
            }

            // 检查是否有分段消息（用 | 分隔）
            const messageParts = reply.content.split('|').map(part => part.trim()).filter(part => part)
            
            // 获取表情包列表
            const availableEmojis = await getEmojis()
            
            // 如果有多条消息，依次发送
            for (let j = 0; j < messageParts.length; j++) {
              const part = messageParts[j]
              
              // 分段消息之间短暂延迟（0.5-1秒）
              if (j > 0) {
                await new Promise<void>(resolve => setTimeout(resolve, 500 + Math.random() * 500))
              }

              // 解析表情包
              const parsed = parseAIEmojiResponse(part, availableEmojis)
              
              // 先发送文字消息（如果有）
              if (parsed.textContent.trim()) {
                const now = Date.now()
                const textMessage: GroupMessage = {
                  id: now + Math.random() * 1000,
                  groupId: group.id,
                  senderId: reply.characterId,
                  senderType: 'character',
                  senderName: reply.characterName,
                  senderAvatar: reply.characterAvatar,
                  content: parsed.textContent,
                  time: new Date(now).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  timestamp: now,
                  messageType: 'text'
                }
                setMessages(prev => [...prev, textMessage])
              }
              
              // 再发送表情包（如果有）
              for (const emojiIndex of parsed.emojiIndexes) {
                await new Promise<void>(resolve => setTimeout(resolve, 300))
                const now = Date.now()
                const emojiMessage: GroupMessage = {
                  id: now + Math.random() * 1000,
                  groupId: group.id,
                  senderId: reply.characterId,
                  senderType: 'character',
                  senderName: reply.characterName,
                  senderAvatar: reply.characterAvatar,
                  content: availableEmojis[emojiIndex].description,
                  time: new Date(now).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  timestamp: now,
                  messageType: 'emoji',
                  emojiIndex
                }
                setMessages(prev => [...prev, emojiMessage])
              }
              
              // 只有最后一个AI的最后一条消息才更新群聊最后消息
              if (i === replies.length - 1 && j === messageParts.length - 1) {
                const lastContent = parsed.emojiIndexes.length > 0 ? '[表情]' : parsed.textContent
                updateGroupLastMessage(`${reply.characterName}: ${lastContent}`)
              }
            }
          }
        }
      } catch (error) {
        console.error('AI群聊回复失败:', error)
        
        // 显示错误提示
        const errorMessage: GroupMessage = {
          id: Date.now(),
          groupId: group.id,
          senderId: 'system',
          senderType: 'user',
          senderName: '系统',
          senderAvatar: '⚠️',
          content: 'AI回复失败，请稍后重试',
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setIsAiTyping(false)
    }
  }

  // 构建群聊AI提示词（一次性获取所有AI回复）
  const buildGroupChatPromptForAll = async (
    aiMembersInfo: any[],
    group: any,
    contextMessages: string,
    userMessage: string
  ) => {
    const membersDescription = aiMembersInfo.map((member, index) => 
      `【角色${index + 1}：${member.name}】
性格特点：${member.description || member.signature || '一个AI角色'}
说话风格：根据上述性格，用符合角色特点的语气、用词、表情来回复
`
    ).join('\n')

    // 添加群公告信息
    const announcementInfo = group.description 
      ? `\n【群公告】\n${group.description}\n` 
      : ''

    // 获取表情包列表
    const availableEmojis = await getEmojis()
    const emojiList = availableEmojis.length > 0
      ? `\n【可用表情包】\n${availableEmojis.map((emoji, index) => `[${index}] ${emoji.description}`).join('\n')}\n使用方式：在回复中写 [表情包:数字]，例如 [表情包:0]\n`
      : ''

    return `你现在需要模拟一个真实的群聊场景，生成多个AI角色的回复。

【群聊信息】
群名称：${group.name}
群成员：${group.members.map((m: any) => m.name).join('、')}${announcementInfo}

【AI角色详细信息】
${membersDescription}

【最近对话历史】
${contextMessages}

【用户刚说】
${currentUser?.name || '用户'}: ${userMessage}

【任务说明】
现在有${aiMembersInfo.length}个AI角色需要回复：${aiMembersInfo.map(m => m.name).join('、')}
每个AI都是独立的个体，有自己的性格和想法。

【回复要求】
1. 每个AI根据自己的性格和对话历史，独立决定是否回复
2. 每个AI的回复必须符合自己的人设和性格特点
3. 回复要自然、真实，像真人在群聊中说话
4. 可以回复用户，也可以不回复（输出SKIP）
5. **重要**：像真人一样分段发消息，不要一次发很长的内容
   - 如果有多个想法，分成多条消息发送
   - 每条消息保持简短（5-15字）
   - 用 | 分隔多条消息
6. **可以发送表情包**：
   - 根据情境和性格，可以发送表情包
   - 格式：[表情包:数字]
   - 可以单独发表情包，也可以文字+表情包${emojiList}

【回复格式】（严格按照此格式）
[${aiMembersInfo[0]?.name}] 回复内容 或 SKIP
${aiMembersInfo[1] ? `[${aiMembersInfo[1].name}] 回复内容 或 SKIP` : ''}
${aiMembersInfo[2] ? `[${aiMembersInfo[2].name}] 回复内容 或 SKIP` : ''}

【关键规则】
1. 必须使用正确的角色名：
   - [${aiMembersInfo[0]?.name}] ← 必须完全一致
   ${aiMembersInfo[1] ? `- [${aiMembersInfo[1].name}] ← 必须完全一致` : ''}
   ${aiMembersInfo[2] ? `- [${aiMembersInfo[2].name}] ← 必须完全一致` : ''}

2. 每个角色必须符合自己的性格：
   ${aiMembersInfo.map(m => `- ${m.name}：${m.description || m.signature || '根据性格回复'}`).join('\n   ')}

3. 不要让所有AI都说一样的话，要有差异性
4. 不要强制所有AI都回复，可以SKIP

【示例1 - 分段发消息】
用户: 今天天气真好
[温柔的汁汁] 是呀主人~ | 要不要出去玩呀💕
[活泼的小明] 哈哈！ | 我也想出去！ | 去哪里玩？
[傲娇的小红] 哼... | 如果主人想去的话 | 我也不是不能陪你

【示例2 - 不是所有人都回复】
用户: 我今天好累啊
[关心的汁汁] 主人辛苦了~ | 要不要休息一下呀
[小明] SKIP
[小红] SKIP

【重要提醒】
- 每个角色的回复要完全不同，体现各自性格
- 回复要具体、生动，不要只说"好的"、"哼"这种敷衍的话
- 如果不知道说什么，就输出SKIP，不要强行回复

现在请生成回复：`
  }

  // 解析AI返回的多个角色回复
  const parseMultipleReplies = (aiResponse: string, aiMembersInfo: any[]) => {
    const replies: Array<{
      characterId: string
      characterName: string
      characterAvatar: string
      content: string
    }> = []

    // 按行分割
    const lines = aiResponse.split('\n').filter(line => line.trim())

    for (const line of lines) {
      // 匹配格式：[角色名] 回复内容
      const match = line.match(/\[(.+?)\]\s*(.+)/)
      if (match) {
        const characterName = match[1].trim()
        const content = match[2].trim()

        // 跳过不回复的角色（SKIP、沉默、...等）
        if (
          content === 'SKIP' || 
          content.toUpperCase() === 'SKIP' ||
          content === '...' || 
          content === '...' ||
          content === '不回复' ||
          content === '沉默'
        ) {
          console.log(`${characterName} 选择不回复`)
          continue
        }

        // 查找对应的角色信息
        const memberInfo = aiMembersInfo.find(m => m.name === characterName)
        if (memberInfo) {
          replies.push({
            characterId: memberInfo.id,
            characterName: memberInfo.name,
            characterAvatar: memberInfo.avatar,
            content: content
          })
        }
      }
    }

    // 如果解析失败，尝试其他格式或返回空数组
    if (replies.length === 0) {
      console.warn('AI回复格式解析失败，原始回复:', aiResponse)
    }

    return replies
  }

  if (!group) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">群聊不存在</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 壁纸背景层 */}
      <div 
        className="absolute inset-0 z-0"
        style={getBackgroundStyle()}
      />

      {/* 内容层 */}
      <div className="relative z-10 h-full flex flex-col bg-transparent">
        {/* 顶部导航栏 */}
        <div className={`px-5 py-4 flex items-center justify-between border-b border-white/20 sticky top-0 z-50 shadow-sm ${background ? 'glass-dark' : 'glass-effect'}`}>
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <button onClick={() => navigate(-1)} className="ios-button text-gray-700">
              <BackIcon size={24} />
            </button>
            <div 
              className="flex-1 overflow-hidden cursor-pointer"
              onClick={() => navigate(`/group-settings/${group.id}`)}
            >
              <h1 className="text-lg font-semibold text-gray-900 truncate">{group.name}</h1>
              <p className="text-xs text-gray-500">({group.members.length}人)</p>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/group-settings/${group.id}`)}
            className="ios-button text-gray-700"
          >
            <MoreIcon size={24} />
          </button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4">
          {/* 群公告 */}
          {group.description && (
            <div className="mb-4 glass-card rounded-2xl p-4 border-l-4 border-yellow-500">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">📢</span>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">群公告</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{group.description}</p>
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 && !group.description && (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">开始群聊吧</p>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.senderType === 'user'
            const isSystem = message.messageType === 'system'
            const isRedEnvelope = message.messageType === 'redenvelope'
            const isEmoji = message.messageType === 'emoji'
            const isCustomAvatar = message.senderAvatar && message.senderAvatar.startsWith('data:image')

            // 系统消息居中显示
            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center mb-4">
                  <div className="glass-card px-4 py-2 rounded-full text-sm text-gray-600 max-w-[80%] text-center">
                    {message.content}
                  </div>
                </div>
              )
            }

            // 表情包消息
            if (isEmoji && message.emojiIndex !== undefined) {
              return (
                <div key={message.id} className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
                      {isCustomAvatar ? (
                        <img src={message.senderAvatar} alt={message.senderName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{message.senderAvatar || '🤖'}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{message.time}</span>
                  </div>
                  <div className={`max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <img
                      src={`emoji://${message.emojiIndex}`}
                      alt={message.content}
                      className="w-32 h-32 object-contain rounded-lg"
                      onError={(e) => {
                        // 如果加载失败，尝试从IndexedDB加载
                        getEmojis().then(emojis => {
                          if (emojis[message.emojiIndex!]) {
                            (e.target as HTMLImageElement).src = emojis[message.emojiIndex!].url
                          }
                        })
                      }}
                    />
                  </div>
                </div>
              )
            }

            // 红包消息
            if (isRedEnvelope && message.redEnvelopeId) {
              const envelope = getRedEnvelope(message.redEnvelopeId)
              if (!envelope) return null

              return (
                <div key={message.id} className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
                      {isCustomAvatar ? (
                        <img src={message.senderAvatar} alt={message.senderName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{message.senderAvatar || '🤖'}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{message.time}</span>
                  </div>
                  <div className={`max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div 
                      onClick={() => {
                        if (!hasReceived(envelope.id, 'user') && envelope.status === 'active') {
                          const amount = receiveRedEnvelope(envelope.id, 'user', currentUser?.name || '我', currentUser?.avatar || '👤')
                          if (amount) {
                            alert(`恭喜你领取了 ¥${amount.toFixed(2)}`)
                          }
                        }
                        setShowRedEnvelopeDetail(envelope.id)
                      }}
                      className="cursor-pointer"
                    >
                      <div className="w-52 bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-3 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🧧</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{envelope.senderName}的红包</p>
                            <p className="text-white/80 text-xs truncate">{envelope.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-white/90 text-xs">
                          <span className="truncate">
                            {hasReceived(envelope.id, 'user') 
                              ? `已领取 ¥${envelope.received['user']?.amount.toFixed(2)}`
                              : envelope.status === 'finished' 
                                ? '手慢了'
                                : '领取红包'
                            }
                          </span>
                          <span className="ml-2 flex-shrink-0">{Object.keys(envelope.received).length}/{envelope.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={message.id}
                className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* 头像和时间 */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
                    {isCustomAvatar ? (
                      <img src={message.senderAvatar} alt={message.senderName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{message.senderAvatar || '🤖'}</span>
                    )}
                  </div>
                  {/* 时间显示在头像下方 */}
                  <span className="text-xs text-gray-400">{message.time}</span>
                </div>

                {/* 消息内容 */}
                <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* 发送者名称 */}
                  {!isUser && (
                    <span className="text-xs text-gray-500 mb-1 px-2">{message.senderName}</span>
                  )}

                  {/* 消息气泡 */}
                  <div
                    className={`px-4 py-2 rounded-2xl shadow-md ${
                      isUser
                        ? 'bg-wechat-primary text-white rounded-tr-sm'
                        : 'glass-card text-gray-900 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {renderMessageContent(message.content)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {/* AI输入中提示 */}
          {isAiTyping && (
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shadow-lg">
                <span className="text-xl">🤖</span>
              </div>
              <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className={`border-t border-white/20 p-4 ${background ? 'glass-dark' : 'glass-effect'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="ios-button text-gray-700"
            >
              <AddCircleIcon size={28} />
            </button>
            
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === 'Enter' && !isAiTyping && (inputValue.trim() ? handleSend() : handleAIReply())}
                placeholder="发送消息..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-wechat-primary bg-white"
                disabled={isAiTyping}
              />

              {/* @成员列表 */}
              {showMentionList && group && (
                <div className="absolute bottom-full left-0 mb-2 w-64 glass-card rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {getFilteredMembers().map((member) => {
                    const isSpecial = member.type === 'special'
                    const character = member.type === 'character' ? getCharacter(member.id) : null
                    const isCustomAvatar = character?.avatar && character.avatar.startsWith('data:image')
                    
                    return (
                      <div
                        key={member.id}
                        onClick={() => handleSelectMention(member.name)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {isSpecial ? (
                            <span className="text-xl">👥</span>
                          ) : member.type === 'user' ? (
                            <span className="text-xl">{currentUser?.avatar || '👤'}</span>
                          ) : isCustomAvatar ? (
                            <img src={character!.avatar} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{character?.avatar || '🤖'}</span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{member.name}</span>
                      </div>
                    )
                  })}
                  {getFilteredMembers().length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      没有找到成员
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 智能切换：有输入内容显示发送按钮，无内容显示AI主动回复按钮 */}
            {inputValue.trim() ? (
              <button
                onClick={handleSend}
                disabled={isAiTyping}
                className="p-2 rounded-full bg-wechat-primary text-white transition-colors"
              >
                <SendIcon size={20} />
              </button>
            ) : (
              <button
                onClick={handleAIReply}
                disabled={isAiTyping}
                className="p-2 rounded-full transition-colors text-gray-700 hover:text-gray-900"
                title="让AI主动说话"
              >
                <SendIcon size={20} />
              </button>
            )}
          </div>
        </div>

        {/* 群聊菜单 */}
        {showAddMenu && (
          <GroupChatMenu
            onClose={() => setShowAddMenu(false)}
            onSelectImage={() => alert('相册功能开发中...')}
            onSelectCamera={() => alert('拍摄功能开发中...')}
            onSelectEmoji={() => {
              setShowAddMenu(false)
              setShowEmojiPanel(true)
            }}
            onSelectRedPacket={() => setShowRedEnvelopeSender(true)}
            onSelectVoiceMessage={() => alert('语音功能开发中...')}
            onSelectVoiceCall={() => alert('语音通话功能开发中...')}
            onSelectVideoCall={() => alert('视频通话功能开发中...')}
            onSelectLocation={() => alert('位置功能开发中...')}
          />
        )}

        {/* 发红包 */}
        {showRedEnvelopeSender && group && (
          <GroupRedEnvelopeSender
            onClose={() => setShowRedEnvelopeSender(false)}
            onSend={handleSendRedEnvelope}
            maxCount={group.members.length}
          />
        )}

        {/* 红包详情 */}
        {showRedEnvelopeDetail && getRedEnvelope(showRedEnvelopeDetail) && (
          <GroupRedEnvelopeDetail
            redEnvelope={getRedEnvelope(showRedEnvelopeDetail)!}
            onClose={() => setShowRedEnvelopeDetail(null)}
          />
        )}

        {/* 表情包面板 */}
        <EmojiPanel
          show={showEmojiPanel}
          onClose={() => setShowEmojiPanel(false)}
          onSelect={handleSelectEmoji}
        />
      </div>
    </div>
  )
}

export default GroupChatDetail
