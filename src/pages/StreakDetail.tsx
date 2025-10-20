import { useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import { useCharacter } from '../context/CharacterContext'
import { getStreakData, getCurrentLevel, getNextMilestone, getChatRate, MILESTONES } from '../utils/streakSystem'

const StreakDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getCharacter } = useCharacter()
  const character = id ? getCharacter(id) : undefined
  
  const streakData = id ? getStreakData(id) : null
  const currentLevel = streakData ? getCurrentLevel(streakData.currentStreak) : null
  const nextMilestone = streakData ? getNextMilestone(streakData.currentStreak) : null
  const chatRate = id ? getChatRate(id) : 0
  
  if (!streakData || !character) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* 顶部导航 */}
      <div className="glass-effect sticky top-0 z-10 shadow-sm bg-white/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <BackIcon className="w-6 h-6 text-gray-700" />
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900">
            🔥 连续聊天
          </h1>
          
          <div className="w-10"></div>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* 火花主卡片 */}
        <div className="glass-card rounded-3xl p-8 mb-6 shadow-xl border border-white/50 text-center">
          <div className="text-6xl mb-4">🔥</div>
          <div className="text-5xl font-bold text-orange-600 mb-2">
            {streakData.currentStreak}
          </div>
          <div className="text-gray-600 mb-4">连续聊天天数</div>
          
          {currentLevel && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
              <span className="text-2xl">{currentLevel.emoji}</span>
              <span className="font-medium text-gray-900">{currentLevel.name}</span>
            </div>
          )}
        </div>
        
        {/* 下一个里程碑 */}
        {nextMilestone && (
          <div className="glass-card rounded-2xl p-6 mb-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">🎯 下一个里程碑</h2>
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">{nextMilestone.emoji}</div>
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {nextMilestone.name}
                </div>
                <div className="text-sm text-gray-600">
                  还需要 {nextMilestone.days - streakData.currentStreak} 天
                </div>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(streakData.currentStreak / nextMilestone.days) * 100}%` 
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-right">
              {streakData.currentStreak} / {nextMilestone.days} 天
            </div>
          </div>
        )}
        
        {/* 统计数据 */}
        <div className="glass-card rounded-2xl p-6 mb-6 shadow-lg border border-white/50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 聊天统计</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {streakData.longestStreak}
              </div>
              <div className="text-sm text-gray-600">最长记录</div>
            </div>
            
            <div className="bg-white/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {streakData.totalDays}
              </div>
              <div className="text-sm text-gray-600">总聊天天数</div>
            </div>
            
            <div className="bg-white/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {chatRate}%
              </div>
              <div className="text-sm text-gray-600">聊天率</div>
            </div>
            
            <div className="bg-white/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {streakData.breakCount}
              </div>
              <div className="text-sm text-gray-600">断火次数</div>
            </div>
          </div>
        </div>
        
        {/* 已解锁成就 */}
        <div className="glass-card rounded-2xl p-6 shadow-lg border border-white/50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 成就</h2>
          
          <div className="space-y-3">
            {MILESTONES.map((milestone) => {
              const isUnlocked = streakData.milestones.includes(milestone.days)
              const isCurrent = streakData.currentStreak >= milestone.days
              
              return (
                <div 
                  key={milestone.days}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isUnlocked 
                      ? 'bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300' 
                      : 'bg-gray-100 opacity-50'
                  }`}
                >
                  <div className={`text-3xl ${!isUnlocked && 'grayscale'}`}>
                    {milestone.emoji}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {milestone.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      连续聊天 {milestone.days} 天
                    </div>
                  </div>
                  {isUnlocked && (
                    <div className="text-green-600 font-bold">✓</div>
                  )}
                  {!isUnlocked && isCurrent && (
                    <div className="text-orange-600 text-sm">进行中</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* 续火卡提示 */}
        {!streakData.hasUsedRevive && (
          <div className="mt-6 glass-card rounded-2xl p-4 shadow-lg border border-white/50 bg-blue-50/50">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💳</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">续火卡</div>
                <div className="text-sm text-gray-600">
                  本月还有 1 次续火机会，断火后可以恢复连续记录
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StreakDetail
