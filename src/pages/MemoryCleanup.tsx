import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { BackIcon } from '../components/Icons'
import { performFullCleanup, getStorageUsage } from '../utils/memoryCleanup'

const MemoryCleanup = () => {
  const navigate = useNavigate()
  const [isCleanig, setIsCleanig] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<any>(null)
  const [storageInfo, setStorageInfo] = useState(() => getStorageUsage())

  const handleCleanup = async () => {
    if (isCleanig) return
    
    if (!window.confirm('确定要清理旧数据吗？这将删除超过1000条的旧消息和过期数据。')) {
      return
    }

    setIsCleanig(true)
    try {
      const result = performFullCleanup(1000)
      setCleanupResult(result)
      setStorageInfo(result.after)
    } catch (error) {
      console.error('清理失败:', error)
      alert('清理失败: ' + error)
    } finally {
      setIsCleanig(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-3">
          <BackIcon />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">内存清理</h1>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 存储使用情况 */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-3">存储使用情况</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">总大小</span>
              <span className="font-semibold text-blue-600">{formatSize(storageInfo.totalSize)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">项目数量</span>
              <span className="font-semibold">{storageInfo.itemCount}</span>
            </div>
          </div>
        </div>

        {/* 占用最多的项目 */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-3">占用最多空间的项目</h2>
          <div className="space-y-2">
            {storageInfo.topKeys.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate flex-1 mr-2">
                  {item.key.length > 30 ? item.key.substring(0, 30) + '...' : item.key}
                </span>
                <span className="font-semibold text-gray-900 whitespace-nowrap">
                  {formatSize(item.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 清理说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📝 清理说明</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>完全可选</strong> - 系统不会自动清理你的聊天记录</li>
            <li>• 每个聊天只保留最近1000条消息</li>
            <li>• 删除超过7天的过期红包数据</li>
            <li>• 不影响角色设置、用户数据、记忆系统</li>
            <li>• 只在感觉卡顿或空间不足时使用</li>
          </ul>
        </div>
        
        {/* 回忆提示 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-purple-900 mb-2">💝 保留回忆</h3>
          <p className="text-xs text-purple-800">
            聊天记录是珍贵的回忆。系统已移除自动限制，会保存你的所有对话。
            只有在你主动点击清理时，才会删除超过1000条的旧消息。
          </p>
        </div>

        {/* 清理结果 */}
        {cleanupResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2">✅ 清理完成</h3>
            <div className="text-xs text-green-800 space-y-1">
              <div>释放空间: {formatSize(cleanupResult.before.totalSize - cleanupResult.after.totalSize)}</div>
              <div>处理聊天: {cleanupResult.messageCleanup.deletedKeys} 个</div>
              <div>删除过期数据: {cleanupResult.expiredCleanup.deletedKeys} 个</div>
              {cleanupResult.messageCleanup.errors.length > 0 && (
                <div className="text-red-600 mt-2">
                  错误: {cleanupResult.messageCleanup.errors.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 清理按钮 */}
        <button
          onClick={handleCleanup}
          disabled={isCleanig}
          className={`w-full py-3 rounded-lg font-semibold text-white ${
            isCleanig
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
          }`}
        >
          {isCleanig ? '清理中...' : '开始清理'}
        </button>

        {/* 警告提示 */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-800">
            ⚠️ 清理后的数据无法恢复，请确认后再操作
          </p>
        </div>
      </div>
    </div>
  )
}

export default MemoryCleanup
