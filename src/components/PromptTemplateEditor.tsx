import { useState } from 'react'
import { getTemplateList, getPresetTemplate, replaceTemplateVariables, buildTemplateVariables, PRESET_TEMPLATES } from '../utils/promptTemplate'
import { Character } from '../context/CharacterContext'

interface Props {
  character: Character
  userName: string
  currentTemplateId?: string
  customTemplate?: string
  onSave: (templateId: string, customTemplate?: string) => void
  onClose: () => void
}

const PromptTemplateEditor = ({ character, userName, currentTemplateId, customTemplate, onSave, onClose }: Props) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentTemplateId || 'default')
  const [isCustom, setIsCustom] = useState(!!customTemplate)
  const [editingTemplate, setEditingTemplate] = useState(customTemplate || getPresetTemplate(currentTemplateId || 'default'))
  const [showPreview, setShowPreview] = useState(false)

  const templates = getTemplateList()

  // 处理模板选择
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (!isCustom) {
      setEditingTemplate(getPresetTemplate(templateId))
    }
  }

  // 切换到自定义模式
  const handleCustomToggle = () => {
    setIsCustom(!isCustom)
    if (!isCustom) {
      // 切换到自定义，使用当前预设作为起点
      setEditingTemplate(getPresetTemplate(selectedTemplateId))
    }
  }

  // 生成预览
  const generatePreview = () => {
    const variables = buildTemplateVariables(character, userName, {
      history: '{{user}}: 你好！\n{{char}}: 嗨~\n{{user}}: 今天天气不错',
      message: '要不要一起出去玩？'
    })
    
    return replaceTemplateVariables(editingTemplate, variables)
  }

  // 保存
  const handleSave = () => {
    if (isCustom) {
      onSave(selectedTemplateId, editingTemplate)
    } else {
      onSave(selectedTemplateId, undefined)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-t-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-slideUp">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-600 ios-button">
            取消
          </button>
          <h3 className="font-semibold text-lg">提示词模板</h3>
          <button onClick={handleSave} className="text-primary font-medium ios-button">
            保存
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
          {/* 自定义开关 */}
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">自定义模板</div>
              <div className="text-xs text-gray-500 mt-1">开启后可以编辑模板内容</div>
            </div>
            <button
              onClick={handleCustomToggle}
              className={`w-12 h-7 rounded-full transition-colors ${
                isCustom ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                  isCustom ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 预设模板选择 */}
          {!isCustom && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2 px-1">选择预设模板</div>
              <div className="space-y-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`w-full glass-card rounded-xl p-4 text-left ios-button transition-all ${
                      selectedTemplateId === template.id
                        ? 'ring-2 ring-primary bg-primary bg-opacity-5'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                      </div>
                      {selectedTemplateId === template.id && (
                        <div className="text-primary text-lg ml-2">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 模板编辑器 */}
          {isCustom && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2 px-1">编辑模板</div>
              <div className="glass-card rounded-2xl p-4">
                <textarea
                  value={editingTemplate}
                  onChange={(e) => setEditingTemplate(e.target.value)}
                  className="w-full h-96 bg-transparent border-none outline-none text-sm text-gray-900 font-mono resize-none"
                  placeholder="输入你的模板..."
                />
              </div>
              
              {/* 变量说明 */}
              <div className="glass-card rounded-2xl p-4 mt-3">
                <div className="text-sm font-medium text-gray-700 mb-2">可用变量</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{char}}'}</code> - 角色名</div>
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{user}}'}</code> - 用户名</div>
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{description}}'}</code> - 角色描述</div>
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{personality}}'}</code> - 性格</div>
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{scenario}}'}</code> - 场景</div>
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{exampleMessages}}'}</code> - 示例对话</div>
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{history}}'}</code> - 历史记录</div>
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{message}}'}</code> - 当前消息</div>
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{date}}'}</code> - 当前日期</div>
                  <div><code className="bg-gray-100 px-2 py-0.5 rounded">{'{{time}}'}</code> - 当前时间</div>
                </div>
              </div>
            </div>
          )}

          {/* 预览按钮 */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full glass-card rounded-xl p-3 ios-button text-gray-700 font-medium"
          >
            {showPreview ? '隐藏预览' : '查看预览'}
          </button>

          {/* 预览区域 */}
          {showPreview && (
            <div className="glass-card rounded-2xl p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">预览效果</div>
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-800 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                {generatePreview()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromptTemplateEditor
