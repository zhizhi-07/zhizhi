import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import PromptTemplateEditor from '../components/PromptTemplateEditor'
import { getTemplateList } from '../utils/promptTemplate'

const PromptTemplates = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const templates = getTemplateList()

  // 获取角色的模板设置
  const getCharacterTemplate = (characterId: string) => {
    const templateId = localStorage.getItem(`prompt_template_id_${characterId}`)
    const customTemplate = localStorage.getItem(`prompt_custom_template_${characterId}`)
    return {
      templateId: templateId || 'default',
      hasCustom: !!customTemplate
    }
  }

  // 保存模板
  const handleSaveTemplate = (templateId: string, customTemplate?: string) => {
    if (selectedCharacterId) {
      localStorage.setItem(`prompt_template_id_${selectedCharacterId}`, templateId)
      if (customTemplate) {
        localStorage.setItem(`prompt_custom_template_${selectedCharacterId}`, customTemplate)
      } else {
        localStorage.removeItem(`prompt_custom_template_${selectedCharacterId}`)
      }
      setShowEditor(false)
      alert('✅ 提示词模板已保存！')
    }
  }

  // 打开编辑器
  const handleEditTemplate = (characterId: string) => {
    setSelectedCharacterId(characterId)
    setShowEditor(true)
  }

  const selectedCharacter = selectedCharacterId 
    ? characters.find(c => c.id === selectedCharacterId)
    : null

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700"
          >
            <BackIcon size={24} />
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            提示词模板
          </h1>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-3">
        {/* 说明 */}
        <div className="glass-card rounded-2xl p-4 mb-3">
          <div className="text-sm font-medium text-gray-900 mb-2">📝 关于提示词模板</div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• 为每个角色设置不同的提示词格式</p>
            <p>• 让导入的 Character Card 数据发挥作用</p>
            <p>• 支持自定义模板和变量替换</p>
          </div>
        </div>

        {/* 角色列表 */}
        <div className="mb-3">
          <div className="px-1 py-2">
            <span className="text-xs text-gray-500 font-medium">角色模板设置</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {characters.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                暂无角色
              </div>
            ) : (
              characters.map((character, index) => {
                const template = getCharacterTemplate(character.id)
                const templateName = templates.find(t => t.id === template.templateId)?.name || '默认模板'
                
                return (
                  <div
                    key={character.id}
                    className={`flex items-center gap-3 px-4 py-4 ios-button cursor-pointer ${
                      index < characters.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    onClick={() => handleEditTemplate(character.id)}
                  >
                    {/* 头像 */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {character.avatar.startsWith('data:') || character.avatar.startsWith('http') ? (
                        <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{character.avatar}</span>
                      )}
                    </div>
                    
                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{character.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{templateName}</span>
                        {template.hasCustom && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-xs">自定义</span>
                        )}
                      </div>
                    </div>
                    
                    {/* 箭头 */}
                    <span className="text-gray-400 text-xl">›</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 预设模板说明 */}
        <div className="mb-3">
          <div className="px-1 py-2">
            <span className="text-xs text-gray-500 font-medium">可用模板</span>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {templates.map((template, index) => (
              <div
                key={template.id}
                className={`px-4 py-3 ${
                  index < templates.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-900">{template.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 编辑器模态框 */}
      {showEditor && selectedCharacter && (
        <PromptTemplateEditor
          character={selectedCharacter}
          userName={localStorage.getItem('user_name') || '用户'}
          currentTemplateId={getCharacterTemplate(selectedCharacter.id).templateId}
          customTemplate={localStorage.getItem(`prompt_custom_template_${selectedCharacter.id}`) || undefined}
          onSave={handleSaveTemplate}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}

export default PromptTemplates
