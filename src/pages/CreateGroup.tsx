import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import { useCharacter } from '../context/CharacterContext'
import { useGroup, GroupMember } from '../context/GroupContext'

const CreateGroup = () => {
  const navigate = useNavigate()
  const { characters } = useCharacter()
  const { addGroup } = useGroup()
  
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [step, setStep] = useState<'select' | 'name'>('select')

  // 切换选择成员
  const toggleMember = (characterId: string) => {
    setSelectedMembers(prev => 
      prev.includes(characterId) 
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    )
  }

  // 下一步：设置群名称
  const handleNext = () => {
    if (selectedMembers.length < 2) {
      alert('至少选择2个成员')
      return
    }
    // 自动生成群名称
    const selectedChars = characters.filter(c => selectedMembers.includes(c.id))
    const autoName = selectedChars.slice(0, 3).map(c => c.name).join('、') + 
      (selectedChars.length > 3 ? '...' : '')
    setGroupName(autoName)
    setStep('name')
  }

  // 创建群聊
  const handleCreate = () => {
    if (!groupName.trim()) {
      alert('请输入群名称')
      return
    }

    // 构建群成员列表
    const members: GroupMember[] = selectedMembers.map(characterId => {
      const character = characters.find(c => c.id === characterId)!
      return {
        id: characterId,
        type: 'character' as const,
        name: character.name,
        avatar: character.avatar,
        role: 'member' as const,
        joinedAt: new Date().toISOString()
      }
    })

    // 添加用户自己作为群主
    members.unshift({
      id: 'user',
      type: 'user' as const,
      name: '我',
      avatar: '👤',
      role: 'owner' as const,
      joinedAt: new Date().toISOString()
    })

    // 创建群聊
    const groupId = addGroup({
      name: groupName,
      avatar: '', // 九宫格头像由前端动态生成
      members,
      owner: 'user',
      admins: [],
      settings: {
        allowMemberInvite: true,
        muteAll: false,
        showMemberName: true,
        aiReplyMode: 'all',
        aiReplyInterval: 2,
        maxAiRepliesPerMessage: 3
      }
    })

    // 📢 通知所有AI角色：你被拉进了新群
    selectedMembers.forEach(characterId => {
      try {
        const character = characters.find(c => c.id === characterId)
        if (!character) return
        
        const chatKey = `chat_messages_${characterId}`
        const chatMessages = localStorage.getItem(chatKey)
        const messages = chatMessages ? JSON.parse(chatMessages) : []
        
        // 获取群成员名单
        const memberNames = members
          .filter(m => m.id !== characterId)
          .map(m => m.name)
          .join('、')
        
        const systemMessage = {
          id: Date.now() + Math.random(),
          role: 'system',
          content: `[系统通知] 你被用户拉进了群聊"${groupName}"。群成员有：${memberNames}`,
          timestamp: Date.now(),
          isHidden: false  // 可见，让AI明确知道进群了
        }
        
        messages.push(systemMessage)
        localStorage.setItem(chatKey, JSON.stringify(messages))
        
        console.log(`📢 已通知 ${character.name} 进入群聊"${groupName}"`)
      } catch (error) {
        console.error(`通知 ${characterId} 失败:`, error)
      }
    })

    // 跳转到群聊详情（使用replace避免返回到创建页面）
    navigate(`/group/${groupId}`, { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="glass-effect px-5 py-4 flex items-center justify-between border-b border-gray-200/50 sticky top-0 z-50 bg-white/95 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => step === 'name' ? setStep('select') : navigate(-1)} className="ios-button">
            <BackIcon size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {step === 'select' ? '选择群成员' : '设置群名称'}
          </h1>
        </div>
        {step === 'select' && (
          <button 
            onClick={handleNext}
            disabled={selectedMembers.length < 2}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedMembers.length >= 2 
                ? 'bg-wechat-primary text-white' 
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            下一步 ({selectedMembers.length})
          </button>
        )}
        {step === 'name' && (
          <button 
            onClick={handleCreate}
            className="px-4 py-2 rounded-full text-sm font-medium bg-wechat-primary text-white"
          >
            完成
          </button>
        )}
      </div>

      {/* 选择成员 */}
      {step === 'select' && (
        <div className="flex-1 overflow-y-auto hide-scrollbar p-3">
          {characters.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">暂无可选择的角色</p>
              <button
                onClick={() => navigate('/create-character')}
                className="px-6 py-2 bg-wechat-primary text-white rounded-full"
              >
                创建角色
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {characters.map(character => {
                const isSelected = selectedMembers.includes(character.id)
                const isCustomAvatar = character.avatar && character.avatar.startsWith('data:image')
                
                return (
                  <div
                    key={character.id}
                    onClick={() => toggleMember(character.id)}
                    className={`flex items-center p-4 glass-card rounded-2xl cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-wechat-primary bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* 选择框 */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                      isSelected ? 'bg-wechat-primary border-wechat-primary' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* 头像 */}
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                      {isCustomAvatar ? (
                        <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{character.avatar || '🤖'}</span>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="ml-3 flex-1 overflow-hidden">
                      <h3 className="font-medium text-gray-900">{character.name}</h3>
                      {character.signature && (
                        <p className="text-sm text-gray-500 truncate">{character.signature}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 设置群名称 */}
      {step === 'name' && (
        <div className="flex-1 overflow-y-auto hide-scrollbar p-5">
          <div className="glass-card rounded-2xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              群名称
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="请输入群名称"
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wechat-primary"
            />
            <p className="text-xs text-gray-400 mt-2">
              {groupName.length}/20
            </p>
          </div>

          {/* 已选成员预览 */}
          <div className="glass-card rounded-2xl p-6 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              群成员 ({selectedMembers.length + 1})
            </h3>
            <div className="flex flex-wrap gap-3">
              {/* 用户自己 */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-blue-200 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">👤</span>
                </div>
                <span className="text-xs text-gray-600 mt-1">我</span>
              </div>

              {/* 选中的角色 */}
              {selectedMembers.map(memberId => {
                const character = characters.find(c => c.id === memberId)
                if (!character) return null
                const isCustomAvatar = character.avatar && character.avatar.startsWith('data:image')
                
                return (
                  <div key={memberId} className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
                      {isCustomAvatar ? (
                        <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{character.avatar || '🤖'}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 mt-1 max-w-[60px] truncate">
                      {character.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateGroup
