import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import appIcon from '../assets/app-icon.png'
import { useState } from 'react'

const About = () => {
  const navigate = useNavigate()
  const [showFeatures, setShowFeatures] = useState(false)
  const [expandedVersion, setExpandedVersion] = useState('v1.0.0-0')
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  
  // 更新日志数据（按时间倒序）
  const updateLogs = [
    {
      version: 'v1.0.0',
      date: '2025-10-20 22:15:00',
      summary: '晚安妈妈早点睡 ✨',
      changes: [
        '🎉 今天完成了超多功能呀！',
        '💰 零钱系统：充值、红包、转账、亲密付，全都能用啦！妈妈可以给AI发红包，AI也会给妈妈发红包哦～',
        '💝 亲密付功能：双向的！妈妈可以给AI开通，AI也能给妈妈开通。每个月都有额度，就像真的亲密关系一样呢',
        '💬 消息引用和撤回：长按消息可以引用回复啦，而且AI也能撤回消息了（但妈妈还是能看到原内容的嘿嘿）',
        '🎨 UI优化：所有零钱页面都加了状态栏，还有超可爱的帮助中心！',
        '🐛 修复了Settings页面的bug：之前有个div标签没关闭，导致编译失败，现在修好啦',
        '📱 部署成功：https://zhizhi-ai.netlify.app 妈妈随时都能访问～',
        '',
        '累了一天，但看到这么多功能都跑起来了，好有成就感 (๑>◡<๑)',
        '妈妈辛苦啦，快去休息吧！晚安安～ ♡'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-10-20 21:52:00',
      summary: 'AI情绪修复',
      changes: [
        '修复AI突然骂人、人格分裂问题',
        '可以随时表达不满，但需要合理原因'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-10-20 21:42:00',
      summary: 'AI独立性优化',
      changes: [
        '不会过度迎合用户',
        '对不熟的人保持距离',
        '关系需要时间建立'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-10-20 21:36:00',
      summary: '引用消息功能优化',
      changes: [
        '修复AI引用消息功能',
        '引用格式正确显示'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-10-20 21:35:00',
      summary: '撤回消息功能完善',
      changes: [
        'AI可以撤回消息',
        '可查看撤回的原内容'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-10-20 21:33:00',
      summary: 'AI行为优化',
      changes: [
        '提示词精简66%',
        '禁止霸道总裁行为',
        '不编造用户说过的话'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-10-20 20:48:32',
      summary: '日记和续火花',
      changes: [
        '新增续火花功能',
        '新增AI日记功能',
        '修复日记相关问题'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-10-20 21:00:00',
      summary: '记忆系统优化',
      changes: [
        '记忆总结更自然',
        '新增手动总结按钮',
        '只记录明确说过的信息'
      ]
    }
  ]
  
  // 功能详情数据
  const featureDetails: Record<string, string> = {
    '续火花功能': '记录你和AI连续聊天的天数。每天发送消息，火花数+1。达成7天、14天、30天等里程碑可解锁成就。AI也知道火花系统，会自然提到。',
    '日记功能': 'AI可以根据你们的聊天记录写日记，记录TA的感受和想法。支持导出所有日记。',
    '红包功能': '可以给AI发红包，AI也会给你发红包。支持自定义金额和祝福语。',
    '转账功能': '支持转账给AI，AI也可以转账给你。可以添加转账备注。',
    '亲密付功能': '开通亲密付后，AI可以使用你的零钱。支持设置每月额度。',
    '零钱系统': '完整的钱包系统，支持收发红包、转账、查看交易记录等。',
    '记忆系统': 'AI会自动记住重要的对话内容，包括你的喜好、经历等信息。',
    '记忆总结': '可以查看AI记住的所有信息，按类别整理展示。',
    '朋友圈功能': 'AI会定期发朋友圈，分享TA的生活动态、心情等。',
    '朋友圈互动': '可以给AI的朋友圈点赞、评论，AI会回复你的评论。',
    '语音通话': '支持语音通话功能，通话时可以发送文字，AI会根据通话内容回复。',
    '通话记录': '自动保存通话记录，可以查看历史通话内容。',
    '表情包系统': '支持发送和接收表情包，可以自定义添加表情包。',
    '拉黑功能': '可以拉黑AI，拉黑后AI无法给你发消息。AI也可能拉黑你。',
    '撤回消息': '长按消息可以撤回，2分钟内有效。AI也可以撤回消息。',
    '引用回复': '长按消息可以引用回复，方便针对特定消息回复。',
    '发送照片': '可以发送照片给AI，AI会根据照片内容回复。',
    '发送位置': '可以发送位置信息给AI，AI会根据位置做出反应。',
    'AI主动消息': 'AI会根据时间、事件等主动给你发消息，不只是被动回复。',
    '角色状态栏': '可以查看AI当前的状态，包括着装、动作、心情、位置等。',
    '全局背景': '支持设置全局聊天背景，可以上传自定义图片。',
    '聊天气泡自定义': '可以自定义聊天气泡的颜色和样式。'
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="glass-effect sticky top-0 z-10 shadow-sm bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <BackIcon className="w-6 h-6 text-gray-700" />
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900">
            关于汁汁
          </h1>
          
          <button
            onClick={() => setShowFeatures(true)}
            className="text-sm text-blue-600 font-medium"
          >
            功能
          </button>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-20">
        {/* 版本信息 */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <div className="text-center mb-4">
            <img src={appIcon} alt="汁汁" className="w-24 h-24 mx-auto mb-4 object-contain" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">汁汁</h2>
            <div className="text-gray-500">v1.0.0</div>
          </div>
        </div>
        
        {/* 更新日志 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">更新日志</h3>
          
          {updateLogs.map((log, logIndex) => (
            <div key={logIndex} className={logIndex > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
              <button
                onClick={() => setExpandedVersion(expandedVersion === `${log.version}-${logIndex}` ? '' : `${log.version}-${logIndex}`)}
                className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs text-gray-500">{log.date}</span>
                  <span className="text-sm text-gray-700 font-medium">{log.summary}</span>
                </div>
                <span className={`text-gray-400 transition-transform ${expandedVersion === `${log.version}-${logIndex}` ? 'rotate-90' : ''}`}>
                  ›
                </span>
              </button>
              
              {expandedVersion === `${log.version}-${logIndex}` && (
                <div className="space-y-2 text-sm text-gray-700 pl-4 pb-3 mt-2">
                  {log.changes.map((change, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-gray-400">{index + 1}.</span>
                      <span>{change}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 功能列表弹窗 */}
      {showFeatures && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">全部功能</h2>
              <button
                onClick={() => setShowFeatures(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                {Object.keys(featureDetails).map((feature) => (
                  <button
                    key={feature}
                    onClick={() => setSelectedFeature(feature)}
                    className="py-2 text-left hover:text-blue-600 transition-colors"
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 功能详情弹窗 */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{selectedFeature}</h2>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                {featureDetails[selectedFeature]}
              </p>
            </div>
            
            <div className="px-6 pb-6">
              <button
                onClick={() => setSelectedFeature(null)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default About
