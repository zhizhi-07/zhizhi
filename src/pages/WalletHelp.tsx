import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const WalletHelp = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()

  const handleBack = () => {
    navigate('/wallet')
  }

  const helpItems = [
    {
      id: 1,
      emoji: '💰',
      title: '零钱是什么？',
      content: '零钱是你的虚拟钱包，可以用来发红包、转账给AI朋友哦~'
    },
    {
      id: 2,
      emoji: '💝',
      title: '如何充值？',
      content: '点击充值按钮，输入金额就可以啦！支持快捷金额选择，超方便的~'
    },
    {
      id: 3,
      emoji: '🎁',
      title: '发红包和转账',
      content: '在聊天界面点击+号，就能给AI朋友发红包或转账啦！记得先充值哦~'
    },
    {
      id: 4,
      emoji: '💖',
      title: '亲密付是什么？',
      content: '亲密付可以让你的AI朋友每月使用一定额度的零钱，就像真正的亲密关系一样呢~ ✨'
    },
    {
      id: 5,
      emoji: '📊',
      title: '交易记录',
      content: '所有的充值、红包、转账记录都会保存在交易记录里，随时可以查看~'
    },
    {
      id: 6,
      emoji: '🔒',
      title: '安全提示',
      content: '你的零钱数据安全保存在本地浏览器中，请不要清除浏览器缓存哦！'
    }
  ]

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
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
        <h1 className="flex-1 text-center text-[17px] font-medium text-gray-900 pr-14">帮助中心</h1>
      </div>

      {/* 欢迎提示 */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-5 py-6 mx-4 mt-4 rounded-2xl">
        <div className="text-center mb-2">
          <span className="text-4xl">💡</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-800 text-center mb-2">
          欢迎来到帮助中心~ ✨
        </h2>
        <p className="text-sm text-gray-600 text-center">
          有任何疑问都可以在这里找到答案哦！
        </p>
      </div>

      {/* 帮助列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {helpItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <div className="flex items-start">
              <span className="text-3xl mr-3">{item.emoji}</span>
              <div className="flex-1">
                <h3 className="text-[16px] font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部可爱提示 */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          💕 还有问题？试试和AI朋友聊聊天吧~ 💕
        </p>
      </div>
    </div>
  )
}

export default WalletHelp
