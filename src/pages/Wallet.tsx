import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon, WalletIcon } from '../components/Icons'
import { getBalance, recharge } from '../utils/walletUtils'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

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

const ClockIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ShieldIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const Wallet = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [balance, setBalance] = useState('0.00')
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState('')

  // 处理返回
  const handleBack = () => {
    console.log('点击返回按钮')
    navigate('/services')
  }

  // 从localStorage加载余额
  useEffect(() => {
    const currentBalance = getBalance()
    setBalance(currentBalance.toFixed(2))
  }, [])

  // 处理充值
  const handleRecharge = () => {
    const amount = parseFloat(rechargeAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效的充值金额')
      return
    }
    
    const success = recharge(amount)
    if (success) {
      const newBalance = getBalance()
      setBalance(newBalance.toFixed(2))
      setRechargeAmount('')
      setShowRechargeModal(false)
    }
  }

  // 快捷金额选项
  const quickAmounts = ['100', '200', '500', '1000']

  // 功能菜单
  const menuItems = [
    { id: 1, name: '零钱通', icon: CreditCardIcon, desc: '赚收益，随时用', path: '' },
    { id: 2, name: '交易记录', icon: ClockIcon, desc: '', path: '/transaction-history' },
    { id: 3, name: '帮助中心', icon: ShieldIcon, desc: '', path: '/wallet-help' },
  ]

  return (
    <div className="h-full flex flex-col bg-[#EDEDED]">
      {/* iOS状态栏 */}
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white flex items-center border-b border-gray-200">
        <button 
          onClick={handleBack}
          className="px-4 py-4 active:opacity-50 cursor-pointer flex items-center justify-center"
        >
          <BackIcon size={24} className="text-gray-900" />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-medium text-gray-900 pr-14">零钱</h1>
      </div>

      {/* 余额卡片 */}
      <div className="bg-white px-5 pt-8 pb-6">
        <div className="flex items-center justify-center mb-2">
          <WalletIcon size={20} className="text-gray-500 mr-2" />
          <span className="text-sm text-gray-500">零钱</span>
        </div>
        <div className="text-center mb-6">
          <span className="text-[48px] font-light text-gray-900">¥{balance}</span>
        </div>
        
        {/* 操作按钮 */}
        <div>
          <button 
            onClick={() => setShowRechargeModal(true)}
            className="w-full bg-[#07C160] text-white py-3 rounded-lg text-[16px] font-medium active:opacity-80"
          >
            充值
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-[#FFF9E6] px-4 py-3 mx-4 mt-3 rounded-lg">
        <p className="text-xs text-[#B8860B] leading-relaxed">
          零钱可用于发红包、转账等。充值后余额将安全保存在本地。
        </p>
      </div>

      {/* 功能菜单 */}
      <div className="bg-white mt-3 px-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={item.id}>
              <div 
                onClick={() => item.path && navigate(item.path)}
                className="flex items-center py-4 active:bg-gray-50 cursor-pointer"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <Icon size={20} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="text-[16px] text-gray-900">{item.name}</div>
                  {item.desc && (
                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                  )}
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
              {index < menuItems.length - 1 && (
                <div className="border-b border-gray-100 ml-[52px]" />
              )}
            </div>
          )
        })}
      </div>

      {/* 底部说明 */}
      <div className="mt-6 px-6 pb-6">
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          零钱资金将享受微信支付安全保障
        </p>
      </div>

      {/* 充值弹窗 */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRechargeModal(false)}>
          <div className="bg-white rounded-2xl w-[85%] max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">充值零钱</h2>
            
            {/* 输入金额 */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">充值金额</div>
              <div className="flex items-center border-2 border-gray-200 rounded-lg px-4 py-3 focus-within:border-[#07C160]">
                <span className="text-2xl text-gray-900 mr-2">¥</span>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 text-2xl outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* 快捷金额 */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setRechargeAmount(amount)}
                  className="py-2 border border-gray-300 rounded-lg text-gray-700 active:bg-gray-100"
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRechargeModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 active:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleRecharge}
                className="flex-1 py-3 bg-[#07C160] text-white rounded-lg active:opacity-80"
              >
                确认充值
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Wallet
