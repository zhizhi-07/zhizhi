/**
 * 聊天输入框组件
 */

import { SendIcon, AddCircleIcon, EmojiIcon } from '../../../components/Icons'
import { Message } from '../types'

interface ChatInputProps {
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onAIReply: () => void
  onAddClick: () => void
  onEmojiClick: () => void
  isAiTyping: boolean
  quotedMessage?: Message | null
  onCancelQuote?: () => void
  editingMessage?: Message | null
  onCancelEdit?: () => void
  disabled?: boolean
}

const ChatInput = ({
  inputValue,
  onInputChange,
  onSend,
  onAIReply,
  onAddClick,
  onEmojiClick,
  isAiTyping,
  quotedMessage,
  onCancelQuote,
  editingMessage,
  onCancelEdit,
  disabled = false
}: ChatInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (editingMessage) {
        // 如果是编辑模式，保存编辑
        onSend()
      } else {
        // 否则发送消息
        onSend()
      }
    }
  }

  return (
    <div className="sticky bottom-0 bg-[#F7F7F7] border-t border-gray-200">
      {/* 引用消息预览 */}
      {quotedMessage && (
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500">引用消息</div>
            <div className="text-sm truncate">{quotedMessage.content}</div>
          </div>
          <button
            onClick={onCancelQuote}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* 编辑消息提示 */}
      {editingMessage && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-600">正在编辑消息</div>
            <div className="text-sm truncate text-gray-700">{editingMessage.content}</div>
          </div>
          <button
            onClick={onCancelEdit}
            className="ml-2 text-blue-600 hover:text-blue-800"
          >
            取消
          </button>
        </div>
      )}

      {/* 输入框区域 */}
      <div className="px-4 py-3 flex items-end gap-2">
        {/* 语音按钮（暂时隐藏） */}
        {/* <button className="p-2 text-gray-600">
          <VoiceIcon className="w-6 h-6" />
        </button> */}

        {/* 输入框 */}
        <div className="flex-1 flex items-end gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2">
          <textarea
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={editingMessage ? "编辑消息..." : "输入消息..."}
            disabled={disabled || isAiTyping}
            className="flex-1 resize-none outline-none text-[15px] leading-6 max-h-24 overflow-y-auto"
            rows={1}
            style={{
              minHeight: '24px',
              height: 'auto'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 96) + 'px'
            }}
          />
          
          {/* 表情按钮 */}
          <button
            onClick={onEmojiClick}
            className="p-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
            disabled={disabled || isAiTyping}
          >
            <EmojiIcon className="w-6 h-6" />
          </button>
          
          {/* 添加按钮 */}
          <button
            onClick={onAddClick}
            className="p-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
            disabled={disabled || isAiTyping}
          >
            <AddCircleIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 发送/AI回复按钮 */}
        <button
          onClick={inputValue.trim() ? onSend : onAIReply}
          disabled={disabled || (isAiTyping && !inputValue.trim())}
          className={`p-3 rounded-lg flex-shrink-0 transition-colors ${
            inputValue.trim()
              ? 'bg-[#07C160] text-white hover:bg-[#06AD56]'
              : isAiTyping
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#07C160] text-white hover:bg-[#06AD56]'
          }`}
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>

      {/* AI 正在输入提示 */}
      {isAiTyping && (
        <div className="px-4 pb-2 text-xs text-gray-500 flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <span>AI正在输入...</span>
        </div>
      )}
    </div>
  )
}

export default ChatInput

