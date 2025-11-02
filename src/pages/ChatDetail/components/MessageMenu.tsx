/**
 * 消息长按菜单组件
 */

import { Message } from '../types'
import { canRecallMessage } from '../utils/messageHelpers'

interface MessageMenuProps {
  isOpen: boolean
  message: Message | null
  onClose: () => void
  onCopy: () => void
  onDelete: () => void
  onRecall: () => void
  onQuote: () => void
  onEdit: () => void
  onBatchDelete: () => void
}

const MessageMenu = ({
  isOpen,
  message,
  onClose,
  onCopy,
  onDelete,
  onRecall,
  onQuote,
  onEdit,
  onBatchDelete
}: MessageMenuProps) => {
  if (!isOpen || !message) return null

  const isSentMessage = message.type === 'sent'
  const isTextMessage = !message.messageType || message.messageType === 'text'
  const canRecall = canRecallMessage(message)
  const isRecalled = message.isRecalled

  // 菜单项配置
  const menuItems = []

  // 复制（文本消息且未撤回）
  if (isTextMessage && !isRecalled) {
    menuItems.push({
      label: '复制',
      onClick: onCopy,
      icon: '📋'
    })
  }

  // 引用（未撤回）
  if (!isRecalled) {
    menuItems.push({
      label: '引用',
      onClick: onQuote,
      icon: '💬'
    })
  }

  // 编辑（自己发送的文本消息且未撤回）
  if (isSentMessage && isTextMessage && !isRecalled) {
    menuItems.push({
      label: '编辑',
      onClick: onEdit,
      icon: '✏️'
    })
  }

  // 撤回（自己发送的消息，2分钟内，未撤回）
  if (isSentMessage && canRecall && !isRecalled) {
    menuItems.push({
      label: '撤回',
      onClick: onRecall,
      icon: '↩️',
      danger: true
    })
  }

  // 删除
  menuItems.push({
    label: '删除',
    onClick: onDelete,
    icon: '🗑️',
    danger: true
  })

  // 批量删除
  menuItems.push({
    label: '批量删除',
    onClick: onBatchDelete,
    icon: '📦'
  })

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        style={{
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          transition: 'all 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* 菜单面板 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 animate-slide-up shadow-2xl">
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 消息预览 */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm text-gray-500 mb-1">
            {isSentMessage ? '你' : '对方'}
          </div>
          <div className="text-sm text-gray-800 line-clamp-2">
            {isRecalled ? '(已撤回)' : message.content}
          </div>
        </div>

        {/* 菜单项列表 */}
        <div className="py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                item.danger ? 'text-red-500' : 'text-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-base">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 取消按钮 */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            取消
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default MessageMenu

