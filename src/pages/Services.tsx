import { useNavigate } from 'react-router-dom'
import { WalletIcon, BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import GlobalBackground from '../components/GlobalBackground'

// 简单的SVG图标组件
const ChevronRight = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CreditCardIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const QrCodeIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const Services = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()

  // 处理返回
  const handleBack = () => {
    console.log('点击返回按钮')
    navigate('/me')
  }

  // 服务列表
  const services = [
    { id: 1, name: '零钱', icon: WalletIcon, path: '/wallet', desc: '安全便捷的零钱包' },
    { id: 2, name: '信用卡还款', icon: CreditCardIcon, path: '', desc: '免费还款，快速到账' },
    { id: 3, name: '手机充值', icon: QrCodeIcon, path: '', desc: '话费充值，优惠多多' },
  ]

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <GlobalBackground applyToAll={true} />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* iOS状态栏 */}
        {showStatusBar && <StatusBar />}
        
        {/* 顶部标题栏 */}
        <div className="glass-effect border-b border-gray-200/50 bg-white flex items-center">
          <button 
            onClick={handleBack}
            className="px-4 py-4 active:opacity-50 cursor-pointer flex items-center justify-center"
          >
            <BackIcon size={24} className="text-gray-900" />
          </button>
          <h1 className="flex-1 text-center text-[17px] font-semibold text-gray-900 pr-14">服务</h1>
        </div>

        {/* 服务列表 */}
      <div className="flex-1 overflow-y-auto px-3 pt-3">
        <div className="glass-card rounded-2xl overflow-hidden bg-white">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <div key={service.id}>
                <div 
                  onClick={() => service.path && navigate(service.path)}
                  className="flex items-center px-4 py-4 ios-button cursor-pointer"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-[16px] font-medium text-gray-900">{service.name}</div>
                    {service.desc && (
                      <div className="text-xs text-gray-500 mt-0.5">{service.desc}</div>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
                {index < services.length - 1 && (
                  <div className="border-b border-gray-100 ml-[68px]" />
                )}
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </div>
  )
}

export default Services
