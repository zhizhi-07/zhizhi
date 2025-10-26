import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon } from '../components/Icons'

// ST预设中的单个提示词条目
export interface PromptEntry {
  name: string
  system_prompt?: boolean
  role: 'system' | 'user' | 'assistant'
  content: string
  identifier?: string
  injection_position?: number
  injection_depth?: number
  injection_order?: number
  forbid_overrides?: boolean
  marker?: boolean // 是否为占位符（系统内置）
  enabled?: boolean // 是否启用
}

// 完整的ST预设
export interface STPreset {
  id: string
  name: string
  description?: string
  
  // 采样参数
  temperature: number
  frequency_penalty?: number
  presence_penalty?: number
  top_p: number
  top_k?: number
  top_a?: number
  min_p?: number
  repetition_penalty?: number
  openai_max_context?: number
  openai_max_tokens: number
  
  // 提示词数组
  prompts: PromptEntry[]
  
  // 格式化
  wi_format?: string
  scenario_format?: string
  personality_format?: string
  
  // 其他设置
  wrap_in_quotes?: boolean
  names_behavior?: number
  stream_openai?: boolean
  
  createdAt: string
}

const PresetManager = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [presets, setPresets] = useState<STPreset[]>([])
  const [viewingPreset, setViewingPreset] = useState<STPreset | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<{ presetId: string, promptIndex: number, prompt: PromptEntry } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载预设
  useEffect(() => {
    const savedPresets = localStorage.getItem('chat_presets')
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets))
    } else {
      // 默认预设
      const defaultPresets: STPreset[] = [
        {
          id: 'default',
          name: '默认预设',
          description: '基础预设',
          temperature: 0.7,
          top_p: 0.9,
          openai_max_tokens: 2000,
          prompts: [
            {
              name: '系统提示',
              role: 'system',
              system_prompt: true,
              content: 'You are a helpful AI assistant.',
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            }
          ],
          createdAt: new Date().toISOString()
        }
      ]
      setPresets(defaultPresets)
      localStorage.setItem('chat_presets', JSON.stringify(defaultPresets))
    }
  }, [])

  // 保存预设
  const savePresets = (newPresets: STPreset[]) => {
    setPresets(newPresets)
    localStorage.setItem('chat_presets', JSON.stringify(newPresets))
  }

  // 删除预设
  const handleDelete = (id: string) => {
    if (id === 'default') {
      alert('默认预设不能删除')
      return
    }
    if (confirm('确定要删除此预设吗？')) {
      savePresets(presets.filter(p => p.id !== id))
    }
  }

  // 使用预设
  const handleUse = (preset: STPreset) => {
    localStorage.setItem('current_st_preset', JSON.stringify(preset))
    alert(`已应用预设：${preset.name}`)
  }
  
  // 导入预设（从 JSON 文件）
  const handleImport = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)
        
        // 支持 SillyTavern 预设格式
        let importedPreset: STPreset
        
        // ST预设格式转换
        importedPreset = {
          id: Date.now().toString(),
          name: data.name || '导入的预设',
          description: data.description || '从 SillyTavern 导入',
          temperature: data.temperature || 0.7,
          frequency_penalty: data.frequency_penalty || 0,
          presence_penalty: data.presence_penalty || 0,
          top_p: data.top_p || 0.9,
          top_k: data.top_k,
          top_a: data.top_a,
          min_p: data.min_p,
          repetition_penalty: data.repetition_penalty || 1,
          openai_max_context: data.openai_max_context,
          openai_max_tokens: data.openai_max_tokens || 2000,
          prompts: (data.prompts || []).map((p: any) => ({
            name: p.name || '未命名',
            role: p.role || 'system',
            system_prompt: p.system_prompt,
            content: p.content || '',
            identifier: p.identifier,
            injection_position: p.injection_position,
            injection_depth: p.injection_depth,
            forbid_overrides: p.forbid_overrides,
            marker: p.marker,
            // 保留原始的enabled状态，如果没有则默认true
            enabled: p.enabled !== false
          })),
          wi_format: data.wi_format,
          scenario_format: data.scenario_format,
          personality_format: data.personality_format,
          wrap_in_quotes: data.wrap_in_quotes,
          names_behavior: data.names_behavior,
          stream_openai: data.stream_openai,
          createdAt: new Date().toISOString()
        }
        
        savePresets([...presets, importedPreset])
        alert(`已导入预设：${importedPreset.name}`)
      } catch (error) {
        console.error('导入失败:', error)
        alert('导入失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // 重置 input
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <BackIcon size={24} />
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">预设管理</h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              导入
            </button>
          </div>
          
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* 预设列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p className="text-sm">暂无预设</p>
          </div>
        ) : (
          presets.map((preset) => (
            <div
              key={preset.id}
              className="bg-white rounded-xl p-4 border border-gray-200"
              style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{preset.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {preset.id !== 'default' && (
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
              
              {/* 采样参数 */}
              <div className="bg-gray-50 rounded-lg p-2 mb-2">
                <div className="text-[10px] text-gray-500 mb-1">采样参数</div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <div><span className="text-gray-400">Temp:</span> <span className="font-medium">{preset.temperature}</span></div>
                  <div><span className="text-gray-400">Top-P:</span> <span className="font-medium">{preset.top_p}</span></div>
                  <div><span className="text-gray-400">Max:</span> <span className="font-medium">{preset.openai_max_tokens}</span></div>
                </div>
              </div>
              
              {/* 提示词条目 */}
              <div className="bg-blue-50 rounded-lg p-2 mb-3">
                <div className="text-[10px] text-gray-500 mb-1">提示词条目 ({preset.prompts?.length || 0})</div>
                <div className="space-y-1">
                  {(preset.prompts || []).slice(0, 3).map((prompt, idx) => (
                    <div key={idx} className="text-[10px] text-gray-700 truncate">
                      • {prompt.name}
                    </div>
                  ))}
                  {(preset.prompts?.length || 0) > 3 && (
                    <div className="text-[10px] text-gray-400">...+{(preset.prompts?.length || 0) - 3} more</div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingPreset(preset)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  查看详情
                </button>
                <button
                  onClick={() => handleUse(preset)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  应用
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ST风格预设详情模态框 */}
      {viewingPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setViewingPreset(null)}>
          <div className="bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{viewingPreset.name}</h2>
                {viewingPreset.description && (
                  <p className="text-xs text-gray-500 mt-1">{viewingPreset.description}</p>
                )}
              </div>
              <button onClick={() => setViewingPreset(null)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            {/* 采样参数 - 简洁展示 */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-4 text-[11px] text-gray-600">
                <span>Temp: <b>{viewingPreset.temperature}</b></span>
                <span>Top-P: <b>{viewingPreset.top_p}</b></span>
                {viewingPreset.top_k !== undefined && <span>Top-K: <b>{viewingPreset.top_k}</b></span>}
                <span>Max: <b>{viewingPreset.openai_max_tokens}</b></span>
              </div>
            </div>
            
            {/* Prompts List - ST风格 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-xs font-medium text-gray-500 mb-3">Prompts ({(viewingPreset.prompts || []).length})</div>
              <div className="space-y-2">
                {(viewingPreset.prompts || []).map((prompt, idx) => {
                  const isEnabled = prompt.enabled !== false
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-lg transition-all ${
                        isEnabled ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      {/* 条目头部 */}
                      <div className="flex items-center gap-2 p-3">
                        {/* 拖拽手柄 */}
                        <div className="cursor-move text-gray-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="16" y2="6"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                            <line x1="8" y1="18" x2="16" y2="18"/>
                          </svg>
                        </div>
                        
                        {/* 开关 */}
                        <button 
                          onClick={() => {
                            const updatedPrompts = [...(viewingPreset.prompts || [])]
                            updatedPrompts[idx] = { ...prompt, enabled: !isEnabled }
                            const updatedPreset = { ...viewingPreset, prompts: updatedPrompts }
                            setViewingPreset(updatedPreset)
                            // 同步更新到presets列表
                            savePresets(presets.map(p => p.id === updatedPreset.id ? updatedPreset : p))
                          }}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                          style={{ backgroundColor: isEnabled ? '#3b82f6' : '#d1d5db' }}
                        >
                          <span 
                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            style={{ transform: isEnabled ? 'translateX(18px)' : 'translateX(2px)' }}
                          />
                        </button>
                        
                        {/* 名称和角色 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{prompt.name}</span>
                            {prompt.marker && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">
                                MARKER
                              </span>
                            )}
                            {prompt.forbid_overrides && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">
                                PINNED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Role: {prompt.role}
                            {prompt.identifier && ` · ID: ${prompt.identifier}`}
                            {prompt.injection_position !== undefined && ` · Pos: ${prompt.injection_position}`}
                            {prompt.injection_depth !== undefined && ` · Depth: ${prompt.injection_depth}`}
                            {prompt.injection_order !== undefined && ` · Order: ${prompt.injection_order}`}
                          </div>
                        </div>
                        
                        {/* 编辑按钮 */}
                        <button 
                          onClick={() => setEditingPrompt({ presetId: viewingPreset.id, promptIndex: idx, prompt })}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* 内容预览 */}
                      {!prompt.marker && prompt.content && (
                        <div className="px-3 pb-3">
                          <div className="text-[11px] text-gray-600 bg-gray-50 rounded p-2 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono">
                            {prompt.content}
                          </div>
                        </div>
                      )}
                      {prompt.marker && (
                        <div className="px-3 pb-3">
                          <div className="text-[11px] text-gray-400 italic bg-gray-50 rounded p-2">
                            系统内置占位符，内容由 SillyTavern 自动生成
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* 底部按钮 */}
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => {
                  handleUse(viewingPreset)
                  setViewingPreset(null)
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#3b82f6' }}
              >
                应用此预设
              </button>
              <button
                onClick={() => setViewingPreset(null)}
                className="px-6 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑提示词模态框 */}
      {editingPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50" onClick={() => setEditingPrompt(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">编辑提示词</h2>
              <button onClick={() => setEditingPrompt(null)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* 名称 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={editingPrompt.prompt.name}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 角色 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editingPrompt.prompt.role}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, role: e.target.value as any } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="system">system</option>
                  <option value="user">user</option>
                  <option value="assistant">assistant</option>
                </select>
              </div>
              
              {/* 内容 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  value={editingPrompt.prompt.content || ''}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, content: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  rows={12}
                  placeholder="输入提示词内容..."
                />
              </div>
              
              {/* 高级设置 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Injection Position</label>
                  <input
                    type="number"
                    value={editingPrompt.prompt.injection_position ?? ''}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, injection_position: e.target.value ? parseInt(e.target.value) : undefined } })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Injection Depth</label>
                  <input
                    type="number"
                    value={editingPrompt.prompt.injection_depth ?? ''}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, injection_depth: e.target.value ? parseInt(e.target.value) : undefined } })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setEditingPrompt(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 更新预设
                  const updatedPrompts = [...(viewingPreset?.prompts || [])]
                  updatedPrompts[editingPrompt.promptIndex] = editingPrompt.prompt
                  const updatedPreset = { ...viewingPreset!, prompts: updatedPrompts }
                  setViewingPreset(updatedPreset)
                  savePresets(presets.map(p => p.id === updatedPreset.id ? updatedPreset : p))
                  setEditingPrompt(null)
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#3b82f6' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PresetManager
