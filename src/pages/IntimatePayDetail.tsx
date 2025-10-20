import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import { 
  getIntimatePayRelation, 
  updateIntimatePayLimit, 
  deleteIntimatePayRelation,
  IntimatePayRelation 
} from '../utils/walletUtils'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const IntimatePayDetail = () => {
  const navigate = useNavigate()
  const { characterId } = useParams<{ characterId: string }>()
  const { showStatusBar } = useSettings()
  const [relation, setRelation] = useState<IntimatePayRelation | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newLimit, setNewLimit] = useState('')

  // 加载亲密付关系
  useEffect(() => {
    if (characterId) {
      const rel = getIntimatePayRelation(characterId)
      setRelation(rel)
      if (rel) {
        setNewLimit(rel.monthlyLimit.toString())
      }
    }
  }, [characterId])

  if (!relation) {
    return (
      <div className="h-screen flex flex-col bg-[#EDEDED]">
        {showStatusBar && <StatusBar />}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-sm">未找到亲密付关系</div>
        </div>
      </div>
    )
  }

  // 计算剩余额度
  const remaining = relation.monthlyLimit - relation.usedAmount
  const percentage = (relation.usedAmount / relation.monthlyLimit) * 100

  // 修改额度
  const handleUpdateLimit = () => {
    // 只允许修改用户给AI开通的亲密付
    if (relation?.type !== 'user_to_character') {
      alert('无法修改对方为你开通的亲密付额度')
      setShowEditModal(false)
      return
    }
    
    const limit = parseFloat(newLimit)
    if (isNaN(limit) || limit <= 0) {
      alert('请输入有效的额度')
      return
    }

    if (characterId && updateIntimatePayLimit(characterId, limit)) {
      const updated = getIntimatePayRelation(characterId)
      setRelation(updated)
      setShowEditModal(false)
      alert('额度修改成功')
    } else {
      alert('修改失败')
    }
  }

  // 关闭亲密付
  const handleDelete = () => {
    if (confirm(`确定要关闭与 ${relation.characterName} 的亲密付吗？`)) {
      if (characterId && deleteIntimatePayRelation(characterId)) {
        alert('已关闭亲密付')
        navigate('/card-wallet')
      } else {
        alert('关闭失败')
      }
    }
  }

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
      {/* iOS状态栏 */}
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white flex items-center border-b border-gray-200">
        <button 
          onClick={() => navigate('/card-wallet')}
          className="px-4 py-4 active:opacity-50 cursor-pointer flex items-center justify-center"
        >
          <BackIcon size={24} className="text-gray-900" />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-medium text-gray-900 pr-14">
          {relation.type === 'user_to_character' ? '为对方开通的亲密付' : '对方为你开通的亲密付'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 用户信息卡片 */}
        <div className="bg-white mt-3 px-5 py-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {relation.characterAvatar ? (
                relation.characterAvatar.startsWith('data:image') ? (
                  <img src={relation.characterAvatar} alt={relation.characterName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{relation.characterAvatar}</span>
                )
              ) : (
                <span className="text-gray-500 text-2xl">{relation.characterName[0]}</span>
              )}
            </div>
            <div className="ml-4">
              <div className="text-[18px] font-semibold text-gray-900">{relation.characterName}</div>
              <div className="text-sm text-gray-500 mt-1">开通于 {formatDate(relation.createdAt)}</div>
            </div>
          </div>

          {/* 额度信息 */}
          <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl p-5">
            <div className="text-sm text-gray-600 mb-2">
              {relation.type === 'user_to_character' ? '对方本月剩余额度' : '你本月剩余额度'}
            </div>
            <div className="text-[36px] font-light text-gray-900 mb-4">
              ¥{remaining.toFixed(2)}
            </div>
            
            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>已用 ¥{relation.usedAmount.toFixed(2)}</span>
                <span>总额度 ¥{relation.monthlyLimit.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-red-400 rounded-full transition-all"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white mt-3 px-4">
          {/* 只有用户给AI开通的亲密付才能修改额度 */}
          {relation.type === 'user_to_character' && (
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full flex items-center justify-between py-4 border-b border-gray-100 active:bg-gray-50"
            >
              <span className="text-[16px] text-gray-900">修改月额度</span>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">当前 ¥{relation.monthlyLimit.toFixed(2)}/月</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="w-full py-4 text-[16px] text-red-500 active:bg-gray-50"
          >
            关闭亲密付
          </button>
        </div>

        {/* 说明 */}
        <div className="px-4 mt-6 pb-6">
          <div className="bg-[#FFF9E6] p-4 rounded-xl">
            <p className="text-xs text-[#B8860B] leading-relaxed">
              • 每月1日自动重置额度
            </p>
            {relation.type === 'user_to_character' ? (
              <>
                <p className="text-xs text-[#B8860B] leading-relaxed mt-2">
                  • 对方的消费记录可在零钱交易记录中查看
                </p>
                <p className="text-xs text-[#B8860B] leading-relaxed mt-2">
                  • 你可以随时修改额度或关闭亲密付
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-[#B8860B] leading-relaxed mt-2">
                  • 你的消费记录对方可以查看
                </p>
                <p className="text-xs text-[#B8860B] leading-relaxed mt-2">
                  • 对方可以随时修改额度或关闭亲密付
                </p>
                <p className="text-xs text-[#B8860B] leading-relaxed mt-2 font-semibold">
                  • 你无法修改对方为你开通的亲密付额度
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 修改额度弹窗 - 只有用户给AI开通的才显示 */}
      {showEditModal && relation.type === 'user_to_character' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl w-[85%] max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">修改月额度</h2>
            
            {/* 输入金额 */}
            <div className="mb-6">
              <div className="flex items-center border-2 border-[#07C160] rounded-lg px-4 py-3">
                <span className="text-2xl text-gray-900 mr-2">¥</span>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 text-2xl outline-none"
                  autoFocus
                />
                <span className="text-sm text-gray-500 ml-2">/月</span>
              </div>
            </div>

            {/* 快捷金额 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[500, 1000, 2000, 3000, 5000, 10000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setNewLimit(amount.toString())}
                  className="py-2 border border-gray-300 rounded-lg text-gray-700 active:bg-gray-100"
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 active:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleUpdateLimit}
                className="flex-1 py-3 bg-[#07C160] text-white rounded-lg active:opacity-80"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntimatePayDetail
