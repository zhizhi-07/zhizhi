import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import { callAI } from '../utils/api'

interface Player {
  id: string
  name: string
  avatar: string
  isAI: boolean
  word: string | null
  isOut: boolean
}

interface GameState {
  status: 'setup' | 'describing' | 'voting' | 'result' | 'finished'
  players: Player[]
  currentRound: number
  descriptions: { [playerId: string]: string }
  votes: { [playerId: string]: string }
  eliminatedPlayer: {
    id: string
    name: string
    word: string
    lastWords: string
  } | null
  announcement: string
  winner: 'civilian' | 'undercover' | null
  civilianWord: string
  undercoverWord: string
}

const UndercoverGame = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  
  const [gameState, setGameState] = useState<GameState>({
    status: 'setup',
    players: [],
    currentRound: 0,
    descriptions: {},
    votes: {},
    eliminatedPlayer: null,
    announcement: '',
    winner: null,
    civilianWord: '',
    undercoverWord: ''
  })
  
  const [selectedAIs, setSelectedAIs] = useState<string[]>([])
  const [userDescription, setUserDescription] = useState('')
  const [userVote, setUserVote] = useState<string | null>(null)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [descriptionOrder, setDescriptionOrder] = useState<string[]>([])
  
  // 新增：逐个发言动画
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  const [speakingText, setSpeakingText] = useState('')
  const [speakingQueue, setSpeakingQueue] = useState<{playerId: string, text: string}[]>([])
  
  // 新增：投票动画
  const [showVoteAnimation, setShowVoteAnimation] = useState(false)
  const [revealedVotes, setRevealedVotes] = useState<string[]>([])
  
  // 逐个发言动画逻辑
  useEffect(() => {
    if (speakingQueue.length === 0) return
    
    const [current, ...rest] = speakingQueue
    setCurrentSpeaker(current.playerId)
    setSpeakingText(current.text)
    
    const timer = setTimeout(() => {
      setCurrentSpeaker(null)
      setSpeakingText('')
      setSpeakingQueue(rest)
    }, 3000) // 每条发言显示3秒
    
    return () => clearTimeout(timer)
  }, [speakingQueue])

  // 选择/取消AI
  const toggleAI = (characterId: string) => {
    if (selectedAIs.includes(characterId)) {
      setSelectedAIs(selectedAIs.filter(id => id !== characterId))
    } else if (selectedAIs.length < 8) {
      setSelectedAIs([...selectedAIs, characterId])
    }
  }

  // 开始游戏
  const startGame = async () => {
    if (selectedAIs.length < 2) return
    
    setIsAiThinking(true)
    
    try {
      const aiPlayers = selectedAIs.map(id => {
        const char = characters.find(c => c.id === id)!
        return { id, name: char.name, avatar: char.avatar }
      })
      
      const playerNames = ['你', ...aiPlayers.map(p => p.name)].join('、')
      
      const prompt = `你是"谁是卧底"游戏主持人。
玩家：${playerNames}（共${selectedAIs.length + 1}人）

请：
1. 选择一对相似的词语（平民词、卧底词）
2. 随机分配：1个卧底，其他都是平民
3. 宣布游戏开始

**严格**按照以下JSON格式返回：
{
  "civilianWord": "平民词",
  "undercoverWord": "卧底词",
  "playerWords": {
    "user": "词语",
    "ai_0": "词语",
    "ai_1": "词语"
  },
  "announcement": "游戏开始的话"
}`

      const response = await callAI([
        { role: 'system' as const, content: '你是游戏主持人，只返回JSON格式数据，不要有其他文字。' },
        { role: 'user' as const, content: prompt }
      ])
      
      // 解析JSON
      let data
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('未找到JSON格式')
        }
        data = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        console.error('JSON解析失败:', parseError)
        alert('AI返回格式错误，请重试')
        throw parseError
      }
      
      // 构建玩家列表
      const players: Player[] = [
        {
          id: 'user',
          name: '你',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
          isAI: false,
          word: data.playerWords.user,
          isOut: false
        },
        ...aiPlayers.map((p, index) => ({
          id: `ai_${index}`,
          name: p.name,
          avatar: p.avatar,
          isAI: true,
          word: data.playerWords[`ai_${index}`],
          isOut: false
        }))
      ]
      
      // 随机打乱描述顺序
      const allPlayerIds = players.map(p => p.id)
      const shuffledOrder = [...allPlayerIds].sort(() => Math.random() - 0.5)
      setDescriptionOrder(shuffledOrder)
      
      setGameState({
        status: 'describing',
        players,
        currentRound: 1,
        descriptions: {},
        votes: {},
        eliminatedPlayer: null,
        announcement: data.announcement,
        winner: null,
        civilianWord: data.civilianWord,
        undercoverWord: data.undercoverWord
      })
      
    } catch (error) {
      console.error('开始游戏失败:', error)
      alert('游戏启动失败，请重试')
    } finally {
      setIsAiThinking(false)
    }
  }

  // 提交描述
  const submitDescription = () => {
    if (!userDescription.trim()) return
    
    setGameState(prev => ({
      ...prev,
      descriptions: {
        ...prev.descriptions,
        user: userDescription
      }
    }))
  }

  // AI描述
  const handleAIDescribe = async () => {
    if (!gameState.descriptions.user) return
    
    setIsAiThinking(true)
    
    try {
      const aiPlayers = gameState.players.filter(p => p.isAI && !p.isOut)
      const aiInfo = aiPlayers.map(p => `- ${p.name}（词语：${p.word}）`).join('\n')
      
      const prompt = `你是游戏主持人，第${gameState.currentRound}轮描述阶段。

用户已描述："${gameState.descriptions.user}"

请让以下AI依次描述他们的词语：
${aiInfo}

要求：
1. 每个AI一句话描述词语特征
2. 不要说出词语本身
3. 要隐藏自己可能是卧底（即使知道自己词语不同也要装作正常）

最后总结并引导投票。

**严格**按照以下JSON格式返回：
{
  "descriptions": {
    "ai_0": "描述内容",
    "ai_1": "描述内容"
  },
  "summary": "总结的话"
}`

      const response = await callAI([
        { role: 'system' as const, content: '你是游戏主持人，只返回JSON格式数据。' },
        { role: 'user' as const, content: prompt }
      ])
      
      // 解析JSON
      let data
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('未找到JSON格式')
        }
        data = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        console.error('JSON解析失败:', parseError)
        alert('AI返回格式错误，请重试')
        throw parseError
      }
      
      // 构建发言队列
      const aiDescriptions = Object.entries(data.descriptions).map(([playerId, text]) => ({
        playerId,
        text: text as string
      }))
      
      // 先添加用户的描述到队列
      setSpeakingQueue([
        { playerId: 'user', text: gameState.descriptions.user },
        ...aiDescriptions
      ])
      
      // 等待所有发言完成后再切换到投票阶段
      const totalDelay = (aiDescriptions.length + 1) * 3000
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          status: 'voting',
          descriptions: {
            ...prev.descriptions,
            ...data.descriptions
          },
          announcement: data.summary
        }))
      }, totalDelay)
      
      setUserDescription('')
      
    } catch (error) {
      console.error('AI描述失败:', error)
      alert('AI描述失败，请重试')
    } finally {
      setIsAiThinking(false)
    }
  }

  // 提交投票
  const submitVote = (playerId: string) => {
    setUserVote(playerId)
  }

  // AI投票
  const handleAIVote = async () => {
    if (!userVote) return
    
    setIsAiThinking(true)
    
    try {
      const aiPlayers = gameState.players.filter(p => p.isAI && !p.isOut)
      const allDescriptions = Object.entries(gameState.descriptions)
        .map(([id, desc]) => {
          const player = gameState.players.find(p => p.id === id)
          return `- ${player?.name}："${desc}"`
        })
        .join('\n')
      
      const aiInfo = aiPlayers.map(p => `- ${p.name}（词语：${p.word}）`).join('\n')
      
      const activePlayers = gameState.players.filter(p => !p.isOut)
      const activePlayerIds = activePlayers.map(p => p.id).join(', ')
      
      const prompt = `你是游戏主持人，第${gameState.currentRound}轮投票阶段。

所有描述：
${allDescriptions}

用户投票给：${gameState.players.find(p => p.id === userVote)?.name}

请：
1. 让以下AI投票（只能投给还在场的玩家：${activePlayerIds}）：
${aiInfo}
2. 统计所有票数（包括用户的票）
3. 找出得票最多的玩家（如果平票，随机选一个）
4. 让被淘汰者发表遗言（10-20字）
5. 公布被淘汰者的词语

**严格**按照以下JSON格式返回：
{
  "votes": {
    "ai_0": "被投票者id",
    "ai_1": "被投票者id"
  },
  "eliminated": "被淘汰者id",
  "voteCount": {
    "user": 1,
    "ai_0": 2
  },
  "lastWords": "遗言内容",
  "eliminatedWord": "被淘汰者的词语",
  "announcement": "宣布结果的话"
}`

      const response = await callAI([
        { role: 'system' as const, content: '你是游戏主持人，只返回JSON格式数据。' },
        { role: 'user' as const, content: prompt }
      ])
      
      // 解析JSON，支持多种格式
      let data
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('未找到JSON格式')
        }
        data = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        console.error('JSON解析失败:', parseError)
        // 使用备用逻辑：随机淘汰一个AI
        const aiPlayers = gameState.players.filter(p => p.isAI && !p.isOut)
        const randomAI = aiPlayers[Math.floor(Math.random() * aiPlayers.length)]
        data = {
          votes: {},
          eliminated: randomAI.id,
          voteCount: {},
          lastWords: '我...我不知道说什么...',
          eliminatedWord: randomAI.word,
          announcement: `${randomAI.name}被淘汰了！`
        }
      }
      
      const eliminatedPlayer = gameState.players.find(p => p.id === data.eliminated)
      if (!eliminatedPlayer) {
        throw new Error('被淘汰的玩家不存在')
      }
      
      // 更新玩家状态
      const updatedPlayers = gameState.players.map(p => 
        p.id === data.eliminated ? { ...p, isOut: true } : p
      )
      
      // 检查游戏是否结束
      const remainingPlayers = updatedPlayers.filter(p => !p.isOut)
      let winner: 'civilian' | 'undercover' | null = null
      
      // 统计卧底数量
      const undercoverCount = remainingPlayers.filter(p => 
        p.word === gameState.undercoverWord
      ).length
      
      const civilianCount = remainingPlayers.filter(p => 
        p.word === gameState.civilianWord
      ).length
      
      // 胜负判断
      if (undercoverCount === 0) {
        // 卧底全部出局 → 平民胜
        winner = 'civilian'
      } else if (remainingPlayers.length <= 3 && undercoverCount > 0) {
        // 剩余≤3人且卧底还在 → 卧底胜
        winner = 'undercover'
      } else if (undercoverCount >= civilianCount) {
        // 卧底数量≥平民数量 → 卧底胜
        winner = 'undercover'
      }
      
      setGameState(prev => ({
        ...prev,
        status: winner ? 'finished' : 'result',
        players: updatedPlayers,
        votes: {
          user: userVote,
          ...data.votes
        },
        eliminatedPlayer: {
          id: data.eliminated,
          name: eliminatedPlayer.name,
          word: data.eliminatedWord,
          lastWords: data.lastWords
        },
        announcement: data.announcement,
        winner
      }))
      
      setUserVote(null)
      
    } catch (error) {
      console.error('AI投票失败:', error)
      alert('AI投票失败，请重试')
    } finally {
      setIsAiThinking(false)
    }
  }

  // 下一轮
  const nextRound = () => {
    // 重新随机打乱顺序
    const activePlayers = gameState.players.filter(p => !p.isOut)
    const shuffledOrder = activePlayers.map(p => p.id).sort(() => Math.random() - 0.5)
    setDescriptionOrder(shuffledOrder)
    
    setGameState(prev => ({
      ...prev,
      status: 'describing',
      currentRound: prev.currentRound + 1,
      descriptions: {},
      votes: {},
      eliminatedPlayer: null,
      announcement: `第${prev.currentRound + 1}轮开始！请继续描述。`
    }))
  }

  // 重新开始
  const restart = () => {
    setGameState({
      status: 'setup',
      players: [],
      currentRound: 0,
      descriptions: {},
      votes: {},
      eliminatedPlayer: null,
      announcement: '',
      winner: null,
      civilianWord: '',
      undercoverWord: ''
    })
    setSelectedAIs([])
    setUserDescription('')
    setUserVote(null)
    setDescriptionOrder([])
  }

  const activePlayers = gameState.players.filter(p => !p.isOut)
  const userPlayer = gameState.players.find(p => p.id === 'user')

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 to-pink-50">
      {showStatusBar && <StatusBar />}
      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 border-b border-gray-200/50 flex items-center">
        <button
          onClick={() => navigate('/desktop', { replace: true })}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">‹</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">谁是卧底</h1>
        <button
          onClick={() => setShowRules(true)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">？</span>
        </button>
      </div>

      {/* 游戏规则弹窗 */}
      {showRules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">游戎规则</h2>
            
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <div className="font-bold text-gray-900 mb-1">🎯 游戏目标</div>
                <p>找出谁是卧底！平民要淘汰卧底，卧底要隐藏到最后。</p>
              </div>
              
              <div>
                <div className="font-bold text-gray-900 mb-1">🎲 角色分配</div>
                <p>每个人都会得到一个词语，大部分人是<strong>平民</strong>（相同词语），1人是<strong>卧底</strong>（相似但不同的词语）。</p>
              </div>
              
              <div>
                <div className="font-bold text-gray-900 mb-1">💬 描述阶段</div>
                <p>每人轮流用一句话描述自己的词语，但<strong>不能说出词语本身</strong>。要既让同伴明白，又不能让卧底猜到。</p>
              </div>
              
              <div>
                <div className="font-bold text-gray-900 mb-1">🗳️ 投票阶段</div>
                <p>所有人描述完后，每人投票选出你认为的卧底。得票最多的人被淘汰。</p>
              </div>
              
              <div>
                <div className="font-bold text-gray-900 mb-1">🏆 胜利条件</div>
                <p><strong>平民胜利</strong>：淘汰所有卧底<br/>
                <strong>卧底胜利</strong>：剩余人数≤3人且卧底还在</p>
              </div>
              
              <div>
                <div className="font-bold text-gray-900 mb-1">⚠️ 注意</div>
                <p>你<strong>不知道</strong>自己是平民还是卧底，只能通过别人的描述来推测！</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowRules(false)}
              className="w-full mt-6 bg-blue-500 text-white rounded-xl py-3 font-medium ios-button"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        {/* 设置阶段 */}
        {gameState.status === 'setup' && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-bold text-gray-900 mb-2">选择AI玩家</h2>
              <p className="text-sm text-gray-500 mb-4">选择2-8个AI角色一起玩</p>
              
              <div className="grid grid-cols-2 gap-3">
                {characters.map(char => (
                  <div
                    key={char.id}
                    onClick={() => toggleAI(char.id)}
                    className={`glass-card rounded-xl p-3 ios-button cursor-pointer transition-all ${
                      selectedAIs.includes(char.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={char.avatar} alt={char.name} className="w-10 h-10 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{char.name}</div>
                      </div>
                      {selectedAIs.includes(char.id) && (
                        <div className="text-blue-500 text-xl">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowRules(true)}
                  className="text-blue-500 text-sm ios-button"
                >
                  📖 查看游戏规则
                </button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                已选择 {selectedAIs.length} 个AI
              </div>
            </div>

            <button
              onClick={startGame}
              disabled={selectedAIs.length < 2 || isAiThinking}
              className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium ios-button disabled:opacity-50"
            >
              {isAiThinking ? '准备中...' : '开始游戏'}
            </button>
          </div>
        )}

        {/* 游戏进行中 */}
        {gameState.status !== 'setup' && gameState.status !== 'finished' && (
          <div className="space-y-4">
            {/* 圆桌视图 */}
            <div className="glass-card rounded-2xl p-6">
              <div className="text-center mb-4">
                <div className="text-lg font-bold text-gray-900">第 {gameState.currentRound} 轮</div>
                <div className="text-sm text-gray-500 mt-1">
                  {gameState.status === 'describing' ? '描述阶段' : '投票阶段'}
                </div>
              </div>
              
              <div className="relative w-full aspect-square max-w-sm mx-auto">
                {/* 圆桌中央 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="glass-card rounded-full w-32 h-32 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🎭</div>
                      <div className="text-xs text-gray-600">
                        剩余 {activePlayers.length} 人
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 玩家围成圆圈 */}
                {activePlayers.map((player, index) => {
                  const angle = (index * 360) / activePlayers.length - 90
                  const radius = 42
                  const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
                  const y = 50 + radius * Math.sin((angle * Math.PI) / 180)
                  const isSpeaking = currentSpeaker === player.id
                  const hasVoted = revealedVotes.includes(player.id)
                  
                  return (
                    <div
                      key={player.id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                        isSpeaking ? 'scale-110 z-10' : ''
                      }`}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`
                      }}
                    >
                      <div className="relative">
                        {/* 头像 */}
                        <div className={`w-16 h-16 rounded-full overflow-hidden border-4 transition-all ${
                          isSpeaking 
                            ? 'border-blue-500 shadow-lg shadow-blue-500/50' 
                            : player.isOut
                            ? 'border-gray-300 opacity-50'
                            : 'border-white'
                        }`}>
                          <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                        </div>
                        
                        {/* 发言中动画 */}
                        {isSpeaking && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs">💬</span>
                          </div>
                        )}
                        
                        {/* 已投票标记 */}
                        {hasVoted && gameState.status === 'voting' && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        
                        {/* 名字 */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
                          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                            isSpeaking ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                          }`}>
                            {player.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* 游戏信息 */}
            <div className="glass-card rounded-2xl p-4">
              {userPlayer && (
                <div className="bg-blue-50 rounded-xl p-3 mb-3">
                  <div className="text-xs text-blue-600 mb-1">你的词语</div>
                  <div className="text-2xl font-bold text-blue-900">{userPlayer.word}</div>
                </div>
              )}
              
              {gameState.announcement && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-sm text-gray-700">{gameState.announcement}</div>
                </div>
              )}
              
              {/* 当前发言气泡 */}
              {currentSpeaker && speakingText && (
                <div className="mt-3 animate-slide-up">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-4 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                        <img 
                          src={gameState.players.find(p => p.id === currentSpeaker)?.avatar} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="font-medium">
                        {gameState.players.find(p => p.id === currentSpeaker)?.name}
                      </div>
                      <div className="flex-1"></div>
                      <div className="animate-pulse">💬</div>
                    </div>
                    <div className="text-sm leading-relaxed">
                      {speakingText}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 描述阶段 */}
            {gameState.status === 'describing' && (
              <div className="space-y-3">
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900 mb-3">描述你的词语</h3>
                  
                  {!gameState.descriptions.user ? (
                    <div className="space-y-3">
                      <textarea
                        value={userDescription}
                        onChange={(e) => setUserDescription(e.target.value)}
                        placeholder="用一句话描述你的词语特征，但不要说出词语本身..."
                        disabled={isAiThinking}
                        className="w-full glass-card rounded-xl px-4 py-3 text-sm resize-none h-24"
                      />
                      <button
                        onClick={submitDescription}
                        disabled={!userDescription.trim() || isAiThinking}
                        className="w-full bg-blue-500 text-white rounded-xl py-2 text-sm font-medium ios-button disabled:opacity-50"
                      >
                        提交描述
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="text-xs text-green-600 mb-1">你的描述</div>
                        <div className="text-sm text-gray-900">{gameState.descriptions.user}</div>
                      </div>
                      
                      <button
                        onClick={handleAIDescribe}
                        disabled={isAiThinking}
                        className="w-full bg-blue-500 text-white rounded-xl py-2 text-sm font-medium ios-button disabled:opacity-50"
                      >
                        {isAiThinking ? 'AI正在描述...' : 'AI回复'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 投票阶段 */}
            {gameState.status === 'voting' && (
              <div className="space-y-3">
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900 mb-3">所有人的描述</h3>
                  
                  {/* 按顺序显示描述 */}
                  {descriptionOrder.map((playerId, index) => {
                    const desc = gameState.descriptions[playerId]
                    if (!desc) return null
                    
                    const player = gameState.players.find(p => p.id === playerId)
                    if (!player) return null
                    
                    return (
                      <div key={playerId} className="mb-3 last:mb-0">
                        <div className="flex items-start gap-2">
                          <div className="text-xs text-gray-400 w-5 flex-shrink-0">{index + 1}.</div>
                          <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">{player.name}</div>
                            <div className="text-sm text-gray-900">{desc}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="glass-card rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900 mb-3">投票选出卧底</h3>
                  
                  {!userVote ? (
                    <div className="space-y-2">
                      {activePlayers.filter(p => p.id !== 'user').map(player => (
                        <button
                          key={player.id}
                          onClick={() => submitVote(player.id)}
                          disabled={isAiThinking}
                          className={`w-full glass-card rounded-xl p-3 ios-button flex items-center gap-3 hover:shadow-lg transition-shadow ${
                            player.isOut ? 'opacity-50' : ''
                          }`}
                        >
                          <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full" />
                          <div className="flex-1 text-left">
                            <div className="font-medium text-gray-900">{player.name}</div>
                            {player.isOut && (
                              <div className="text-xs text-red-500">已出局</div>
                            )}
                          </div>
                          <div className="text-gray-400">›</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="text-xs text-green-600 mb-1">你投票给</div>
                        <div className="text-sm font-medium text-gray-900">
                          {gameState.players.find(p => p.id === userVote)?.name}
                        </div>
                      </div>
                      
                      <button
                        onClick={handleAIVote}
                        disabled={isAiThinking}
                        className="w-full bg-blue-500 text-white rounded-xl py-2 text-sm font-medium ios-button disabled:opacity-50"
                      >
                        {isAiThinking ? 'AI正在投票...' : 'AI回复'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 结果阶段 */}
            {gameState.status === 'result' && gameState.eliminatedPlayer && (
              <div className="space-y-3">
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="font-bold text-gray-900 mb-3">投票结果</h3>
                  
                  <div className="bg-red-50 rounded-xl p-4 mb-3">
                    <div className="text-center mb-3">
                      <div className="text-sm text-red-600 mb-2">被淘汰</div>
                      <div className="text-xl font-bold text-red-900">{gameState.eliminatedPlayer.name}</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <div className="text-xs text-gray-500 mb-1">遗言</div>
                      <div className="text-sm text-gray-900 italic">"{gameState.eliminatedPlayer.lastWords}"</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">TA的词语是</div>
                      <div className="text-lg font-bold text-gray-900">{gameState.eliminatedPlayer.word}</div>
                    </div>
                  </div>
                  
                  {gameState.announcement && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <div className="text-sm text-gray-700">{gameState.announcement}</div>
                    </div>
                  )}
                  
                  <button
                    onClick={nextRound}
                    className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium ios-button"
                  >
                    进入下一轮
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 游戏结束 */}
        {gameState.status === 'finished' && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">游戏结束！</h2>
              <div className="text-lg text-gray-700 mb-4">
                {gameState.winner === 'civilian' ? '平民获胜！' : '卧底获胜！'}
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">平民词</div>
                    <div className="text-lg font-bold text-blue-600">{gameState.civilianWord}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">卧底词</div>
                    <div className="text-lg font-bold text-red-600">{gameState.undercoverWord}</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={restart}
                className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium ios-button"
              >
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UndercoverGame
