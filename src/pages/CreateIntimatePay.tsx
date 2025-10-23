import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import { useCharacter } from '../context/CharacterContext'
import { getIntimatePayRelations } from '../utils/walletUtils'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const CreateIntimatePay = () => {
  const navigate = useNavigate()
  const { characterId } = useParams<{ characterId: string }>()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [showLimitInput, setShowLimitInput] = useState(false)

  // 获取已开通亲密付的角色ID列表
  const [existingRelationIds, setExistingRelationIds] = useState<string[]>([])

  useEffect(() => {
    const relations = getIntimatePayRelations()
    setExistingRelationIds(relations.map(r => r.characterId))
  }, [])

  // 过滤掉已开通的角色
  const availableCharacters = characters.filter(c => !existingRelationIds.includes(c.id))

  // 预设额度选项
  const limitOptions = [
    { label: '500元/月', value: 500 },
    { label: '1000元/月', value: 1000 },
    { label: '2000元/月', value: 2000 },
    { label: '3000元/月', value: 3000 },
    { label: '5000元/月', value: 5000 },
    { label: '自定义', value: 0 },
  ]

  // 选择角色
  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId)
  }

  // 选择额度
  const handleSelectLimit = (value: number) => {
    if (value === 0) {
      setShowLimitInput(true)
      setMonthlyLimit('')
    } else {
      setShowLimitInput(false)
      setMonthlyLimit(value.toString())
    }
  }

  // 确认开通
  const handleConfirm = () => {
    if (!selectedCharacterId) {
      alert('请选择要开通亲密付的联系人')
      return
    }

    const limit = parseFloat(monthlyLimit)
    if (isNaN(limit) || limit <= 0) {
      alert('请输入有效的月额度')
      return
    }

    const character = characters.find(c => c.id === selectedCharacterId)
    if (!character) {
      alert('角色不存在')
      return
    }

    // 跳转到聊天窗口，并通过state传递亲密付信息
    navigate(`/chat/${selectedCharacterId}`, {
      state: {
        sendIntimatePay: true,
        monthlyLimit: limit
      }
    })
  }

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
      {/* iOS状态栏 */}
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white flex items-center justify-between border-b border-gray-200">
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-4 active:opacity-50 cursor-pointer flex items-center justify-center"
        >
          <BackIcon size={24} className="text-gray-900" />
        </button>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-[17px] font-medium text-gray-900">开通亲密付</h1>
        <button
          onClick={handleConfirm}
          disabled={!selectedCharacterId || !monthlyLimit}
          className={`px-4 py-4 text-[16px] ${
            selectedCharacterId && monthlyLimit ? 'text-[#07C160]' : 'text-gray-400'
          }`}
        >
          完成
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 选择联系人 */}
        <div className="bg-white mt-3 px-4 py-3">
          <h2 className="text-sm text-gray-500 mb-3">选择联系人</h2>
          {availableCharacters.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              暂无可开通的联系人
            </div>
          ) : (
            <div className="space-y-2">
              {availableCharacters.map((character) => (
                <div
                  key={character.id}
                  onClick={() => handleSelectCharacter(character.id)}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedCharacterId === character.id
                      ? 'bg-green-50 border-2 border-[#07C160]'
                      : 'bg-gray-50 border-2 border-transparent active:bg-gray-100'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {character.avatar.startsWith('data:image') ? (
                      <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{character.avatar}</span>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-[16px] font-medium text-gray-900">{character.name}</div>
                    {character.signature && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{character.signature}</div>
                    )}
                  </div>
                  {selectedCharacterId === character.id && (
                    <div className="w-6 h-6 bg-[#07C160] rounded-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 设置月额度 */}
        {selectedCharacterId && (
          <div className="bg-white mt-3 px-4 py-3">
            <h2 className="text-sm text-gray-500 mb-3">设置月额度</h2>
            <div className="grid grid-cols-2 gap-3">
              {limitOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleSelectLimit(option.value)}
                  className={`py-3 rounded-xl text-[15px] font-medium transition-colors ${
                    (option.value === 0 && showLimitInput) ||
                    (option.value > 0 && monthlyLimit === option.value.toString())
                      ? 'bg-green-50 text-[#07C160] border-2 border-[#07C160]'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent active:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* 自定义额度输入 */}
            {showLimitInput && (
              <div className="mt-4">
                <div className="flex items-center border-2 border-[#07C160] rounded-xl px-4 py-3 bg-white">
                  <span className="text-xl text-gray-900 mr-2">¥</span>
                  <input
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    placeholder="请输入月额度"
                    className="flex-1 text-xl outline-none"
                    autoFocus
                  />
                  <span className="text-sm text-gray-500">/月</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 说明文字 */}
        {selectedCharacterId && monthlyLimit && (
          <div className="bg-[#FFF9E6] mx-4 mt-4 p-4 rounded-xl">
            <p className="text-xs text-[#B8860B] leading-relaxed">
              • 开通后，对方每月可使用您的零钱进行消费，最高额度为 ¥{monthlyLimit}
            </p>
            <p className="text-xs text-[#B8860B] leading-relaxed mt-2">
              • 每月1日自动重置额度，消费记录可在零钱交易记录中查看
            </p>
            <p className="text-xs text-[#B8860B] leading-relaxed mt-2">
              • 您可以随时修改额度或关闭亲密付
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateIntimatePay
