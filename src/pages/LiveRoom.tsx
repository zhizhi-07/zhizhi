import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import { callAI } from '../utils/api'
import { getItem, setItem } from '../utils/storage'

interface Comment {
  user: string
  text: string
  id: number
  isNPC?: boolean
}

interface NPCViewer {
  id: string
  name: string
  joinTime: number
}

// 人气配置
interface PopularityConfig {
  initialRange: [number, number]
  peakRange: [number, number]
  growthSpeed: number
  retentionRate: number
}

const popularityConfigs: Record<string, PopularityConfig> = {
  '新人': {
    initialRange: [30, 80],
    peakRange: [150, 400],
    growthSpeed: 1,
    retentionRate: 0.6
  },
  '小有名气': {
    initialRange: [100, 300],
    peakRange: [500, 1200],
    growthSpeed: 1.5,
    retentionRate: 0.75
  },
  '知名主播': {
    initialRange: [500, 1000],
    peakRange: [2000, 5000],
    growthSpeed: 2.5,
    retentionRate: 0.85
  },
  '顶流': {
    initialRange: [2000, 5000],
    peakRange: [8000, 15000],
    growthSpeed: 4,
    retentionRate: 0.9
  }
}

// NPC评论库
const npcCommentsPool = [
  '主播好可爱~', '来了来了', '支持支持！', '声音好好听', 
  '666', '主播唱得真好', '刚来，发生什么了', '哇塞',
  '终于等到了', '主播加油', '好厉害', '爱了爱了',
  '这个好看', '第一次来', 'yyds', '真不错',
  '学到了', '感谢分享', '继续继续', '期待后面'
]

const generateNPCName = () => {
  const prefixes = ['可爱的', '帅气的', '温柔的', '阳光的', '神秘的']
  const names = ['小猫', '小狗', '小兔', '小熊', '小鸟', '星星', '月亮', '太阳', '彩虹', '云朵']
  return prefixes[Math.floor(Math.random() * prefixes.length)] + names[Math.floor(Math.random() * names.length)]
}

const LiveRoom = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showStatusBar } = useSettings()
  const { getCharacter } = useCharacter()
  
  // 获取直播信息
  const liveData = id ? JSON.parse(localStorage.getItem(`live_stream_${id}`) || '{}') : {}
  const character = liveData.characterId ? getCharacter(liveData.characterId) : null
  const popularityLevel = liveData.popularityLevel || '小有名气'
  const config = popularityConfigs[popularityLevel] || popularityConfigs['小有名气']
  
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [inputText, setInputText] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [showGiftPanel, setShowGiftPanel] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  
  // 观众数和NPC系统
  const [viewerCount, setViewerCount] = useState(0)
  const [npcViewers, setNpcViewers] = useState<NPCViewer[]>([])
  const [elapsedMinutes, setElapsedMinutes] = useState(0)
  const startTime = useRef(Date.now())
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [currentAction, setCurrentAction] = useState<string>('')

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleSendComment = async () => {
    if (inputText.trim()) {
      const userComment: Comment = {
        user: '我',
        text: inputText,
        id: Date.now()
      }
      setComments(prev => [...prev, userComment])
      const userMessage = inputText
      setInputText('')
      
      console.log('💬 发送弹幕:', userMessage)
      
      // 有50%概率主播会回复你的弹幕
      if (Math.random() > 0.5) {
        setTimeout(() => {
          if (!isAiTyping) {
            handleAIClick()
          }
        }, 2000 + Math.random() * 2000)
      }
    }
  }

  const handleFollow = () => {
    const newFollowState = !isFollowing
    setIsFollowing(newFollowState)
    
    // 关注后显示提示
    if (newFollowState) {
      const followComment: Comment = {
        user: '系统',
        text: `你关注了主播`,
        id: Date.now(),
        isNPC: false
      }
      setComments(prev => [...prev, followComment])
      
      // 小概率主播感谢
      if (Math.random() > 0.7) {
        setTimeout(() => {
          if (!isAiTyping) {
            handleAIClick()
          }
        }, 1500)
      }
    }
  }
  
  // 送礼物处理
  const handleSendGift = (giftName: string, giftPrice: number, giftEmoji: string) => {
    const characterId = liveData.characterId
    if (!characterId) return
    
    // 获取用户余额
    const userMoney = getItem<number>('user_money', 0)
    
    // 尝试使用亲密付
    const intimatePayKey = `intimate_pay_${characterId}_to_user`
    const intimatePay = getItem<any>(intimatePayKey, null)
    
    let paymentMethod = ''
    let success = false
    
    if (intimatePay && intimatePay.status === 'active') {
      // 检查亲密付额度
      const used = intimatePay.used || 0
      const remaining = intimatePay.monthlyLimit - used
      
      if (remaining >= giftPrice) {
        // 使用亲密付
        intimatePay.used = used + giftPrice
        
        // 添加消费记录
        if (!intimatePay.records) intimatePay.records = []
        intimatePay.records.push({
          date: new Date().toISOString(),
          amount: giftPrice,
          description: `直播-${character?.name || '主播'}-送出${giftName}`,
          timestamp: Date.now()
        })
        
        setItem(intimatePayKey, intimatePay)
        paymentMethod = '亲密付'
        success = true
        
        console.log(`💝 使用亲密付送礼物：${giftName} ¥${giftPrice}`)
      }
    }
    
    // 如果亲密付不可用或额度不足，使用零钱
    if (!success) {
      if (userMoney >= giftPrice) {
        setItem('user_money', userMoney - giftPrice)
        paymentMethod = '微信零钱'
        success = true
        
        console.log(`💰 使用零钱送礼物：${giftName} ¥${giftPrice}`)
      }
    }
    
    if (success) {
      // 关闭礼物面板
      setShowGiftPanel(false)
      
      // 添加送礼物评论
      const giftComment: Comment = {
        user: '我',
        text: `送出了${giftName} ${giftEmoji}`,
        id: Date.now()
      }
      setComments(prev => [...prev, giftComment])
      
      // 显示支付方式提示（可选）
      const paymentTip: Comment = {
        user: '系统',
        text: `使用${paymentMethod}支付 ¥${giftPrice}`,
        id: Date.now() + 1
      }
      setTimeout(() => {
        setComments(prev => [...prev, paymentTip])
      }, 500)
      
      // 触发主播感谢（延迟1-2秒）
      setTimeout(() => {
        if (!isAiTyping) {
          handleAIClick()
        }
      }, 1000 + Math.random() * 1000)
    } else {
      // 余额不足
      alert(`余额不足！\n礼物价格：¥${giftPrice}\n当前零钱：¥${userMoney.toFixed(2)}\n${intimatePay ? `亲密付剩余：¥${(intimatePay.monthlyLimit - (intimatePay.used || 0)).toFixed(2)}` : '未开通亲密付'}`)
    }
  }
  
  // 点击AI触发回复 - AI看到弹幕和礼物后做出反应
  const handleAIClick = async () => {
    if (isAiTyping) return // 防止重复点击
    
    console.log('🎬 点击AI画面，AI做出反应')
    setIsAiTyping(true)
    try {
      // 获取最近的10条弹幕
      const recentComments = comments.slice(-10).map(c => `${c.user}: ${c.text}`).join('\n')
      
      // 构建请求，让AI看到弹幕并做出反应
      const messages = [
        ...chatHistory,
        {
          role: 'user',
          content: `你正在直播中。这是最近的弹幕：\n${recentComments}\n\n请根据这些弹幕做出自然的反应。你可以：1)感谢送礼物的人 2)回答观众的问题 3)和观众互动调侃 4)做动作描写（用括号）。保持简短自然，像真实主播一样，不超过30字。`
        }
      ]
      
      // 调用AI
      const aiResponse = await callAI(messages)
      console.log('🎬 AI反应:', aiResponse)
      
      // 检查是否是动作描写
      const isAction = aiResponse.startsWith('（') || aiResponse.startsWith('(')
      
      if (isAction) {
        // 显示动作在画面上
        setCurrentAction(aiResponse)
        setTimeout(() => {
          setCurrentAction('')
        }, 3000)
      } else {
        // 显示对话在弹幕中
        const aiComment: Comment = {
          user: character?.name || '主播',
          text: aiResponse,
          id: Date.now(),
          isNPC: false
        }
        setComments(prev => [...prev, aiComment])
      }
      
      // 更新聊天历史
      setChatHistory([
        ...messages,
        {
          role: 'assistant',
          content: aiResponse
        }
      ])
      
      // 触发NPC评论
      setTimeout(() => {
        generateNPCResponse(aiResponse)
      }, 2000 + Math.random() * 3000)
      
    } catch (error) {
      console.error('❌ AI反应失败:', error)
      const fallbackActions = [
        '（微笑着向镜头挥手）',
        '谢谢大家的支持~',
        '（整理了一下头发）'
      ]
      const action = fallbackActions[Math.floor(Math.random() * fallbackActions.length)]
      setCurrentAction(action)
      setTimeout(() => {
        setCurrentAction('')
      }, 3000)
    } finally {
      setIsAiTyping(false)
    }
  }
  
  // 生成NPC评论响应主播的话
  const generateNPCResponse = async (streamerMessage: string) => {
    if (npcViewers.length === 0) return
    
    try {
      const messages = [
        {
          role: 'system',
          content: '你是直播间的一个观众。根据主播说的话，生成1-3条观众评论。评论要多样化：有鼓励的、调侃的、搞笑的、甚至偶尔有点毒舌的。也可以是观众之间的互动。每条评论用|||分隔，格式：观众名|||评论内容。保持简短真实。'
        },
        {
          role: 'user',
          content: `主播说: ${streamerMessage}\n观众列表: ${npcViewers.slice(0, 5).map(v => v.name).join(', ')}`
        }
      ]
      
      const response = await callAI(messages)
      const commentLines = response.split('|||').filter(line => line.trim())
      
      // 随机选择1-2条评论
      const numComments = Math.min(commentLines.length, Math.random() > 0.5 ? 2 : 1)
      
      for (let i = 0; i < numComments; i++) {
        setTimeout(() => {
          const parts = commentLines[i].split(':')
          let userName = parts[0]?.trim()
          let commentText = parts.slice(1).join(':').trim()
          
          // 如果解析失败，使用随机观众
          if (!commentText) {
            userName = npcViewers[Math.floor(Math.random() * npcViewers.length)].name
            commentText = commentLines[i].trim()
          }
          
          const npcComment: Comment = {
            user: userName,
            text: commentText,
            id: Date.now() + i,
            isNPC: true
          }
          setComments(prev => [...prev, npcComment])
        }, i * 1500)
      }
    } catch (error) {
      console.error('❌ NPC评论生成失败:', error)
    }
  }
  
  // 初始化直播
  useEffect(() => {
    // 加载聊天历史
    const characterId = liveData.characterId
    if (characterId) {
      try {
        const savedMessages = localStorage.getItem(`chat_messages_${characterId}`)
        if (savedMessages) {
          const messages = JSON.parse(savedMessages)
          // 转换聊天记录为AI消息格式（只保留最近20条）
          const recentMessages = messages.slice(-20).map((msg: any) => ({
            role: msg.type === 'sent' ? 'user' : 'assistant',
            content: msg.content || msg.voiceText || msg.photoDescription || ''
          })).filter((msg: any) => msg.content.trim())
          
          // 添加直播上下文
          setChatHistory([
            {
              role: 'system',
              content: `你现在正在直播。观众会通过弹幕和你互动，你要像一个真实的主播一样回复他们。保持你的性格特点，简洁自然地回复。`
            },
            ...recentMessages
          ])
          console.log('📺 已加载聊天历史，共', recentMessages.length, '条')
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error)
      }
    }
    
    // 设置初始观众数
    const initial = Math.floor(
      Math.random() * (config.initialRange[1] - config.initialRange[0]) + config.initialRange[0]
    )
    setViewerCount(initial)
    setLikeCount(Math.floor(initial * Math.random() * 10))
    
    // 添加开场白
    if (liveData.openingMessage) {
      setTimeout(() => {
        const aiComment: Comment = {
          user: character?.name || '主播',
          text: liveData.openingMessage,
          id: Date.now(),
          isNPC: false
        }
        setComments(prev => [...prev, aiComment])
      }, 500)
    }
  }, [])
  
  // 时间追踪
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 60000)
      setElapsedMinutes(elapsed)
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])
  
  // 自动滚动到最新弹幕
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments, isAiTyping])
  
  // NPC进入/退出
  useEffect(() => {
    const interval = setInterval(() => {
      // 计算增长量
      const baseGrowth = Math.floor(Math.random() * 5 * config.growthSpeed)
      const growth = elapsedMinutes < 5 ? baseGrowth : 
                     elapsedMinutes < 15 ? Math.floor(baseGrowth * 0.5) :
                     Math.floor(baseGrowth * 0.3)
      
      // 添加新观众
      if (Math.random() > 0.3 && growth > 0) {
        const newViewer: NPCViewer = {
          id: `npc_${Date.now()}_${Math.random()}`,
          name: generateNPCName(),
          joinTime: Date.now()
        }
        setNpcViewers(prev => [...prev, newViewer])
        setViewerCount(prev => prev + 1)
        
        // 显示进入提示
        const joinComment: Comment = {
          user: '系统',
          text: `${newViewer.name} 进入了直播间`,
          id: Date.now(),
          isNPC: true
        }
        setComments(prev => [...prev, joinComment])
      }
      
      // 随机移除观众
      if (Math.random() > config.retentionRate && npcViewers.length > 10) {
        setNpcViewers(prev => prev.slice(1))
        setViewerCount(prev => Math.max(config.initialRange[0], prev - 1))
      }
    }, 8000) // 每8秒执行一次
    
    return () => clearInterval(interval)
  }, [elapsedMinutes, config, npcViewers.length])
  
  // AI生成的智能NPC评论系统
  useEffect(() => {
    const interval = setInterval(async () => {
      if (npcViewers.length === 0 || comments.length === 0) return
      if (Math.random() > 0.6) return // 60%概率不发送
      
      try {
        // 获取最近的对话内容
        const recentChats = comments.slice(-8).map(c => `${c.user}: ${c.text}`).join('\n')
        
        const messages = [
          {
            role: 'system',
            content: `你是直播间观众，要生成真实自然的弹幕评论。评论类型：
1. 调侃主播（20%）："主播今天好像有点累啊" "哈哈这个梗笑死我了"
2. 鼓励支持（30%）："加油！" "主播唱的真好听" "爱了爱了"
3. 提问互动（20%）："主播今天吃了吗" "能唱xxx吗"
4. 毒舌吐槽（10%）："主播有点菜啊" "这也太水了吧"
5. 送礼物（10%）："送主播一朵花" "刷火箭了！"
6. 观众互怼（10%）：回复其他观众，格式"@观众名 你说啥呢"

生成1条评论，格式：观众名|||评论内容。保持简短真实，5-15字。`
          },
          {
            role: 'user',
            content: `直播间气氛：\n${recentChats}\n\n观众列表：${npcViewers.slice(0, 8).map(v => v.name).join(', ')}`
          }
        ]
        
        const response = await callAI(messages)
        const parts = response.split('|||')
        
        let userName = parts[0]?.trim()
        let commentText = parts[1]?.trim() || parts[0]?.trim()
        
        // 如果没有正确解析，使用随机观众
        if (!userName || userName === commentText) {
          userName = npcViewers[Math.floor(Math.random() * npcViewers.length)].name
          commentText = response.replace(/.*?|||/, '').trim() || response.trim()
        }
        
        // 特殊处理：送礼物评论
        if (commentText.includes('送') || commentText.includes('刷') || commentText.includes('火箭') || commentText.includes('礼物')) {
          // 有小概率真的送礼物
          if (Math.random() > 0.7) {
            const gifts = ['玫瑰🌹', '爱心❤️', '火箭🚀', '皇冠👑']
            const gift = gifts[Math.floor(Math.random() * gifts.length)]
            commentText = `送出了${gift}`
          }
        }
        
        const npcComment: Comment = {
          user: userName,
          text: commentText,
          id: Date.now(),
          isNPC: true
        }
        setComments(prev => [...prev, npcComment])
        
        // 小概率触发楼中楼（观众互怼）
        if (Math.random() > 0.85 && commentText.includes('@')) {
          setTimeout(async () => {
            const replyUser = npcViewers[Math.floor(Math.random() * npcViewers.length)].name
            const replyMessages = [
              {
                role: 'system',
                content: '生成一条观众回复另一个观众的评论。可以是：赞同、反对、调侃、吐槽。保持简短5-10字。'
              },
              {
                role: 'user',
                content: `${userName}说: ${commentText}`
              }
            ]
            const replyText = await callAI(replyMessages)
            
            const replyComment: Comment = {
              user: replyUser,
              text: replyText,
              id: Date.now() + 1,
              isNPC: true
            }
            setComments(prev => [...prev, replyComment])
          }, 1500 + Math.random() * 2000)
        }
        
      } catch (error) {
        console.error('❌ AI评论生成失败:', error)
        // 失败时使用简单评论
        if (npcViewers.length > 0 && Math.random() > 0.5) {
          const simpleComments = ['666', '哈哈哈', '主播加油', '好看！', '爱了']
          const npcComment: Comment = {
            user: npcViewers[Math.floor(Math.random() * npcViewers.length)].name,
            text: simpleComments[Math.floor(Math.random() * simpleComments.length)],
            id: Date.now(),
            isNPC: true
          }
          setComments(prev => [...prev, npcComment])
        }
      }
    }, 8000 + Math.random() * 7000) // 8-15秒随机发送
    
    return () => clearInterval(interval)
  }, [npcViewers, comments])

  return (
    <div className="h-screen flex flex-col bg-black">
      {showStatusBar && <StatusBar />}
      {/* 直播画面区域 */}
      <div className="relative flex-1 bg-gray-900">
        {/* 直播画面 - AI头像/立绘（点击触发回复）*/}
        <div 
          onClick={handleAIClick}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-purple-900/20 to-pink-900/20 cursor-pointer active:scale-95 transition-transform"
        >
          {character?.avatar ? (
            character.avatar.startsWith('data:image') ? (
              <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-8xl">{character.avatar}</div>
            )
          ) : (
            <div className="text-gray-500 text-lg">直播画面</div>
          )}
          {/* AI动作描写显示区域 */}
          {currentAction && (
            <div className="absolute bottom-6 left-4 right-4 px-4 py-2 bg-purple-600/70 backdrop-blur-sm rounded-lg transition-all duration-300 max-w-sm">
              <div className="text-white text-sm italic">
                {currentAction}
              </div>
            </div>
          )}
        </div>

        {/* 顶部信息栏 */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <BackIcon size={20} />
            </button>

            {/* 主播信息 */}
            <div className="flex-1 mx-3 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl overflow-hidden">
                {character?.avatar && !character.avatar.startsWith('data:image') ? (
                  character.avatar
                ) : character?.avatar ? (
                  <img src={character.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{character?.name || '主播'}</div>
                <div className="text-white/70 text-xs">
                  {viewerCount >= 10000 
                    ? `${Math.floor(viewerCount / 10000)}万+人观看`
                    : `${viewerCount}人观看`
                  }
                </div>
              </div>
              <button
                onClick={handleFollow}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isFollowing
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isFollowing ? '已关注' : '关注'}
              </button>
            </div>

            {/* 更多按钮 */}
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 更多菜单 */}
        {showMoreMenu && (
          <div className="absolute top-16 right-4 bg-white rounded-xl shadow-xl overflow-hidden z-10">
            {['举报', '屏蔽', '清晰度', '音量'].map((item) => (
              <button
                key={item}
                onClick={() => setShowMoreMenu(false)}
                className="w-full px-6 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* 右侧功能栏 */}
        <div className="absolute right-4 bottom-32 flex flex-col gap-4">
          {/* 点赞 */}
          <div className="flex flex-col items-center">
            <button 
              onClick={handleLike}
              className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all ${
                isLiked ? 'text-red-500' : 'text-white'
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <span className="text-white text-xs mt-1">
              {likeCount >= 10000 
                ? `${Math.floor(likeCount / 10000)}万+`
                : likeCount
              }
            </span>
          </div>

          {/* 礼物 */}
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setShowGiftPanel(true)}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="8" width="18" height="4" rx="1"/>
                <path d="M12 8v13"/>
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/>
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>
              </svg>
            </button>
            <span className="text-white text-xs mt-1">礼物</span>
          </div>

          {/* 分享 */}
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
            <span className="text-white text-xs mt-1">分享</span>
          </div>
        </div>

        {/* 弹幕区域 */}
        <div className="absolute left-4 right-20 bottom-32 max-h-48 overflow-y-auto hide-scrollbar">
          <div className="flex flex-col gap-2">
            {comments.map((comment) => {
              // 安全检查：确保comment有必要的字段
              if (!comment.text || !comment.user) return null
              
              // 检查是否是动作描写（以括号或圆括号开头）
              const isAction = comment.text.startsWith('（') || comment.text.startsWith('(')
              const isStreamer = comment.user === character?.name || comment.user === '主播'
              const isSystem = comment.user === '系统'
              
              return (
                <div key={comment.id} className={`px-3 py-1.5 backdrop-blur-sm rounded-full text-sm max-w-xs w-fit ${
                  isAction ? 'bg-purple-500/30 italic' : isSystem ? 'bg-gray-500/30' : 'bg-black/40'
                }`}>
                  <span className={`font-medium ${
                    isStreamer ? 'text-pink-400' : isSystem ? 'text-gray-300' : 'text-blue-400'
                  }`}>{comment.user}：</span>
                  <span className={isAction ? 'text-gray-200' : 'text-white'}>{comment.text}</span>
                </div>
              )
            })}
            {isAiTyping && (
              <div className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm max-w-xs w-fit">
                <span className="text-pink-400 font-medium">{character?.name || '主播'}：</span>
                <span className="animate-pulse">正在输入...</span>
              </div>
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>
      </div>

      {/* 礼物面板 */}
      {showGiftPanel && (
        <>
          {/* 遮罩层 */}
          <div 
            className="absolute inset-0 bg-black/50 z-20"
            onClick={() => setShowGiftPanel(false)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 pb-20 z-30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">选择礼物</h3>
              <button onClick={() => setShowGiftPanel(false)} className="text-gray-500 hover:text-gray-700">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
              {[
                { name: '玫瑰', emoji: '🌹', price: 1 },
                { name: '爱心', emoji: '❤️', price: 5 },
                { name: '火箭', emoji: '🚀', price: 10 },
                { name: '跑车', emoji: '🚗', price: 20 },
                { name: '城堡', emoji: '🏰', price: 50 },
                { name: '皇冠', emoji: '👑', price: 100 },
                { name: '钻石', emoji: '💎', price: 200 },
                { name: '星星', emoji: '⭐', price: 520 }
              ].map((gift) => (
                <button
                  key={gift.name}
                  onClick={() => handleSendGift(gift.name, gift.price, gift.emoji)}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center text-3xl">
                    {gift.emoji}
                  </div>
                  <span className="text-xs text-gray-900 font-medium">{gift.name}</span>
                  <span className="text-xs text-red-500 font-semibold">¥{gift.price}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 底部互动区域 */}
      <div className="bg-white border-t border-gray-200 z-40 relative">
        <div className="flex items-center gap-2 p-3">
          {/* 表情按钮 */}
          <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>

          {/* 输入框 */}
          <div className="flex-1 h-10 px-4 bg-gray-100 rounded-full flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="说点什么..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* 评论数按钮 */}
          <button 
            onClick={() => inputRef.current?.focus()}
            className="w-10 h-10 rounded-full bg-gray-900/80 flex items-center justify-center text-white flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          {/* 发送按钮 */}
          {inputText && (
            <button 
              onClick={handleSendComment}
              className="px-5 h-10 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 active:bg-red-700 transition-colors flex-shrink-0"
            >
              发送
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveRoom
