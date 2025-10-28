/**
 * 预设选择器组件
 * 用于切换聊天预设（指令+采样参数）
 */

import type { STPreset } from '../../pages/PresetManager'

interface PresetSelectorProps {
  presets: STPreset[]
  currentPreset: STPreset | null
  onSelect: (preset: STPreset) => void
  onCancel: () => void
  onManagePresets: () => void
}

const PresetSelector = ({
  presets,
  currentPreset,
  onSelect,
  onCancel,
  onManagePresets
}: PresetSelectorProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[70vh] overflow-hidden shadow-xl">
        {/* 标题栏 */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">选择预设</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button>
        </div>

        {/* 预设列表 */}
        <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
          {presets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">📝</div>
              <p className="text-sm text-gray-500">暂无预设</p>
              <p className="text-xs text-gray-400 mt-1">请先创建预设</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {presets.map((preset) => {
                const isActive = currentPreset?.id === preset.id

                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelect(preset)}
                    className={`w-full p-3 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {/* 预设名称 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {preset.name}
                        {isActive && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            当前
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 预设描述 */}
                    {preset.description && (
                      <div className="text-xs text-gray-500 mb-2">
                        {preset.description}
                      </div>
                    )}

                    {/* 预设参数 */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        Temp: {preset.temperature}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        Top-P: {preset.top_p}
                      </span>
                      {preset.top_k && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          Top-K: {preset.top_k}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        Max: {preset.openai_max_tokens}
                      </span>
                      {preset.prompts && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                          {preset.prompts.length} 条指令
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onManagePresets}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            管理预设
          </button>
        </div>
      </div>
    </div>
  )
}

export default PresetSelector
