import { ImageIcon, CameraIcon, RedPacketIcon, TransferIcon, IntimatePayIcon, LocationIcon, PhoneIcon, VideoIcon, MicIcon, CoupleSpaceIcon } from './Icons'

interface ChatMenuProps {
  onClose: () => void
  onSelectImage: () => void
  onSelectCamera: () => void
  onSelectRedPacket: () => void
  onSelectTransfer: () => void
  onSelectIntimatePay: () => void
  onSelectCoupleSpaceInvite: () => void
  onSelectLocation: () => void
  onSelectVoiceMessage: () => void
  onSelectVoiceCall: () => void
  onSelectVideoCall: () => void
}

const ChatMenu = ({
  onClose,
  onSelectImage,
  onSelectCamera,
  onSelectRedPacket,
  onSelectTransfer,
  onSelectIntimatePay,
  onSelectCoupleSpaceInvite,
  onSelectLocation,
  onSelectVoiceMessage,
  onSelectVoiceCall,
  onSelectVideoCall
}: ChatMenuProps) => {
  const menuItems = [
    { id: 'image', label: '相册', Icon: ImageIcon, onClick: onSelectImage },
    { id: 'camera', label: '拍摄', Icon: CameraIcon, onClick: onSelectCamera },
    { id: 'redpacket', label: '红包', Icon: RedPacketIcon, onClick: onSelectRedPacket },
    { id: 'transfer', label: '转账', Icon: TransferIcon, onClick: onSelectTransfer },
    { id: 'intimate-pay', label: '亲密付', Icon: IntimatePayIcon, onClick: onSelectIntimatePay },
    { id: 'couple-space', label: '情侣空间', Icon: CoupleSpaceIcon, onClick: onSelectCoupleSpaceInvite },
    { id: 'voice-msg', label: '语音', Icon: MicIcon, onClick: onSelectVoiceMessage },
    { id: 'voice', label: '语音通话', Icon: PhoneIcon, onClick: onSelectVoiceCall },
    { id: 'video', label: '视频通话', Icon: VideoIcon, onClick: onSelectVideoCall },
    { id: 'location', label: '位置', Icon: LocationIcon, onClick: onSelectLocation },
  ]

  return (
    <>
      {/* 遮罩层 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        style={{ bottom: 0 }}
      />

      {/* 菜单内容 */}
      <div className="fixed bottom-0 left-0 right-0 glass-effect border-t border-gray-200/50 z-50 pb-safe animate-slide-up">
        <div className="w-full mx-auto px-6 py-8">
          <div className="grid grid-cols-4 gap-6">
            {menuItems.map((item) => {
              const Icon = item.Icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.onClick()
                    onClose()
                  }}
                  className="flex flex-col items-center gap-3 ios-button"
                >
                  <div className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center shadow-md border border-gray-200/50 hover:shadow-lg transition-all">
                    <Icon size={26} className="text-gray-700" />
                  </div>
                  <span className="text-[13px] text-gray-700 font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* iOS Home Indicator */}
        <div className="flex justify-center pt-1 pb-3">
          <div className="w-32 h-1 bg-gray-900 rounded-full opacity-30"></div>
        </div>
      </div>
    </>
  )
}

export default ChatMenu

