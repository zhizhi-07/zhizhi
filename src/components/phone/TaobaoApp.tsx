import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface TaobaoAppProps {
  content: AIPhoneContent
}

const TaobaoApp = ({ content }: TaobaoAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-gradient-to-r from-orange-400/20 to-red-400/20">
        <h2 className="text-lg font-semibold text-gray-800">淘宝</h2>
        <p className="text-xs text-gray-500 mt-1">我的订单</p>
      </div>
      
      {/* 订单列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {content.taobaoOrders.map((order, index) => (
          <div 
            key={index}
            className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-orange-200/50 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-200/60 to-red-200/40 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">📦</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 mb-1">{order.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-orange-600">¥{order.price}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaobaoApp
