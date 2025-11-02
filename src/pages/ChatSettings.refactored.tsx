/**
 * 聊天设置页面 - 重构版
 * 使用模块化的 hooks 和组件
 */

import { useNavigate, useParams } from 'react-router-dom'
import { useRef } from 'react'
import { BackIcon } from '../components/Icons'
import { useCharacter } from '../context/ContactsContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import memoryIcon from '../assets/memory-icon.webp'
import memorySummaryIcon from '../assets/memory-summary-icon.webp'
import diaryIcon from '../assets/diary-icon.webp'

// 导入重构的 hooks 和组件
import { useChatSettingsState, useChatSettingsActions } from './ChatSettings/hooks'
import {
  SettingsSection,
  ToggleSwitch,
  ImageUploadSection,
  SliderSetting
} from './ChatSettings/components'

// 拉黑图标
const blockedIcon = '/拉黑.webp'
const notBlockedIcon = '/没有拉黑.webp'

const ChatSettings = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getCharacter } = useCharacter()
  const { showStatusBar } = useSettings()
  
  const character = id ? getCharacter(id) : undefined
  
  // 使用状态管理 hook
  const state = useChatSettingsState(id)
  
  // 使用操作 hook
  const actions = useChatSettingsActions({ chatId: id, ...state })
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">角色不存在</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/chat/${id}`, { replace: true })}
            className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
          >
            <BackIcon size={24} />
          </button>
          <h1 className="text-base font-semibold text-gray-900">聊天设置</h1>
          <div className="w-6"></div>
        </div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3 pb-20">
        {/* 角色信息 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">聊天对象</span>
          </div>
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
              {character.avatar?.startsWith('data:image') ? (
                <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{character.avatar || '🤖'}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{character.name}</h3>
              <p className="text-sm text-gray-500">{character.username}</p>
            </div>
            <button
              onClick={() => navigate(`/character/${character.id}`)}
              className="text-sm text-primary ios-button"
            >
              查看详情
            </button>
          </div>
        </div>

        {/* AI记忆查看 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">AI 记忆</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={() => navigate(`/memory/${id}`)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <img src={memoryIcon} alt="记忆" className="w-6 h-6" />
              <span className="flex-1 text-left text-gray-800">查看记忆</span>
              <span className="text-gray-400">›</span>
            </button>
            <div className="border-t border-gray-100"></div>
            <button
              onClick={() => navigate(`/memory-summary/${id}`)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <img src={memorySummaryIcon} alt="记忆总结" className="w-6 h-6" />
              <span className="flex-1 text-left text-gray-800">记忆总结</span>
              <span className="text-gray-400">›</span>
            </button>
            <div className="border-t border-gray-100"></div>
            <button
              onClick={() => navigate(`/diary/${id}`)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <img src={diaryIcon} alt="日记" className="w-6 h-6" />
              <span className="flex-1 text-left text-gray-800">AI 日记</span>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* AI功能设置 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">AI 功能</span>
          </div>
          <div className="glass-card rounded-2xl p-4 divide-y divide-gray-100">
            <ToggleSwitch
              label="旁白模式"
              checked={state.narratorEnabled}
              onChange={actions.handleToggleNarrator}
              description="AI 会以第三人称视角描述场景"
            />
            <ToggleSwitch
              label="AI 朋友圈"
              checked={state.aiMomentsEnabled}
              onChange={actions.handleToggleAiMoments}
              description="AI 会自动发布朋友圈动态"
            />
            <ToggleSwitch
              label="AI 主动消息"
              checked={state.aiProactiveEnabled}
              onChange={actions.handleToggleAiProactive}
              description="AI 会主动发送消息"
            />
            <SliderSetting
              label="AI 读取消息数量"
              value={state.aiMessageLimit}
              min={5}
              max={50}
              onChange={actions.handleUpdateMessageLimit}
              unit="条"
              description="AI 每次回复时读取的历史消息数量"
            />
            <SliderSetting
              label="记忆总结间隔"
              value={state.memorySummaryInterval}
              min={10}
              max={100}
              step={5}
              onChange={actions.handleUpdateMemorySummaryInterval}
              unit="条"
              description="每隔多少条消息进行一次记忆总结"
            />
          </div>
        </div>

        {/* 背景设置 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">聊天背景</span>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <ImageUploadSection
              title="聊天背景图"
              currentImage={state.backgroundPreview}
              onUpload={actions.handleBackgroundUpload}
              onRemove={actions.handleRemoveBackground}
              placeholder="上传背景"
            />
            {state.isUploading && (
              <div className="text-sm text-gray-500 mt-2">上传中...</div>
            )}
          </div>
        </div>

        {/* 红包转账封面设置 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">红包转账封面</span>
          </div>
          <div className="glass-card rounded-2xl p-4 space-y-4">
            <ImageUploadSection
              title="红包封面"
              currentImage={state.redEnvelopeCover}
              onUpload={actions.handleRedEnvelopeCoverUpload}
              onRemove={actions.handleRemoveRedEnvelopeCover}
            />
            <ImageUploadSection
              title="红包图标"
              currentImage={state.redEnvelopeIcon}
              onUpload={actions.handleRedEnvelopeIconUpload}
              onRemove={actions.handleRemoveRedEnvelopeIcon}
            />
            <ImageUploadSection
              title="转账封面"
              currentImage={state.transferCover}
              onUpload={actions.handleTransferCoverUpload}
              onRemove={actions.handleRemoveTransferCover}
            />
            <ImageUploadSection
              title="转账图标"
              currentImage={state.transferIcon}
              onUpload={actions.handleTransferIconUpload}
              onRemove={actions.handleRemoveTransferIcon}
            />
          </div>
        </div>

        {/* 拉黑设置 */}
        <div className="mb-3">
          <div className="px-4 py-2">
            <span className="text-sm text-gray-600 font-medium">隐私设置</span>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <button
              onClick={actions.handleToggleBlacklist}
              className="w-full flex items-center gap-3"
            >
              <img
                src={state.isBlocked ? blockedIcon : notBlockedIcon}
                alt={state.isBlocked ? '已拉黑' : '未拉黑'}
                className="w-6 h-6"
              />
              <span className="flex-1 text-left text-gray-800">
                {state.isBlocked ? '已拉黑' : '拉黑此人'}
              </span>
              <span className={state.isBlocked ? 'text-red-500' : 'text-gray-400'}>
                {state.isBlocked ? '点击取消' : ''}
              </span>
            </button>
          </div>
        </div>

        {/* 气泡设置 */}
        <div className="mb-3">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">气泡样式</span>
            <button
              onClick={() => state.setShowBubbleSettings(!state.showBubbleSettings)}
              className="text-sm text-primary ios-button"
            >
              {state.showBubbleSettings ? '收起' : '展开'}
            </button>
          </div>
          {state.showBubbleSettings && (
            <div className="glass-card rounded-2xl p-4 space-y-4">
              {/* 气泡设置内容 - 这里可以继续拆分成独立组件 */}
              <div className="text-sm text-gray-500">
                气泡样式设置功能（可继续拆分）
              </div>
              <div className="flex gap-2">
                <button
                  onClick={actions.handleSaveBubbleSettings}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  保存设置
                </button>
                <button
                  onClick={actions.handleResetBubbleSettings}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  重置
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatSettings

