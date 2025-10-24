import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { lorebookManager, Lorebook, LorebookEntry } from '../utils/lorebookSystem'
import { useCharacter } from '../context/CharacterContext'

const EditWorldBook = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  const [lorebook, setLorebook] = useState<Lorebook | null>(null)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (id) {
      const lb = lorebookManager.getLorebook(id)
      setLorebook(lb)
    } else {
      // 创建新世界书
      const newLorebook: Lorebook = {
        id: '',
        name: '新世界书',
        description: '',
        entries: [],
        scan_depth: 10,
        token_budget: 2000,
        recursive_scanning: false,
        is_global: false,
        character_ids: [],
        created_at: Date.now(),
        updated_at: Date.now()
      }
      setLorebook(newLorebook)
    }
  }, [id])

  const handleSave = () => {
    if (!lorebook) return

    if (id) {
      lorebookManager.updateLorebook(id, lorebook)
    } else {
      lorebookManager.createLorebook(lorebook)
    }

    navigate('/worldbook')
  }

  const handleAddEntry = () => {
    if (!lorebook) return

    const newEntry: LorebookEntry = {
      id: `temp_${Date.now()}`,
      name: '新条目',
      keys: [],
      content: '',
      enabled: true,
      priority: 500,
      insertion_order: lorebook.entries.length,
      case_sensitive: false,
      use_regex: false,
      token_budget: 200,
      constant: false,
      selective: false,
      position: 'before_char',
      comment: '',
      category: '',
      created_at: Date.now(),
      updated_at: Date.now()
    }

    setLorebook({
      ...lorebook,
      entries: [...lorebook.entries, newEntry]
    })
    setEditingEntry(newEntry.id)
  }

  const handleUpdateEntry = (entryId: string, updates: Partial<LorebookEntry>) => {
    if (!lorebook) return

    setLorebook({
      ...lorebook,
      entries: lorebook.entries.map(e =>
        e.id === entryId ? { ...e, ...updates } : e
      )
    })
  }

  const handleDeleteEntry = (entryId: string) => {
    if (!lorebook) return

    setLorebook({
      ...lorebook,
      entries: lorebook.entries.filter(e => e.id !== entryId)
    })
  }

  if (!lorebook) return null

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700"
          >
            取消
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            {id ? '编辑世界书' : '创建世界书'}
          </h1>
          <button
            onClick={handleSave}
            className="ios-button text-primary font-medium"
          >
            保存
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3 pb-3">
        {/* 基本信息 */}
        <div className="glass-card rounded-2xl p-4 mb-3">
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">名称</label>
            <input
              type="text"
              value={lorebook.name}
              onChange={(e) => setLorebook({ ...lorebook, name: e.target.value })}
              className="w-full bg-white/50 rounded-xl px-3 py-2 text-sm text-gray-900 border border-white/30 outline-none focus:border-primary"
              placeholder="世界书名称"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">描述</label>
            <textarea
              value={lorebook.description}
              onChange={(e) => setLorebook({ ...lorebook, description: e.target.value })}
              className="w-full bg-white/50 rounded-xl px-3 py-2 text-sm text-gray-900 border border-white/30 outline-none focus:border-primary resize-none"
              placeholder="简要描述这个世界书的用途"
              rows={2}
            />
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-primary"
          >
            {showSettings ? '收起设置' : '展开设置'}
          </button>

          {showSettings && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  扫描深度（最近N条消息）
                </label>
                <input
                  type="number"
                  value={lorebook.scan_depth}
                  onChange={(e) => setLorebook({ ...lorebook, scan_depth: parseInt(e.target.value) || 10 })}
                  className="w-full bg-white/50 rounded-xl px-3 py-2 text-sm text-gray-900 border border-white/30 outline-none focus:border-primary"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Token 预算
                </label>
                <input
                  type="number"
                  value={lorebook.token_budget}
                  onChange={(e) => setLorebook({ ...lorebook, token_budget: parseInt(e.target.value) || 2000 })}
                  className="w-full bg-white/50 rounded-xl px-3 py-2 text-sm text-gray-900 border border-white/30 outline-none focus:border-primary"
                  min="100"
                  max="10000"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700">全局世界书</span>
                <button
                  onClick={() => setLorebook({ ...lorebook, is_global: !lorebook.is_global })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    lorebook.is_global ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    lorebook.is_global ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {!lorebook.is_global && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    关联角色
                  </label>
                  <div className="space-y-1">
                    {characters.map(char => (
                      <label key={char.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={lorebook.character_ids.includes(char.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setLorebook({
                                ...lorebook,
                                character_ids: [...lorebook.character_ids, char.id]
                              })
                            } else {
                              setLorebook({
                                ...lorebook,
                                character_ids: lorebook.character_ids.filter(id => id !== char.id)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-xs text-gray-700">{char.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 条目列表 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-gray-500 font-medium">
              条目 ({lorebook.entries.length})
            </span>
            <button
              onClick={handleAddEntry}
              className="ios-button text-primary text-xs"
            >
              添加条目
            </button>
          </div>

          {lorebook.entries.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-gray-400">
              <div className="text-sm mb-2">暂无条目</div>
              <div className="text-xs">点击上方"添加条目"开始创建</div>
            </div>
          ) : (
            <div className="space-y-2">
              {lorebook.entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  isEditing={editingEntry === entry.id}
                  onEdit={() => setEditingEntry(entry.id)}
                  onCollapse={() => setEditingEntry(null)}
                  onUpdate={(updates) => handleUpdateEntry(entry.id, updates)}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 条目卡片组件
interface EntryCardProps {
  entry: LorebookEntry
  isEditing: boolean
  onEdit: () => void
  onCollapse: () => void
  onUpdate: (updates: Partial<LorebookEntry>) => void
  onDelete: () => void
}

const EntryCard = ({ entry, isEditing, onEdit, onCollapse, onUpdate, onDelete }: EntryCardProps) => {
  const [keyInput, setKeyInput] = useState('')

  const handleAddKey = () => {
    if (!keyInput.trim()) return
    onUpdate({ keys: [...entry.keys, keyInput.trim()] })
    setKeyInput('')
  }

  const handleRemoveKey = (index: number) => {
    onUpdate({ keys: entry.keys.filter((_, i) => i !== index) })
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <input
            type="text"
            value={entry.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full bg-transparent text-sm font-semibold text-gray-900 border-none outline-none"
            placeholder="条目名称"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate({ enabled: !entry.enabled })}
            className={`w-10 h-5 rounded-full transition-colors ${
              entry.enabled ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
              entry.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
          <button
            onClick={onDelete}
            className="ios-button text-red-500"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {!isEditing ? (
        <div onClick={onEdit} className="cursor-pointer">
          <div className="flex flex-wrap gap-1 mb-2">
            {entry.keys.slice(0, 3).map((key, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                {key}
              </span>
            ))}
            {entry.keys.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                +{entry.keys.length - 3}
              </span>
            )}
          </div>
          {entry.content && (
            <p className="text-xs text-gray-500 line-clamp-2">{entry.content}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* 关键词 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">触发关键词</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {entry.keys.map((key, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600"
                >
                  {key}
                  <button
                    onClick={() => handleRemoveKey(i)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKey()}
                className="flex-1 bg-white/50 rounded-xl px-3 py-1.5 text-xs text-gray-900 border border-white/30 outline-none focus:border-primary"
                placeholder="输入关键词后按回车"
              />
              <button
                onClick={handleAddKey}
                className="glass-card rounded-xl px-3 py-1.5 text-xs text-primary"
              >
                添加
              </button>
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">注入内容</label>
            <textarea
              value={entry.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full bg-white/50 rounded-xl px-3 py-2 text-xs text-gray-900 border border-white/30 outline-none focus:border-primary resize-none"
              placeholder="当关键词被触发时，这段内容会被注入到提示词中"
              rows={4}
            />
          </div>

          {/* 高级选项 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-gray-500 mb-1">优先级</label>
              <input
                type="number"
                value={entry.priority}
                onChange={(e) => onUpdate({ priority: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/50 rounded-xl px-2 py-1 text-gray-900 border border-white/30 outline-none"
                min="0"
                max="999"
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">位置</label>
              <select
                value={entry.position}
                onChange={(e) => onUpdate({ position: e.target.value as any })}
                className="w-full bg-white/50 rounded-xl px-2 py-1 text-gray-900 border border-white/30 outline-none"
              >
                <option value="top">顶部</option>
                <option value="before_char">角色前</option>
                <option value="after_char">角色后</option>
                <option value="bottom">底部</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">大小写敏感</span>
            <button
              onClick={() => onUpdate({ case_sensitive: !entry.case_sensitive })}
              className={`w-10 h-5 rounded-full transition-colors ${
                entry.case_sensitive ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                entry.case_sensitive ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">始终注入</span>
            <button
              onClick={() => onUpdate({ constant: !entry.constant })}
              className={`w-10 h-5 rounded-full transition-colors ${
                entry.constant ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                entry.constant ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <button
            onClick={onCollapse}
            className="w-full text-xs text-gray-500 py-2"
          >
            收起
          </button>
        </div>
      )}
    </div>
  )
}

export default EditWorldBook
