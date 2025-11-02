import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/ContactsContext'
import { callAI } from '../utils/api'

interface Message {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: number
}

type CellValue = 'empty' | 'black' | 'white'
type Board = CellValue[][]

const BOARD_SIZE = 15

const GomokuGame = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { showStatusBar } = useSettings()
  const { getCharacter } = useCharacter()
  
  const character = id ? getCharacter(id) : null
  
  // 游戏状态
  const [showFirstPlayerSelect, setShowFirstPlayerSelect] = useState(true)
  const [playerColor, setPlayerColor] = useState<'black' | 'white'>('black')
  const [board, setBoard] = useState<Board>(createEmptyBoard())
  const [currentPlayer, setCurrentPlayer] = useState<'black' | 'white'>('black')
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [waitingForAi, setWaitingForAi] = useState(false)
  const [moveHistory, setMoveHistory] = useState<Array<{x: number, y: number, player: 'black' | 'white'}>>([])
  
  // 聊天状态
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isAiThinking, setIsAiThinking] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  function createEmptyBoard(): Board {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill('empty'))
  }

  useEffect(() => {
    drawBoard()
  }, [board])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 选择先手
  const handleSelectFirstPlayer = (first: 'player' | 'ai') => {
    if (first === 'player') {
      setPlayerColor('black')
      setCurrentPlayer('black')
      addSystemMessage(`你选择了黑棋先手，${character?.name} 是白棋。`)
    } else {
      setPlayerColor('white')
      setCurrentPlayer('black')
      setWaitingForAi(true)
      addSystemMessage(`${character?.name} 选择了黑棋先手，你是白棋。点击"AI回复"让TA下棋。`)
    }
    setShowFirstPlayerSelect(false)
  }

  const drawBoard = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cellSize = canvas.width / BOARD_SIZE
    
    // 清空画布
    ctx.fillStyle = '#DEB887'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 画网格
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    for (let i = 0; i < BOARD_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(cellSize / 2, i * cellSize + cellSize / 2)
      ctx.lineTo(canvas.width - cellSize / 2, i * cellSize + cellSize / 2)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(i * cellSize + cellSize / 2, cellSize / 2)
      ctx.lineTo(i * cellSize + cellSize / 2, canvas.height - cellSize / 2)
      ctx.stroke()
    }

    // 画星位
    const stars = [3, 7, 11]
    ctx.fillStyle = '#000'
    stars.forEach(x => {
      stars.forEach(y => {
        ctx.beginPath()
        ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, 4, 0, Math.PI * 2)
        ctx.fill()
      })
    })

    // 画棋子
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 'empty') {
          ctx.beginPath()
          ctx.arc(
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2,
            cellSize * 0.4,
            0,
            Math.PI * 2
          )
          ctx.fillStyle = cell === 'black' ? '#000' : '#fff'
          ctx.fill()
          ctx.strokeStyle = '#000'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })
    })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || showFirstPlayerSelect || isAiThinking) return
    
    // 判断是否轮到玩家
    if (currentPlayer !== playerColor) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const cellSize = canvas.width / BOARD_SIZE
    const x = Math.floor((e.clientX - rect.left) / cellSize)
    const y = Math.floor((e.clientY - rect.top) / cellSize)

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === 'empty') {
      makeMove(x, y, playerColor)
    }
  }

  const makeMove = (x: number, y: number, player: 'black' | 'white') => {
    const newBoard = board.map(row => [...row])
    newBoard[y][x] = player
    setBoard(newBoard)
    
    // 记录历史
    setMoveHistory(prev => [...prev, { x, y, player }])

    // 检查胜负
    if (checkWin(newBoard, x, y, player)) {
      setGameOver(true)
      const winnerName = player === playerColor ? '你' : character?.name || 'AI'
      setWinner(winnerName)
      addSystemMessage(`${winnerName} 赢了！`)
      return
    }

    // 检查平局
    if (isBoardFull(newBoard)) {
      setGameOver(true)
      addSystemMessage('平局！')
      return
    }

    // 切换玩家
    setCurrentPlayer(player === 'black' ? 'white' : 'black')
    
    // 如果是玩家下的，等待AI回复
    if (player === playerColor) {
      setWaitingForAi(true)
    }
  }

  // AI行动（下棋+聊天）
  const handleAiResponse = async () => {
    if (!waitingForAi || isAiThinking || gameOver) return
    
    setIsAiThinking(true)
    setWaitingForAi(false)
    
    try {
      const aiColor = playerColor === 'black' ? 'white' : 'black'
      
      // 构建棋盘状态
      const boardState = board.map(row => 
        row.map(cell => {
          if (cell === 'empty') return '.'
          if (cell === 'black') return 'X'
          return 'O'
        }).join('')
      ).join('\n')

      // 构建聊天历史
      const chatHistory = messages
        .filter(m => m.type !== 'system')
        .slice(-6)
        .map(m => `${m.type === 'user' ? '你' : character?.name}: ${m.content}`)
        .join('\n')

      const prompt = `我们正在下五子棋。你是${aiColor === 'black' ? '黑棋(X)' : '白棋(O)'}，我是${playerColor === 'black' ? '黑棋(X)' : '白棋(O)'}。

当前棋盘状态（15x15）：
${boardState}

${chatHistory ? `最近的聊天：\n${chatHistory}\n` : ''}
${inputMessage ? `我说：${inputMessage}\n` : ''}
请你：
1. 决定下一步的位置（格式：x,y，坐标从0到14）
2. 说一些话（可以评论棋局、回复我的话、或者闲聊）

**必须**用这个格式回复：
位置: x,y
说话: [你想说的话]`

      const systemMessage = { role: 'system' as const, content: character?.description || '你是一个五子棋高手，性格活泼健谈。' }
      const userMessage = { role: 'user' as const, content: prompt }
      const response = await callAI([systemMessage, userMessage])

      // 解析AI回复
      const posMatch = response.match(/位置[：:]\s*(\d+)\s*[,，]\s*(\d+)/)
      const talkMatch = response.match(/说话[：:]\s*(.+)/s)

      let moveX: number, moveY: number

      if (posMatch) {
        moveX = parseInt(posMatch[1])
        moveY = parseInt(posMatch[2])
        
        // 验证位置合法性
        if (moveX < 0 || moveX >= BOARD_SIZE || moveY < 0 || moveY >= BOARD_SIZE || board[moveY][moveX] !== 'empty') {
          const move = findBestMove(board, aiColor)
          moveX = move.x
          moveY = move.y
        }
      } else {
        // 如果AI没有正确返回格式，使用简单AI
        const move = findBestMove(board, aiColor)
        moveX = move.x
        moveY = move.y
      }

      // AI下棋
      makeMove(moveX, moveY, aiColor)

      // 显示AI说的话
      if (talkMatch) {
        addAiMessage(talkMatch[1].trim())
      } else {
        addAiMessage(`我下在 (${moveX}, ${moveY})`)
      }

      // 清空输入框
      setInputMessage('')

    } catch (error) {
      console.error('AI回复失败:', error)
      // 使用简单AI兜底
      const aiColor = playerColor === 'black' ? 'white' : 'black'
      const move = findBestMove(board, aiColor)
      makeMove(move.x, move.y, aiColor)
      addAiMessage(`我下在 (${move.x}, ${move.y})`)
      setInputMessage('')
    } finally {
      setIsAiThinking(false)
    }
  }

  // 简单AI算法
  const findBestMove = (currentBoard: Board, player: 'black' | 'white'): { x: number; y: number } => {
    const opponent = player === 'black' ? 'white' : 'black'
    
    // 优先找能赢的位置
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (currentBoard[y][x] === 'empty') {
          const testBoard = currentBoard.map(row => [...row])
          testBoard[y][x] = player
          if (checkWin(testBoard, x, y, player)) {
            return { x, y }
          }
        }
      }
    }

    // 其次找需要防守的位置
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (currentBoard[y][x] === 'empty') {
          const testBoard = currentBoard.map(row => [...row])
          testBoard[y][x] = opponent
          if (checkWin(testBoard, x, y, opponent)) {
            return { x, y }
          }
        }
      }
    }

    // 否则找中心附近的空位
    const center = Math.floor(BOARD_SIZE / 2)
    for (let radius = 0; radius < BOARD_SIZE; radius++) {
      for (let y = Math.max(0, center - radius); y <= Math.min(BOARD_SIZE - 1, center + radius); y++) {
        for (let x = Math.max(0, center - radius); x <= Math.min(BOARD_SIZE - 1, center + radius); x++) {
          if (currentBoard[y][x] === 'empty') {
            return { x, y }
          }
        }
      }
    }

    return { x: center, y: center }
  }

  const checkWin = (board: Board, lastX: number, lastY: number, player: 'black' | 'white'): boolean => {
    const directions = [
      [1, 0],  // 横
      [0, 1],  // 竖
      [1, 1],  // 斜\
      [1, -1]  // 斜/
    ]

    for (const [dx, dy] of directions) {
      let count = 1

      // 正方向
      for (let i = 1; i < 5; i++) {
        const x = lastX + dx * i
        const y = lastY + dy * i
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y][x] !== player) break
        count++
      }

      // 反方向
      for (let i = 1; i < 5; i++) {
        const x = lastX - dx * i
        const y = lastY - dy * i
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y][x] !== player) break
        count++
      }

      if (count >= 5) return true
    }

    return false
  }

  const isBoardFull = (board: Board): boolean => {
    return board.every(row => row.every(cell => cell !== 'empty'))
  }

  // 悔棋
  const handleUndo = () => {
    if (moveHistory.length === 0 || isAiThinking || waitingForAi) return
    
    // 悔两步（玩家的和AI的）
    const steps = moveHistory.length >= 2 ? 2 : 1
    const newHistory = moveHistory.slice(0, -steps)
    setMoveHistory(newHistory)
    
    // 重建棋盘
    const newBoard = createEmptyBoard()
    newHistory.forEach(move => {
      newBoard[move.y][move.x] = move.player
    })
    setBoard(newBoard)
    
    // 重置游戏状态
    setGameOver(false)
    setWinner(null)
    setWaitingForAi(false)
    setCurrentPlayer(newHistory.length === 0 ? 'black' : (newHistory[newHistory.length - 1].player === 'black' ? 'white' : 'black'))
    
    addSystemMessage('已悔棋')
  }

  const addSystemMessage = (content: string) => {
    const message: Message = {
      id: `system_${Date.now()}`,
      type: 'system',
      content,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, message])
  }

  const addAiMessage = (content: string) => {
    const message: Message = {
      id: `ai_${Date.now()}`,
      type: 'ai',
      content,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, message])
  }

  const handleRestart = () => {
    setBoard(createEmptyBoard())
    setCurrentPlayer('black')
    setGameOver(false)
    setWinner(null)
    setMessages([])
    setMoveHistory([])
    setWaitingForAi(false)
    setShowFirstPlayerSelect(true)
  }

  if (!character) {
    return <div>角色不存在</div>
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-amber-50 to-orange-50">
      {showStatusBar && <StatusBar />}
      {/* 先手选择对话框 */}
      {showFirstPlayerSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">选择先手</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleSelectFirstPlayer('player')}
                className="w-full glass-card rounded-xl py-4 text-center ios-button hover:shadow-lg transition-shadow"
              >
                <div className="font-bold text-gray-900 mb-1">我先下（黑棋）</div>
                <div className="text-xs text-gray-500">黑棋先手有优势</div>
              </button>
              <button
                onClick={() => handleSelectFirstPlayer('ai')}
                className="w-full glass-card rounded-xl py-4 text-center ios-button hover:shadow-lg transition-shadow"
              >
                <div className="font-bold text-gray-900 mb-1">{character.name} 先下（黑棋）</div>
                <div className="text-xs text-gray-500">让TA先手试试</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 border-b border-gray-200/50 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">‹</span>
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <img src={character.avatar} alt={character.name} className="w-8 h-8 rounded-full" />
          <span className="font-semibold text-gray-900">{character.name} - 五子棋</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={moveHistory.length === 0 || isAiThinking || waitingForAi}
            className="text-blue-500 text-sm ios-button font-medium disabled:opacity-30"
          >
            悔棋
          </button>
          <button
            onClick={handleRestart}
            className="text-blue-500 text-sm ios-button font-medium"
          >
            重开
          </button>
        </div>
      </div>

      {/* 棋盘 */}
      <div className="flex-shrink-0 p-4 flex justify-center bg-white">
        <canvas
          ref={canvasRef}
          width={450}
          height={450}
          onClick={handleCanvasClick}
          className="border border-gray-300 rounded-lg shadow-lg cursor-pointer"
        />
      </div>

      {/* 游戏状态 */}
      <div className="flex-shrink-0 px-4 py-2 text-center">
        {gameOver ? (
          <div className="text-lg font-bold text-gray-900">
            {winner ? `${winner} 获胜！` : '平局！'}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            {isAiThinking ? `${character.name} 正在思考...` : 
             waitingForAi ? `等待 ${character.name} 回复（点击下方"AI回复"按钮）` :
             currentPlayer === playerColor ? `你的回合（${playerColor === 'black' ? '黑棋' : '白棋'}）` : 
             `${character.name} 的回合（${playerColor === 'black' ? '白棋' : '黑棋'}）`}
          </div>
        )}
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-2">
        {messages.map(msg => (
          <div key={msg.id} className={`mb-2 ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
            {msg.type === 'system' ? (
              <div className="text-center text-xs text-gray-500 py-1">
                {msg.content}
              </div>
            ) : msg.type === 'ai' ? (
              <div className="flex gap-2 max-w-[80%]">
                <img src={character.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="glass-card rounded-2xl px-4 py-2">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-500 text-white rounded-2xl px-4 py-2 max-w-[80%]">
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="flex-shrink-0 glass-effect border-t border-gray-200/50 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAiResponse()}
            placeholder={waitingForAi ? "说点什么..." : "和TA聊聊天..."}
            disabled={isAiThinking || gameOver}
            className="flex-1 glass-card rounded-xl px-4 py-2 text-sm border-none outline-none"
          />
          <button
            onClick={handleAiResponse}
            disabled={!waitingForAi || isAiThinking || gameOver}
            className="bg-blue-500 text-white rounded-xl px-6 py-2 text-sm font-medium ios-button disabled:opacity-50"
          >
            {isAiThinking ? '思考中...' : inputMessage.trim() ? '发送' : 'AI回复'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GomokuGame
