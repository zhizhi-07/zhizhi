import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import { getIntimatePayRelations, IntimatePayRelation } from '../utils/walletUtils'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

// SVG图标
const HeartIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PlusIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ChevronRight = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CardWallet = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [relations, setRelations] = useState<IntimatePayRelation[]>([])

  // 加载亲密付关系
  useEffect(() => {
    setRelations(getIntimatePayRelations())
  }, [])

  // 计算剩余额度
  const getRemainingAmount = (relation: IntimatePayRelation) => {
    return relation.monthlyLimit - relation.usedAmount
  }

  // 计算使用百分比
  const getUsagePercentage = (relation: IntimatePayRelation) => {
    return (relation.usedAmount / relation.monthlyLimit) * 100
  }

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
      {/* iOS状态栏 */}
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white flex items-center border-b border-gray-200">
        <button 
          onClick={() => navigate('/wechat/me')}
          className="px-4 py-4 active:opacity-50 cursor-pointer flex items-center justify-center"
        >
          <BackIcon size={24} className="text-gray-900" />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-medium text-gray-900 pr-14">卡包</h1>
      </div>

      {/* 亲密付标题区域 */}
      <div className="bg-white px-5 pt-6 pb-6 mt-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center mr-3">
              <HeartIcon size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-gray-900">亲密付</h2>
              <p className="text-xs text-gray-500 mt-0.5">为家人朋友代付</p>
            </div>
          </div>
        </div>
      </div>

      {/* 亲密付列表 */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {relations.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartIcon size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm mb-6">还没有开通亲密付</p>
            <button
              onClick={() => navigate('/intimate-pay/create')}
              className="bg-[#07C160] text-white px-8 py-3 rounded-lg text-[15px] font-medium active:opacity-80"
            >
              开通亲密付
            </button>
          </div>
        ) : (
          <>
            {relations.map((relation) => {
              const remaining = getRemainingAmount(relation)
              const percentage = getUsagePercentage(relation)
              
              return (
                <div 
                  key={relation.id}
                  onClick={() => navigate(`/intimate-pay/detail/${relation.characterId}`)}
                  className="bg-white rounded-2xl p-4 mb-3 active:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {relation.characterAvatar ? (
                        <img src={relation.characterAvatar} alt={relation.characterName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-lg">{relation.characterName[0]}</span>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-[16px] font-medium text-gray-900">{relation.characterName}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">
                          {relation.type === 'user_to_character' ? '你开通' : 'TA开通'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {relation.type === 'user_to_character' ? 'TA本月剩余' : '你本月剩余'} ¥{remaining.toFixed(2)}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                  
                  {/* 额度进度条 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>已用 ¥{relation.usedAmount.toFixed(2)}</span>
                      <span>总额度 ¥{relation.monthlyLimit.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-400 to-red-400 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* 添加新的亲密付按钮 */}
            <button
              onClick={() => navigate('/intimate-pay/create')}
              className="w-full bg-white rounded-2xl p-4 flex items-center justify-center active:bg-gray-50"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <PlusIcon size={20} className="text-gray-600" />
              </div>
              <span className="text-[16px] text-gray-900 font-medium">开通新的亲密付</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default CardWallet
