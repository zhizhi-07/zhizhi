import { useState, useEffect } from 'react'
import { getEmojis, deleteEmoji, exportEmojis, importEmojis, clearAllEmojis, Emoji } from '../utils/emojiStorage'
import StatusBar from './StatusBar'
import { useSettings } from '../context/SettingsContext'

interface EmojiManagementProps {
  show: boolean
  onClose: () => void
}

const EmojiManagement = ({ show, onClose }: EmojiManagementProps) => {
  const { showStatusBar } = useSettings()
  const [emojis, setEmojis] = useState<Emoji[]>([])
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [showBatchPreview, setShowBatchPreview] = useState(false)
  const [descriptions, setDescriptions] = useState<{ [key: number]: string }>({})
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (show) {
      loadEmojis()
    }
  }, [show])

  const loadEmojis = async () => {
    try {
      const loaded = await getEmojis()
      setEmojis(loaded)
    } catch (error) {
      console.error('加载失败:', error)
      setEmojis([])
    }
  }

  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      alert('请选择有效的图片文件')
      return
    }
    
    setBatchFiles(imageFiles)
    setShowBatchPreview(true)
    
    // 初始化描述（使用文件名）
    const initialDescriptions: { [key: number]: string } = {}
    imageFiles.forEach((file, index) => {
      initialDescriptions[index] = file.name.replace(/\.[^/.]+$/, '')
    })
    setDescriptions(initialDescriptions)
  }

  const removeBatchFile = (index: number) => {
    const newFiles = batchFiles.filter((_, i) => i !== index)
    setBatchFiles(newFiles)
    
    if (newFiles.length === 0) {
      setShowBatchPreview(false)
    } else {
      // 重新索引描述
      const newDescriptions: { [key: number]: string } = {}
      newFiles.forEach((file, i) => {
        newDescriptions[i] = descriptions[i < index ? i : i + 1] || file.name.replace(/\.[^/.]+$/, '')
      })
      setDescriptions(newDescriptions)
    }
  }

  const handleConfirmBatchUpload = async () => {
    if (batchFiles.length === 0) return
    
    setUploading(true)
    
    try {
      const { addEmoji } = await import('../utils/emojiStorage')
      let successCount = 0
      let failedCount = 0
      
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i]
        
        try {
          const dataUrl = await readFileAsDataURL(file)
          
          const result = await addEmoji({
            url: dataUrl,
            name: file.name,
            description: descriptions[i] || file.name.replace(/\.[^/.]+$/, '')
          })
          
          if (result) {
            successCount++
            console.log(`✅ 成功添加: ${file.name}`)
          } else {
            failedCount++
            console.warn(`❌ 添加失败: ${file.name} (存储空间不足)`)
            // 如果失败，停止继续添加
            break
          }
        } catch (error) {
          failedCount++
          console.error(`❌ 处理失败: ${file.name}`, error)
        }
      }
      
      // 显示结果（只在有错误时弹窗）
      if (successCount > 0 && failedCount === 0) {
        console.log(`✅ 成功添加 ${successCount} 个表情包！`)
      } else if (successCount > 0 && failedCount > 0) {
        console.warn(`⚠️ 部分成功！成功：${successCount} 个，失败：${failedCount} 个`)
      } else if (failedCount > 0) {
        console.error(`❌ 添加失败，请检查存储空间`)
      }
      
      // 重置
      setBatchFiles([])
      setShowBatchPreview(false)
      setDescriptions({})
      loadEmojis()
      
    } catch (error) {
      console.error('批量上传失败:', error)
      alert('批量上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个表情包吗？')) {
      try {
        await deleteEmoji(id)
        await loadEmojis()
      } catch (error) {
        console.error('删除失败:', error)
        alert('删除失败，可能是无痕模式限制')
      }
    }
  }

  const handleExport = async () => {
    if (emojis.length === 0) {
      alert('没有表情包可以导出')
      return
    }
    
    try {
      const dataStr = await exportEmojis()
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `emojis-backup-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert(`成功导出 ${emojis.length} 个表情包！`)
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，可能是无痕模式限制')
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    console.log('选择的文件:', file.name, file.type)
    
    // 检查文件类型
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      alert('请选择 JSON 文件')
      e.target.value = ''
      return
    }
    
    // 询问导入模式
    const currentCount = emojis.length
    let replaceMode = false
    
    if (currentCount > 0) {
      const choice = confirm(
        `当前有 ${currentCount} 个表情包\n\n` +
        `点击"确定"：追加导入（保留现有）\n` +
        `点击"取消"：替换导入（清空现有）\n\n` +
        `提示：如果存储空间不足，建议选择"替换导入"`
      )
      replaceMode = !choice // 点击取消时使用替换模式
    }
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        // 直接导入
        const result = await importEmojis(event.target?.result as string, replaceMode)
        
        if (result.success) {
          // 刷新表情包列表
          await loadEmojis()
          // 显示成功消息
          alert(result.message)
          console.log('✅ 导入成功，已刷新表情包列表')
        } else {
          alert(result.message)
        }
      } catch (error) {
        console.error('导入失败:', error)
        if (error instanceof Error && error.message === '导入超时') {
          alert('⚠️ 导入失败\n\n原因：当前处于无痕/隐私浏览模式\n\n解决方案：\n1. 使用普通浏览模式\n2. 在浏览器设置中允许存储数据')
        } else {
          alert('导入失败，请检查文件格式: ' + (error instanceof Error ? error.message : ''))
        }
      }
    }
    reader.onerror = () => {
      alert('读取文件失败')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearAll = async () => {
    if (emojis.length === 0) {
      alert('没有表情包可以清空')
      return
    }
    
    if (confirm(`确定要清空所有 ${emojis.length} 个表情包吗？\n\n此操作无法撤销！建议先导出备份。`)) {
      try {
        await clearAllEmojis()
        await loadEmojis()
        alert('已清空所有表情包')
      } catch (error) {
        console.error('清空失败:', error)
        alert('清空失败，可能是无痕模式限制')
      }
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-[#EDEDED] z-50 flex flex-col">
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-gray-700 text-base"
        >
          返回
        </button>
        <h1 className="text-base font-semibold text-gray-900">表情包管理</h1>
        <div className="w-12"></div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="px-4 py-3 glass-card mx-3 mt-3 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">总计：<span className="font-semibold text-gray-900">{emojis.length}</span> 个表情包</span>
          <span className="text-gray-600">
            大小：<span className="font-semibold text-gray-900">
              {(JSON.stringify(emojis).length / 1024).toFixed(2)} KB
            </span>
          </span>
        </div>
      </div>

      {/* 操作按钮区 */}
      <div className="px-3 py-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-center px-4 py-2.5 glass-card text-gray-600 text-sm rounded-xl cursor-pointer active:bg-gray-100 shadow-lg border border-gray-200/50">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            批量上传
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleBatchFileSelect}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleExport}
            className="flex items-center justify-center px-4 py-2.5 glass-card text-gray-600 text-sm rounded-xl active:bg-gray-100 shadow-lg border border-gray-200/50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出备份
          </button>
          
          <label className="flex items-center justify-center px-4 py-2.5 glass-card text-gray-600 text-sm rounded-xl cursor-pointer active:bg-gray-100 shadow-lg border border-gray-200/50">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            导入备份
            <input
              type="file"
              accept=".json,application/json,text/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleClearAll}
            className="flex items-center justify-center px-4 py-2.5 glass-card text-gray-600 text-sm rounded-xl active:bg-gray-100 shadow-lg border border-gray-200/50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空全部
          </button>
        </div>
      </div>

      {/* 批量上传预览 */}
      {showBatchPreview && (
        <div className="px-3 py-3">
          <div className="glass-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900">
              已选择 {batchFiles.length} 个文件
            </span>
            <button
              onClick={() => setShowBatchPreview(false)}
              className="text-sm text-gray-600"
            >
              取消
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {batchFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/80 p-2 rounded-xl border border-gray-200/50">
                <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="text"
                  value={descriptions[index] || ''}
                  onChange={(e) => setDescriptions({ ...descriptions, [index]: e.target.value })}
                  placeholder="输入描述..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                />
                <button
                  onClick={() => removeBatchFile(index)}
                  className="text-red-500 text-xl w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleConfirmBatchUpload}
            disabled={uploading}
            className="w-full py-2.5 bg-[#07C160] text-white text-sm rounded-xl disabled:opacity-50 shadow-lg"
          >
            {uploading ? '上传中...' : `确认添加 ${batchFiles.length} 个表情包`}
          </button>
          </div>
        </div>
      )}

      {/* 表情包网格 */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {emojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" opacity="0.3"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <circle cx="9" cy="9" r="1"/>
              <circle cx="15" cy="9" r="1"/>
            </svg>
            <div className="text-sm mb-1">还没有表情包</div>
            <div className="text-xs text-gray-300">点击"批量上传"添加表情包</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {emojis.map((emoji) => (
              <div
                key={emoji.id}
                className="relative aspect-square rounded-xl overflow-hidden glass-card shadow-lg border border-gray-200/50 group"
              >
                <img
                  src={emoji.url}
                  alt={emoji.description}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div className="text-white text-xs truncate">{emoji.description}</div>
                </div>
                {emoji.useCount > 0 && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                    {emoji.useCount}次
                  </div>
                )}
                <button
                  onClick={() => handleDelete(emoji.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm shadow-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmojiManagement
