/**
 * 聊天页面头部组件
 */

import { BackIcon, MoreIcon } from '../../../components/Icons'
import { Character } from '../../../context/ContactsContext'
import { TokenStats } from '../types'
import { formatTokenCount } from '../../../utils/tokenCounter'

interface ChatHeaderProps {
  character: Character | undefined
  onBack: () => void
  onMenuClick: () => void
  onStatusClick?: () => void
  tokenStats?: TokenStats
  showTokenStats?: boolean
}

const ChatHeader = ({
  character,
  onBack,
  onMenuClick,
  onStatusClick,
  tokenStats,
  showTokenStats = false
}: ChatHeaderProps) => {
  if (!character) {
    return (
      <div className="sticky top-0 z-10 bg-[#EDEDED] border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2">
          <BackIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <div className="font-medium">加载中...</div>
        </div>
        <div className="w-9" />
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-10 bg-[#EDEDED] border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* 返回按钮 */}
      <button onClick={onBack} className="p-2 -ml-2">
        <BackIcon className="w-5 h-5" />
      </button>

      {/* 角色信息 */}
      <div 
        className="flex-1 text-center cursor-pointer"
        onClick={onStatusClick}
      >
        <div className="font-medium">{character.name}</div>
        {showTokenStats && tokenStats && (
          <div className="text-xs text-gray-500 mt-0.5">
            {formatTokenCount(tokenStats.total)} tokens ({tokenStats.percentage}%)
          </div>
        )}
      </div>

      {/* 更多菜单按钮 */}
      <button onClick={onMenuClick} className="p-2 -mr-2">
        <MoreIcon className="w-5 h-5" />
      </button>
    </div>
  )
}

export default ChatHeader

