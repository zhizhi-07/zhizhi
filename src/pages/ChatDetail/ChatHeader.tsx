/**
 * 聊天头部组件
 */

import { useNavigate } from 'react-router-dom'
import { BackIcon, MoreIcon } from '../../components/Icons'
import StatusBar from '../../components/StatusBar'

interface ChatHeaderProps {
  characterName: string
  characterId: string
  onMenuClick: () => void
}

const ChatHeader = ({ characterName, characterId, onMenuClick }: ChatHeaderProps) => {
  const navigate = useNavigate()
  
  return (
    <>
      <StatusBar />
      
      {/* 顶部导航栏 */}
      <div className="bg-[#EDEDED] border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 active:opacity-50"
            aria-label="返回"
          >
            <BackIcon size={24} className="text-gray-800" />
          </button>
          
          <h1 className="text-lg font-medium text-gray-900 flex-1 text-center">
            {characterName}
          </h1>
          
          <button 
            onClick={onMenuClick}
            className="p-2 -mr-2 active:opacity-50"
            aria-label="更多选项"
          >
            <MoreIcon size={24} className="text-gray-800" />
          </button>
        </div>
      </div>
    </>
  )
}

export default ChatHeader
