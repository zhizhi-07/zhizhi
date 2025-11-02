/**
 * 添加菜单组件（+号菜单）
 */

interface AddMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: () => void
  onSelectCamera: () => void
  onSelectRedPacket: () => void
  onSelectTransfer: () => void
  onSelectIntimatePay: () => void
  onSelectCoupleSpaceInvite: () => void
  onSelectLocation: () => void
  onSelectVoice: () => void
  onSelectMusicInvite: () => void
  onSelectXiaohongshu: () => void
  hasCoupleSpaceActive?: boolean
}

const AddMenu = ({
  isOpen,
  onClose,
  onSelectImage,
  onSelectCamera,
  onSelectRedPacket,
  onSelectTransfer,
  onSelectIntimatePay,
  onSelectCoupleSpaceInvite,
  onSelectLocation,
  onSelectVoice,
  onSelectMusicInvite,
  onSelectXiaohongshu,
  hasCoupleSpaceActive = false
}: AddMenuProps) => {
  if (!isOpen) return null

  const menuItems = [
    { icon: '🖼️', label: '相册', onClick: onSelectImage },
    { icon: '📷', label: '拍摄', onClick: onSelectCamera },
    { icon: '🧧', label: '红包', onClick: onSelectRedPacket },
    { icon: '💰', label: '转账', onClick: onSelectTransfer },
    { icon: '💳', label: '亲密付', onClick: onSelectIntimatePay },
    { icon: '📍', label: '位置', onClick: onSelectLocation },
    { icon: '🎤', label: '语音', onClick: onSelectVoice },
    { icon: '🎵', label: '一起听', onClick: onSelectMusicInvite },
    { icon: '📕', label: '小红书', onClick: onSelectXiaohongshu },
  ]

  // 如果情侣空间未激活，添加邀请选项
  if (!hasCoupleSpaceActive) {
    menuItems.push({ icon: '💑', label: '情侣空间', onClick: onSelectCoupleSpaceInvite })
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* 菜单面板 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 animate-slide-up">
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 菜单标题 */}
        <div className="px-4 py-2 border-b border-gray-100">
          <h3 className="text-base font-medium text-gray-800">选择功能</h3>
        </div>

        {/* 菜单项网格 */}
        <div className="grid grid-cols-4 gap-4 p-4 pb-8">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="text-3xl">{item.icon}</div>
              <span className="text-xs text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 取消按钮 */}
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            取消
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default AddMenu

