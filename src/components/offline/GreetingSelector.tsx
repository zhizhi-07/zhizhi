/**
 * 开场白选择组件
 * 带左右滑动切换功能（Swipe）
 */

import { useState } from 'react'
import HtmlRenderer from './HtmlRenderer'

interface GreetingSelectorProps {
  greetings: string[]
  characterName: string
  onSelect: (greeting: string, index: number) => void
  onCancel: () => void
}

const GreetingSelector = ({ greetings, characterName, onSelect, onCancel }: GreetingSelectorProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // 如果没有开场白，使用默认的
  const allGreetings = greetings.length > 0 ? greetings : ['你好！很高兴认识你。']

  // 切换到上一个
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // 切换到下一个
  const handleNext = () => {
    if (currentIndex < allGreetings.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  // 选择当前开场白
  const handleSelect = () => {
    onSelect(allGreetings[currentIndex], currentIndex)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">选择开场白</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button>
        </div>

        {/* 角色名称 */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="text-sm text-gray-600 text-center">
            {characterName}
          </div>
        </div>

        {/* 开场白内容 */}
        <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          <div className="w-full">
            <HtmlRenderer 
              content={allGreetings[currentIndex]}
              className="text-sm text-gray-800"
            />
          </div>
        </div>

        {/* 切换控制 */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          {/* 左箭头 */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
            style={{
              backgroundColor: currentIndex === 0 ? '#e5e7eb' : '#3b82f6',
              color: currentIndex === 0 ? '#9ca3af' : '#ffffff'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* 计数器 */}
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {allGreetings.length}
          </div>

          {/* 右箭头 */}
          <button
            onClick={handleNext}
            disabled={currentIndex === allGreetings.length - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
            style={{
              backgroundColor: currentIndex === allGreetings.length - 1 ? '#e5e7eb' : '#3b82f6',
              color: currentIndex === allGreetings.length - 1 ? '#9ca3af' : '#ffffff'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* 确认按钮 */}
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={handleSelect}
            className="w-full py-3 rounded-xl text-white font-medium transition-colors"
            style={{ backgroundColor: '#3b82f6' }}
          >
            开始聊天
          </button>
        </div>
      </div>
    </div>
  )
}

export default GreetingSelector
