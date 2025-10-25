import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { BackIcon } from '../components/Icons'
import { migrateAllChatsToIndexedDB, cleanupLocalStorageChats, getChatStatistics } from '../utils/chatStorage'
import { getIndexedDBUsage } from '../utils/indexedDBStorage'

const StorageMigration = () => {
  const navigate = useNavigate()
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [storageInfo, setStorageInfo] = useState<any>(null)

  const handleCheckStorage = async () => {
    const usage = await getIndexedDBUsage()
    const stats = await getChatStatistics()
    setStorageInfo({ usage, stats })
  }

  const handleMigrate = async () => {
    if (isMigrating) return
    
    if (!window.confirm('确定要迁移聊天记录到IndexedDB吗？这将释放localStorage空间。')) {
      return
    }

    setIsMigrating(true)
    try {
      const result = await migrateAllChatsToIndexedDB()
      setMigrationResult(result)
      
      // 迁移完成后更新存储信息
      handleCheckStorage()
    } catch (error) {
      console.error('迁移失败:', error)
      alert('迁移失败: ' + error)
    } finally {
      setIsMigrating(false)
    }
  }

  const handleCleanupLocalStorage = () => {
    if (!window.confirm('确定要清理localStorage中的聊天记录吗？请确保已经迁移成功！')) {
      return
    }

    const result = cleanupLocalStorageChats()
    alert(`清理完成：删除${result.cleaned}个文件，释放${(result.freedSpace / 1024 / 1024).toFixed(2)}MB`)
    handleCheckStorage()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-3">
          <BackIcon />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">存储升级</h1>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 说明卡片 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h2 className="text-base font-semibold text-blue-900 mb-2">🚀 突破存储限制</h2>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>localStorage</strong>: 5-10MB（旧方案，有限制）</p>
            <p>• <strong>IndexedDB</strong>: 50MB-500MB（新方案，无限制）✨</p>
            <p className="mt-2 text-xs">迁移到IndexedDB后，你可以保存所有聊天记录，不用担心空间不足！</p>
          </div>
        </div>

        {/* 存储状态 */}
        {storageInfo && (
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3">📊 存储状态</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">IndexedDB使用</span>
                  <span className="font-semibold text-blue-600">
                    {storageInfo.usage.used}MB / {storageInfo.usage.quota}MB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${storageInfo.usage.percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm text-gray-600">聊天统计</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>聊天数量</span>
                    <span className="font-semibold">{storageInfo.stats.totalChats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>消息总数</span>
                    <span className="font-semibold">{storageInfo.stats.totalMessages}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 检查存储按钮 */}
        <button
          onClick={handleCheckStorage}
          className="w-full py-3 rounded-lg font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:bg-blue-200 mb-4"
        >
          检查存储状态
        </button>

        {/* 迁移结果 */}
        {migrationResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2">✅ 迁移完成</h3>
            <div className="text-xs text-green-800 space-y-1">
              <div>成功迁移: {migrationResult.success} 个聊天</div>
              <div>总消息数: {migrationResult.totalMessages} 条</div>
              {migrationResult.failed > 0 && (
                <div className="text-red-600">失败: {migrationResult.failed} 个</div>
              )}
            </div>
          </div>
        )}

        {/* 操作说明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-2">📝 操作步骤</h3>
          <ol className="text-xs text-yellow-800 space-y-2 list-decimal list-inside">
            <li><strong>点击"开始迁移"</strong> - 将localStorage的聊天记录迁移到IndexedDB</li>
            <li><strong>检查存储状态</strong> - 确认迁移成功</li>
            <li><strong>（可选）清理localStorage</strong> - 释放旧空间（建议等几天确认无误后再清理）</li>
          </ol>
        </div>

        {/* 主按钮 */}
        <button
          onClick={handleMigrate}
          disabled={isMigrating}
          className={`w-full py-3 rounded-lg font-semibold text-white mb-3 ${
            isMigrating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 active:from-blue-700 active:to-purple-700'
          }`}
        >
          {isMigrating ? '迁移中...' : '🚀 开始迁移到IndexedDB'}
        </button>

        {/* 清理按钮 */}
        <button
          onClick={handleCleanupLocalStorage}
          className="w-full py-3 rounded-lg font-semibold text-gray-600 bg-gray-100 border border-gray-300 hover:bg-gray-200 active:bg-gray-300"
        >
          🧹 清理localStorage（可选）
        </button>

        {/* 警告提示 */}
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-800">
            ⚠️ <strong>注意</strong>: 清理localStorage前请确保迁移成功且数据正常！清理后的数据无法恢复。
          </p>
        </div>

        {/* 优势说明 */}
        <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">✨ IndexedDB优势</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✅ 存储容量大：50MB-500MB（localStorage只有5-10MB）</li>
            <li>✅ 保留所有回忆：不用担心消息太多</li>
            <li>✅ 性能更好：异步操作不阻塞界面</li>
            <li>✅ 自动迁移：系统会自动使用IndexedDB</li>
            <li>✅ 向下兼容：出错会自动降级到localStorage</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default StorageMigration
