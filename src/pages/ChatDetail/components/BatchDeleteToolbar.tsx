/**
 * 批量删除工具栏组件
 */

interface BatchDeleteToolbarProps {
  isActive: boolean
  selectedCount: number
  totalCount: number
  onCancel: () => void
  onSelectAll: () => void
  onDelete: () => void
}

const BatchDeleteToolbar = ({
  isActive,
  selectedCount,
  totalCount,
  onCancel,
  onSelectAll,
  onDelete
}: BatchDeleteToolbarProps) => {
  if (!isActive) return null

  const allSelected = selectedCount === totalCount && totalCount > 0

  return (
    <div className="sticky top-0 z-10 bg-[#EDEDED] border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* 左侧：取消按钮 */}
      <button
        onClick={onCancel}
        className="text-blue-500 hover:text-blue-600 font-medium"
      >
        取消
      </button>

      {/* 中间：选中数量 */}
      <div className="text-gray-700 font-medium">
        已选择 {selectedCount} 条消息
      </div>

      {/* 右侧：全选/删除按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSelectAll}
          className="text-blue-500 hover:text-blue-600 font-medium"
        >
          {allSelected ? '取消全选' : '全选'}
        </button>
        <button
          onClick={onDelete}
          disabled={selectedCount === 0}
          className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
            selectedCount > 0
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          删除
        </button>
      </div>
    </div>
  )
}

export default BatchDeleteToolbar

