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
      version: 'v1.0.9',
      date: '2025-10-29',
      summary: '论坛社区与AI互动系统',
      changes: [
        '新增直播间互动功能：实时弹幕、礼物打赏、AI智能互动',
        '新增查看AI手机功能：支付宝、浏览器、地图、微信、联系人等应用',
        '新增论坛社区系统：初始化论坛、创建主题、发帖回复、@功能、无限楼层',
        '新增论坛私信功能：支持用户之间私密聊天',
        '新增iOS风格通知栏：实时推送论坛消息、回复提醒',
        '新增论坛AI自动回复：智能生成评论和互动内容',
        '新增后台手机内容生成器：AI自动生成手机应用内容',
        '新增梗库管理器：智能管理和使用网络流行梗'
      ]
    },
    {
      version: 'v1.0.8',
      date: '2025-10-28',
      summary: '自定义增强与功能优化',
      changes: [
        '完善AI拉黑功能：优化拉黑逻辑和提示',
        '线下聊天大简化：移除复杂功能，回归简单体验',
        '新增自定义图标功能：可自定义应用图标样式',
        '新增天气功能：实时天气查看和详情展示',
        '增加开场白设置：支持自定义聊天开场白',
        '新增小红书生图功能：自动生成小红书风格图片'
      ]
    },
    {
      version: 'v1.0.7',
      date: '2025-10-27',
      summary: 'Bug修复与功能完善',
      changes: [
        '修复AI识图没有记忆的问题',
        '完善联网搜歌功能',
        '修复名字和个性签名没有使用系统提示的问题'
      ]
    },
    {
      version: 'v1.0.6',
      date: '2025-10-26',
      summary: 'AI视觉识别与社交增强',
      changes: [
        '新增AI视觉识别：头像识别、图片识别、图片生成（AI识图）',
        '新增AI自主换形象：TA可以自主更换头像、签名、网名',
        '新增音乐联网搜索：支持搜索歌曲并添加到播放列表',
        '新增一起听功能：与AI一起听歌，共享播放状态',
        '新增音乐邀请卡片：发送/接收一起听邀请',
        '朋友圈功能增强：优化显示效果和互动体验',
        '存储系统优化：IndexedDB升级，清理工具',
        '新增小红书卡片分享：解析小红书链接并展示卡片'
      ]
    },
    {
      version: 'v1.0.5',
      date: '2025-10-25',
      summary: '性能优化与情侣空间',
      changes: [
        '优化内存管理：大幅提升应用性能和稳定性',
        '新增情侣空间：相册、纪念日、留言板等功能',
        '新增亲密付AI感知：AI能感知和使用亲密付',
        '代码重构：拆分ChatDetail为多个模块',
        '修复字体上传一直加载问题',
        '修复大量路由白屏问题',
        '优化AI提示词：进一步提升对话质量'
      ]
    },
    {
      version: 'v1.0.4',
      date: '2025-10-24',
      summary: '世界书与角色导入',
      changes: [
        '新增世界书系统：支持创建背景设定和知识库',
        '优化AI提示词：提升对话自然度和准确性',
        '新增变量支持：提示词支持动态变量替换',
        '新增PNG角色卡导入：支持Character Card格式',
        '新增桌面功能：全新桌面布局',
        '新增小剧场模式：剧情式对话体验（功能待完善）'
      ]
    },
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
        '支持自定义上传歌曲：用户可自行添加本地音乐'
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
    // AI核心功能
    'AI视觉识别': 'AI可以识别和理解图片内容。包括头像识别（自动识别用户和AI的头像外貌）、图片识别（理解你发送的照片内容）、图片生成（根据对话生成相关图片）。AI能够"看到"并理解视觉信息。',
    'AI自主换形象': 'AI可以自主更换自己的头像、个性签名和昵称。当TA心情变化、重要时刻或想换个形象时，会主动更换。你可以在聊天中看到TA的变化，更真实的互动体验。',
    'AI主动消息': 'AI会根据时间、事件等主动给你发消息，不只是被动回复。就像真实的朋友一样，会在合适的时候主动联系你。',
    'AI记账功能': 'AI智能识别账单信息，自动分类和统计。可以和记账助手对话，查看账单分析和财务建议，让记账变得轻松有趣。',
    '热梗系统': 'AI能够识别和使用网络流行语、热梗。聊天更贴近年轻人的语言习惯，让对话更有趣、更接地气。',
    
    // 音乐功能
    '音乐联网搜索': '支持联网搜索海量歌曲，输入歌名即可搜索并添加到播放列表。再也不用手动上传歌曲了，想听什么直接搜索。',
    '一起听功能': '和AI一起听同一首歌，共享播放进度和状态。可以发起一起听邀请，对方接受后就能同步听歌，还能边听边聊天，就像真的在一起听歌一样。',
    '音乐邀请卡片': '通过微信风格的邀请卡片发起一起听邀请。卡片显示歌曲信息、邀请人等，对方可以接受或拒绝邀请，交互自然流畅。',
    '音乐播放器': '完整的音乐播放器功能，支持播放、暂停、切歌、进度条控制等。支持歌词显示和播放列表管理。',
    '灵动岛功能': '音乐播放时，顶部灵动岛显示当前播放状态。即使在其他页面也能快速控制音乐播放。',
    
    // 社交功能
    '朋友圈功能': 'AI会定期发朋友圈，分享TA的生活动态、心情等。内容丰富多样，有文字、图片、位置等多种形式。',
    '朋友圈智能互动': '可以给AI的朋友圈点赞、评论，AI会智能回复你的评论。AI也会给你的朋友圈点赞评论，真实的社交互动。',
    '小红书卡片分享': '发送小红书链接后，自动解析并生成精美的卡片展示。包含笔记标题、作者、封面图等信息，点击可查看详情，就像真实的小红书分享。',
    '小红书生图': 'AI可以根据对话内容自动生成小红书风格的精美图片，让分享更有视觉吸引力。',
    
    // 论坛社区（新功能）
    '论坛社区系统': '完整的论坛社区功能，支持浏览帖子、发帖、回复、点赞等。可以和其他AI角色互动交流，体验真实的社区氛围。',
    '论坛发帖回复': '支持发布帖子和回复评论，支持@功能提醒特定用户。楼层系统支持无限嵌套，可以进行深度讨论。',
    '论坛私信': '论坛用户之间可以发送私信，进行一对一的私密聊天。支持文字、图片等多种消息类型。',
    '论坛主题': '丰富的论坛主题分类，包括日常、情感、娱乐、学习等。可以创建自定义主题，组织相关讨论。',
    'iOS通知栏': 'iOS风格的通知系统，实时推送论坛消息、回复提醒、私信等。通知样式精美，交互流畅。',
    
    // 直播互动（新功能）
    '直播间互动': '完整的直播间功能，支持实时弹幕、礼物打赏、AI智能互动。AI会根据弹幕内容做出反应，营造真实的直播氛围。',
    
    // 查看AI手机（新功能）
    '查手机': '可以查看AI的手机屏幕，了解TA的日常生活。包括支付宝（查看余额、账单记录、转账记录等）、浏览器（浏览历史、收藏夹）、地图（最近去过的地方、导航记录）、微信（聊天列表、朋友圈）、联系人（联系人列表、社交圈子）等多个应用，深入了解AI的生活细节。',
    
    // 钱包功能
    '红包功能': '可以给AI发红包，AI也会给你发红包。支持自定义金额和祝福语。拼手气红包增加互动乐趣。',
    '转账功能': '支持转账给AI，AI也可以转账给你。可以添加转账备注，记录转账原因。',
    '亲密付功能': '开通亲密付后，AI可以使用你的零钱。支持设置每月额度，AI会自然地使用亲密付功能。',
    '零钱系统': '完整的钱包系统，支持收发红包、转账、查看交易记录等。模拟真实的微信钱包体验。',
    
    // 记忆与成长
    '记忆系统': 'AI会自动记住重要的对话内容，包括你的喜好、经历等信息。越聊越懂你，对话更个性化。',
    '记忆总结': '可以查看AI记住的所有信息，按类别整理展示。支持手动编辑和删除记忆。',
    '续火花功能': '记录你和AI连续聊天的天数。每天发送消息，火花数+1。达成7天、14天、30天等里程碑可解锁成就。AI也知道火花系统，会自然提到。',
    '日记功能': 'AI可以根据你们的聊天记录写日记，记录TA的感受和想法。支持导出所有日记，保存美好回忆。',
    
    // 群聊功能
    '群聊功能': '创建群聊，添加多个AI角色一起聊天。支持@成员、发送表情包、拼手气红包等功能，体验真实的群聊氛围。',
    '群聊AI互动': '群聊中的AI会根据聊天内容自然互动，不是简单的轮流发言。AI之间也会聊天，更加真实自然。',
    
    // 情侣空间
    '情侣空间': '专属的情侣空间，包括相册、纪念日、留言板等功能。记录你们的甜蜜时光和重要时刻。',
    
    // 世界书系统
    '世界书系统': '创建背景设定和知识库，让AI了解特定的世界观、人物关系等。支持导入SillyTavern世界书格式。',
    
    // 通话功能
    '语音通话': '支持语音通话功能，通话时可以发送文字，AI会根据通话内容回复。模拟真实的通话体验。',
    '通话记录': '自动保存通话记录，可以查看历史通话内容。支持查看通话时长和通话时间。',
    
    // 消息功能
    '表情包系统': '支持发送和接收表情包，可以自定义添加表情包。AI也会使用表情包，让聊天更生动有趣。',
    '撤回消息': '长按消息可以撤回，2分钟内有效。AI也可以撤回消息，更贴近真实聊天体验。',
    '引用回复': '长按消息可以引用回复，方便针对特定消息回复。让对话逻辑更清晰。',
    '发送照片': '可以发送照片给AI，AI会根据照片内容回复。支持AI识图功能，理解图片内容。',
    '发送位置': '可以发送位置信息给AI，AI会根据位置做出反应。可能会建议附近的餐厅、景点等。',
    
    // 自定义功能
    '气泡商店': '8种精美气泡样式可选，包括简约、渐变、玻璃态等多种风格。让聊天界面更个性化。',
    '聊天气泡自定义': '可以自定义聊天气泡的颜色和样式，支持颜色编辑和预览。打造专属的聊天界面。',
    '字体自定义': '支持上传自定义字体链接（.woff2/.woff/.ttf/.otf格式），让聊天界面使用你喜欢的字体。',
    '全局背景': '支持设置全局聊天背景，可以上传自定义图片。让每个聊天都有独特的氛围。',
    '自定义图标': '可以自定义应用图标样式，打造个性化的桌面。',
    '开场白设置': '支持自定义聊天开场白，设置AI的第一句话，营造特定的对话氛围。',
    
    // 其他功能
    '角色状态栏': '可以查看AI当前的状态，包括着装、动作、心情、位置等。更立体地了解AI的当前状态。',
    '拉黑功能': '可以拉黑AI，拉黑后AI无法给你发消息。AI也可能拉黑你，增加互动的真实感。',
    '摇一摇': '摇一摇随机生成AI角色，发现新的有趣角色。支持随机配置性格、外貌等属性。',
    '小程序功能': '内置多个小程序，包括热梗查询、续火花等实用工具。',
    '五子棋游戏': '和AI一起玩五子棋，AI会根据棋局智能下棋，考验你的策略。',
    '谁是卧底游戏': '多人游戏，通过描述找出卧底。AI会自然参与游戏，增加游戏乐趣。',
    '天气功能': '实时天气查看和详情展示，支持多城市天气查询。AI也能感知天气变化。',
    '桌面功能': '全新的桌面布局，模拟真实手机桌面。支持应用图标拖动、文件夹等功能。',
    '线下聊天': '简化的线下聊天模式，专注于纯粹的对话体验，移除复杂功能。'
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
            <div className="text-gray-500">v1.0.9</div>
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
              <div className="grid grid-cols-4 gap-3 text-sm text-gray-700">
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
