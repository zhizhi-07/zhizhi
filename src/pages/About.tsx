import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import appIcon from '../assets/app-icon.webp'
import { useState } from 'react'

const About = () => {
  const navigate = useNavigate()
  const [showFeatures, setShowFeatures] = useState(false)
  const [expandedVersion, setExpandedVersion] = useState('v1.0.0-0')
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  
  // 更新日志数据（按时间倒序）
  const updateLogs = [
    {
      version: 'v1.0.3',
      date: '2025-10-23',
      summary: '气泡商店与样式优化',
      changes: [
        '新增气泡商店：8种精美气泡样式可选',
        '新增气泡颜色编辑功能：支持自定义主色调',
        '优化气泡预览显示效果',
        '新增字体自定义功能：支持上传字体链接（.woff2/.woff/.ttf/.otf）',
        '优化导航栏时间背景：更精致的显示效果',
        '新增音乐播放器功能：完整播放器功能',
        '新增灵动岛功能：后台播放控制',
        '预设6首歌曲：罗生门、浴室、特别的人、情人、舍得、如果爱忘了'
      ]
    },
    {
      version: 'v1.0.2',
      date: '2025-10-22',
      summary: 'AI热梗系统上线',
      changes: [
        '新增AI热梗系统：智能识别和使用网络流行语',
        '大幅优化AI提示词，提升对话质量和自然度',
        '优化群聊和单聊回复逻辑',
        '修复AI无法发送亲密付',
        '修复功能标记显示到聊天中',
        '修复记忆系统重复提取',
        '修复发送消息自动触发AI回复',
        '新增直播交互骨架（功能待完善）',
        '增加谁是卧底游戏',
        '增加五子棋游戏',
        '增加热梗小程序',
        '增加续火花小程序'
      ]
    },
    {
      version: 'v1.0.1',
      date: '2025-10-21',
      summary: '群聊与摇一摇',
      changes: [
        '新增摇一摇随机生成AI',
        '新增群聊功能',
        '群聊@成员和表情包',
        '群聊拼手气红包',
        'AI分段发消息',
        '修复记账助手跳转',
        '优化创建群聊流程',
        '新增AI记账功能：智能识别账单、自动分类、记账助手对话',
        '优化ChatDetail聊天体验，修复多处显示问题',
        '优化朋友圈发布和显示功能'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2025-10-20',
      summary: 'v1.0.0 基础功能完善与Bug修复',
      changes: [
        '修复Settings页面编译错误',
        '修复AI回复格式问题',
        '修复消息撤回显示异常',
        '修复记忆系统总结不准确',
        '修复红包金额显示错误',
        '修复日记导出功能异常',
        '修复续火花计数不准确',
        '优化提示词，减少66%的token消耗'
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
            <div className="text-gray-500">v1.0.3</div>
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
