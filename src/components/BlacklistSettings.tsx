import { useState, useEffect } from 'react'
import { blacklistManager } from '../utils/blacklistManager'

interface BlacklistSettingsProps {
  characterId: string
  characterName: string
  onClose: () => void
}

const BlacklistSettings = ({ characterId, characterName, onClose }: BlacklistSettingsProps) => {
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    // 加载拉黑状态
    const status = blacklistManager.getBlockStatus('user', characterId)
    setIsBlocked(status.blockedByMe)
    console.log('🔍 加载拉黑状态，characterId:', characterId, '状态:', status)
  }, [characterId])

  const handleToggleBlacklist = () => {
    const newStatus = blacklistManager.toggleBlock('user', characterId)
    setIsBlocked(newStatus)
    
    if (newStatus) {
      console.log('✅ 已拉黑，characterId:', characterId)
      alert(`已将 ${characterName} 加入黑名单\n\nTA发送的消息将显示警告图标⚠️`)
    } else {
      console.log('✅ 已取消拉黑')
      alert(`已将 ${characterName} 移出黑名单`)
    }
    
    // 延迟关闭，让用户看到提示
    setTimeout(() => {
      onClose()
    }, 500)
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      >
        {/* 弹窗内容 */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-[85%] max-w-sm overflow-hidden shadow-2xl animate-scale-in"
        >
          {/* 标题 */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">聊天设置</h3>
            <p className="text-sm text-gray-500 mt-1">{characterName}</p>
          </div>

          {/* 内容 */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* 拉黑状态显示 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{isBlocked ? '🚫' : '✅'}</span>
                  <div>
                    <div className="font-medium text-gray-800">
                      {isBlocked ? '已拉黑' : '未拉黑'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {isBlocked ? 'TA的消息会显示警告图标' : '正常聊天状态'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 拉黑说明 */}
              {!isBlocked && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div className="flex-1 text-xs text-yellow-700">
                      <p className="font-medium mb-1">拉黑后：</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>TA的消息会显示警告图标</li>
                        <li>AI会意识到被拉黑</li>
                        <li>可以随时取消拉黑</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 按钮 */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleToggleBlacklist}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                isBlocked
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isBlocked ? '取消拉黑' : '拉黑此人'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default BlacklistSettings
