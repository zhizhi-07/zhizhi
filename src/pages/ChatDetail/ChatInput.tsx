/**
 * 聊天输入框组件
 */

import { useState } from 'react'
import { SendIcon, AddCircleIcon, EmojiIcon } from '../../components/Icons'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onAddClick: () => void
  onEmojiClick: () => void
  disabled?: boolean
  placeholder?: string
}

const ChatInput = ({
  value,
  onChange,
  onSend,
  onAddClick,
  onEmojiClick,
  disabled = false,
  placeholder = '发送消息...'
}: ChatInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }
  
  return (
    <div className="bg-[#F7F7F7] border-t border-gray-200 px-2 py-2 flex items-end gap-2">
      {/* 加号按钮 */}
      <button
        onClick={onAddClick}
        disabled={disabled}
        className="p-2 active:opacity-50 disabled:opacity-30 flex-shrink-0"
        aria-label="添加附件"
      >
        <AddCircleIcon size={28} className="text-gray-600" />
      </button>
      
      {/* 输入框 */}
      <div className="flex-1 bg-white rounded-lg px-3 py-2 min-h-[40px] max-h-[120px] overflow-y-auto">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full resize-none border-none outline-none bg-transparent text-base leading-6"
          style={{ minHeight: '24px', maxHeight: '96px' }}
          rows={1}
        />
      </div>
      
      {/* 表情按钮 */}
      <button
        onClick={onEmojiClick}
        disabled={disabled}
        className="p-2 active:opacity-50 disabled:opacity-30 flex-shrink-0"
        aria-label="选择表情"
      >
        <EmojiIcon size={28} className="text-gray-600" />
      </button>
      
      {/* 发送按钮 */}
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className={`px-4 py-2 rounded-lg flex-shrink-0 transition-all ${
          value.trim() && !disabled
            ? 'bg-[#07C160] text-white active:opacity-80'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        aria-label="发送"
      >
        <SendIcon size={20} />
      </button>
    </div>
  )
}

export default ChatInput
