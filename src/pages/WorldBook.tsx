import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { BackIcon, AddIcon, SearchIcon, MoreIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { lorebookManager, Lorebook } from '../utils/lorebookSystem'

const WorldBook = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLorebooks()
  }, [])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const loadLorebooks = async () => {
    const all = await lorebookManager.getAllLorebooks()
    setLorebooks(all)
  }

  const handleCreate = () => {
    navigate('/create-world-book')
  }

  const handleEdit = (id: string) => {
    navigate(`/edit-world-book/${id}`)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个世界书吗？')) {
      await lorebookManager.deleteLorebook(id)
      await loadLorebooks()
    }
  }

  const handleExport = (id: string) => {
    const json = lorebookManager.exportLorebook(id)
    if (!json) return

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lorebook_${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        const content = event.target?.result as string
        const lorebook = await lorebookManager.importLorebook(content)
        if (lorebook) {
          await loadLorebooks()
          alert('导入成功')
        } else {
          alert('导入失败，请检查文件格式')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const filteredLorebooks = lorebooks.filter(lb =>
    lb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lb.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/settings', { replace: true })}
            className="ios-button text-gray-700"
          >
            <BackIcon size={24} />
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            世界书
          </h1>
          <button
            onClick={handleCreate}
            className="ios-button text-primary"
          >
            <AddIcon size={24} />
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-3 pt-3 pb-2">
        <div className="glass-card rounded-2xl px-4 py-2 flex items-center gap-2">
          <SearchIcon size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="搜索世界书"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3">
        {filteredLorebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-sm mb-2">暂无世界书</div>
            <div className="text-xs text-gray-400 mb-4">
              创建世界书或导入现有的世界书
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                className="glass-card rounded-xl px-6 py-2 text-sm text-primary font-medium"
              >
                创建世界书
              </button>
              <button
                onClick={handleImport}
                className="glass-card rounded-xl px-6 py-2 text-sm text-gray-700 font-medium"
              >
                导入世界书
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLorebooks.map((lorebook) => (
              <div
                key={lorebook.id}
                className="glass-card rounded-2xl p-4 relative"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {lorebook.name}
                      </h3>
                      {lorebook.is_global && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                          全局
                        </span>
                      )}
                    </div>
                    {lorebook.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {lorebook.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setMenuPosition({
                        top: rect.bottom + 4,
                        right: window.innerWidth - rect.right
                      })
                      setShowMenu(showMenu === lorebook.id ? null : lorebook.id)
                    }}
                    className="ios-button text-gray-400 ml-2"
                  >
                    <MoreIcon size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{lorebook.entries.length} 条目</span>
                  <span>扫描深度 {lorebook.scan_depth}</span>
                  <span>预算 {lorebook.token_budget}</span>
                </div>

                {/* 菜单 - 使用 Portal 和 fixed 定位 */}
                {showMenu === lorebook.id && (
                  <div 
                    ref={menuRef}
                    className="fixed glass-effect rounded-xl shadow-lg border border-white/30 overflow-hidden z-[9999]"
                    style={{
                      top: `${menuPosition.top}px`,
                      right: `${menuPosition.right}px`
                    }}
                  >
                    <button
                      onClick={() => {
                        handleEdit(lorebook.id)
                        setShowMenu(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-white/50"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => {
                        handleExport(lorebook.id)
                        setShowMenu(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-white/50"
                    >
                      导出
                    </button>
                    <button
                      onClick={() => {
                        handleDelete(lorebook.id)
                        setShowMenu(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-white/50"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      {lorebooks.length > 0 && (
        <div className="p-3 glass-effect border-t border-white/30">
          <button
            onClick={handleImport}
            className="w-full glass-card rounded-xl py-3 text-sm font-medium text-gray-700"
          >
            导入世界书
          </button>
        </div>
      )}
    </div>
  )
}

export default WorldBook
