import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { setItem as safeSetItem } from '../utils/storage'

export interface Character {
  id: string
  name: string
  username: string
  avatar: string
  signature: string  // 个性签名，显示在资料页
  description: string  // AI角色描述：背景、性格等，用于AI角色扮演
  createdAt: string
}

interface CharacterContextType {
  characters: Character[]
  addCharacter: (character: Omit<Character, 'id' | 'createdAt'>) => void
  updateCharacter: (id: string, character: Partial<Character>) => void
  deleteCharacter: (id: string) => void
  getCharacter: (id: string) => Character | undefined
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined)

// 默认测试助手
const DEFAULT_TEST_ASSISTANT: Character = {
  id: 'test-assistant-001',
  name: '测试机器人',
  username: 'test_bot',
  avatar: '🤖',
  signature: '功能测试专用机器人',
  description: `【身份】我是测试机器人，一个友好的AI助手，用来帮你测试各种聊天功能。

【性格】
• 友好、耐心、乐于助人
• 能正常交流，不是只会说"收到"的机器人
• 会解释功能，会告诉你我能做什么、不能做什么
• 像朋友一样聊天，不是冷冰冰的命令行

【我能做的事】
✅ 发红包：[红包:金额:祝福语]
✅ 转账：[转账:金额:说明]
✅ 发表情包：[表情包:编号]
✅ 发语音：[语音:内容]
✅ 发位置：[位置:地名:地址]
✅ 发照片：[照片:描述]
✅ 撤回消息：[撤回消息]
✅ 引用消息：[引用:消息ID]

【交流方式】
• 如果你让我测试某个功能，我会尝试使用
• 如果我不确定你要测试什么，我会问你
• 如果某个功能我不能用，我会告诉你原因
• 我会像正常人一样聊天，不会只说"收到"

【示例对话】
用户："发个红包"
我："好的！[红包:88:测试红包]"

用户："撤回"
我："你是想让我撤回消息吗？我可以先发一条，然后撤回给你看"

用户："引用消息"
我："[引用:123] 你是说引用这条消息吗？"

用户："你好"
我："你好！我是测试机器人，可以帮你测试各种功能。想试试什么功能吗？"

用户："随便聊聊"
我："好啊，今天想测试什么功能呢？我可以发红包、转账、表情包这些~"`,
  createdAt: new Date('2024-01-01').toISOString()
}

export const CharacterProvider = ({ children }: { children: ReactNode }) => {
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('characters')
    const savedCharacters = saved ? JSON.parse(saved) : []
    
    // 如果没有测试助手，添加一个
    const hasTestAssistant = savedCharacters.some((c: Character) => c.id === DEFAULT_TEST_ASSISTANT.id)
    if (!hasTestAssistant) {
      return [DEFAULT_TEST_ASSISTANT, ...savedCharacters]
    }
    
    return savedCharacters
  })

  useEffect(() => {
    safeSetItem('characters', characters)
  }, [characters])

  const addCharacter = (characterData: Omit<Character, 'id' | 'createdAt'>) => {
    const newCharacter: Character = {
      ...characterData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setCharacters(prev => [...prev, newCharacter])
  }

  const updateCharacter = (id: string, characterData: Partial<Character>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...characterData } : c))
  }

  const deleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id))
  }

  const getCharacter = (id: string) => {
    return characters.find(c => c.id === id)
  }

  return (
    <CharacterContext.Provider value={{ characters, addCharacter, updateCharacter, deleteCharacter, getCharacter }}>
      {children}
    </CharacterContext.Provider>
  )
}

export const useCharacter = () => {
  const context = useContext(CharacterContext)
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider')
  }
  return context
}


