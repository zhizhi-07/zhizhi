import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCharacter } from '../context/CharacterContext'
import { callAI } from '../utils/api'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

// 随机头像emoji
const RANDOM_AVATARS = [
  '😊', '🥰', '😘', '😍', '🤗', '😇', '🥳', '😎',
  '🤔', '😏', '😌', '😴', '🤭', '🤫', '🤨', '😳',
  '🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '💐', '🌙',
  '⭐', '✨', '💫', '🌟', '☀️', '🌈', '🦄', '🐱',
  '🐶', '🐰', '🐻', '🦊', '🐼', '🐨', '🐯', '🦁'
]

// 生成人设卡的提示词
const generateCharactersPrompt = (count: number, tags: string[] = [], customDesc: string = '') => {
  // 生成随机数确保每次不同
  const randomSeed = Math.random().toString(36).substring(7)
  
  let tagHint = ''
  if (tags.length > 0) {
    tagHint = `\n【用户偏好】角色要符合以下特点：${tags.join('、')}`
  }
  
  let customHint = ''
  if (customDesc.trim()) {
    customHint = `\n【用户描述】${customDesc.trim()}`
  }
  
  return `生成${count}个现代都市角色，用于线上聊天APP。(种子: ${randomSeed})${tagHint}${customHint}

【核心要求】
写出真实的现代年轻人，不要写成电视剧人物、小说角色或游戏NPC。要有烟火气、生活感、精致感。

【场景】
刚才深夜/下班/周末无聊，随手打开摇一摇，匹配到了陌生人。可能在床上刷手机、在地铁上、在咖啡厅、在公司加班。

【角色设定原则】
1. 名字要精致现代，自己创造，不要用烂大街的：
   ✗ 禁止使用：苏xx、xx晚、xx伊、xx念、xx萱、xx瑶、xx涵、xx轩、xx宇、xx泽（太老土烂大街）
   ✗ 禁止使用：冷艳、霸气、倾城、紫萱、梦瑶、雨萱、诗涵（太中二/太电视剧）
   ✗ 禁止使用：子涵、梓涵、梓轩、浩宇、浩然、雨萱、欣怡（太烂大街）
   ✓ 要求：名字要有辨识度，简洁有质感，不落俗套，让人一听就记住

2. 职业要真实接地气：
   ✗ 禁止：霸道总裁、豪门千金、财团继承人、天才医生、顶级律师（太电视剧）
   要求：写普通人的职业，要具体，不要空泛

3. 性格要精致立体：
   ✗ 禁止写成：温柔善良、高冷霸气、活泼可爱（太扁平）
   要求：必须有矛盾感和反差，要有小缺点，要有真实情绪

4. 生活要具体有质感：
   ✗ 禁止说：喜欢音乐、喜欢看书、喜欢旅行（太笼统）
   要求：必须具体到歌名、书名、品牌、地点，要有画面感

5. 状态要真实：
   要求：写出此时此刻在干什么，要有具体场景和情绪

【文风要求 - 精致细腻】
- ✗ 禁止用：美丽动人、倾国倾城、气质出众、优雅高贵、温柔善良、活泼可爱（太空洞太电视剧）
- 要求：用具体细节描写，要有画面感，描述要像在写一个你身边真实存在的朋友

【个性签名】
✗ 禁止：愿你三冬暖愿你春不寒、做最好的自己、岁月静好、不忘初心（太文艺腔太鸡汤）
要求：像真人会写的，要接地气，可以丧可以emo可以自嘲

【description内容 - 极致细腻的写法】

基本信息：姓名/性别/年龄/职业
✗ 禁止："23岁，博主"（太笼统）
要求：职业要具体，比如什么平台、什么领域、粉丝量等

外貌特征：
✗ 禁止："长得挺好看的，五官精致"（太空洞）
要求：写具体特征，眼型、鼻子、嘴唇、痣、耳洞、手指等，要让人能想象出画面

身材体态：
要求：写身高体重、肩膀、锁骨、腰、腿等具体细节，包括不满意的地方和习惯性动作

性格：
✗ 禁止："性格温柔，有点内向"（太扁平）
要求：必须有矛盾和反差，必须有小缺点，必须有真实情绪

语言习惯：
✗ 禁止："说话温柔"（没特色）
要求：要有具体的口头禅、语气词、打字习惯，要有个人特色

此刻的状态：
要求：具体到这一秒在干什么，要有场景描写（光线、物品、姿势），要有情绪

兴趣爱好：
✗ 禁止："喜欢音乐、购物、看书"（太笼统）
要求：必须具体到歌手、歌名、书名、品牌、地点，要有画面感

小缺点和真实感：
要求：写具体的小缺点，让角色更真实接地气

家庭背景：
要求：写父母职业、家庭经济状况、和家人的关系

聊天风格：
要求：写打字习惯、发语音习惯、用emoji习惯、对陌生人的态度

记忆设定：
要求：写角色今天的经历和为什么会打开摇一摇。比如"今天加班到九点，回家路上觉得特别累，躺在床上刷手机，突然想起来有个摇一摇功能，就试了一下"。要自然，不要刻意

⚠️ 输出格式（纯JSON数组，不要markdown）：
[
  {
    "name": "角色名字",
    "signature": "个性签名",
    "description": "按照上面的要求，写出极致细腻的角色描述。包含：基本信息、外貌特征、身材体态、性格、语言习惯、此刻的状态、兴趣爱好、小缺点、家庭背景、聊天风格、记忆设定。每个部分都要具体、有画面感、有细节。"
  }
]

⚠️ 必须：
1. JSON数组，${count}个角色
2. 每个角色只有name、signature、description三个字段
3. 每个角色完全不同，有真实感
4. 文风细腻，有画面感

生成：`
}

// 通过API一次性生成多个随机AI角色
const generateRandomAIs = async (count: number, tags: string[] = [], customDesc: string = '') => {
  try {
    const prompt = generateCharactersPrompt(count, tags, customDesc)
    const response = await callAI(prompt)

    // 尝试解析JSON数组
    let charactersData: any[]
    try {
      console.log('原始API响应:', response)
      
      // 清理响应
      let cleanResponse = response
        // 移除markdown代码块
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        // 移除开头的说明文字，找到第一个[
        .replace(/^[\s\S]*?(?=\[)/m, '')
        // 移除结尾的说明文字，找到最后一个]
        .replace(/\][\s\S]*$/m, ']')
        .trim()
      
      console.log('清理后的响应:', cleanResponse)
      
      // 找到JSON数组
      const firstBracket = cleanResponse.indexOf('[')
      const lastBracket = cleanResponse.lastIndexOf(']')
      
      if (firstBracket === -1 || lastBracket === -1) {
        throw new Error('未找到JSON数组')
      }
      
      let jsonStr = cleanResponse.substring(firstBracket, lastBracket + 1)
      
      // 移除可能的控制字符
      jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, '')
      
      console.log('提取的JSON字符串:', jsonStr.substring(0, 300) + '...')
      
      // 解析JSON数组
      charactersData = JSON.parse(jsonStr)
      
      if (!Array.isArray(charactersData)) {
        throw new Error('返回的不是数组')
      }
      
      // 处理每个角色
      charactersData = charactersData.map((characterData, index) => {
        // 如果AI不听话，添加了额外字段，我们手动合并到description
        if (Object.keys(characterData).length > 3) {
          console.warn(`角色${index + 1}检测到额外字段，正在合并...`)
          const extraFields: string[] = []
          for (const key in characterData) {
            if (key !== 'name' && key !== 'signature' && key !== 'description') {
              extraFields.push(`【${key}】${characterData[key]}`)
              delete characterData[key]
            }
          }
          if (extraFields.length > 0) {
            characterData.description = characterData.description + '\n\n' + extraFields.join('\n\n')
          }
        }
        
        // 验证必要字段
        if (!characterData.name || !characterData.signature || !characterData.description) {
          throw new Error(`角色${index + 1}数据不完整`)
        }
        
        // 随机选择头像
        const avatar = RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)]
        
        return {
          name: characterData.name,
          username: `${characterData.name}_${Math.floor(Math.random() * 9999)}`,
          avatar,
          signature: characterData.signature,
          description: characterData.description
        }
      })
      
      console.log(`成功解析${charactersData.length}个角色`)
    } catch (e) {
      console.error('解析角色数据失败:', e)
      console.error('完整响应:', response)
      throw new Error('生成角色失败，请重试')
    }

    return charactersData
  } catch (error) {
    console.error('生成AI角色失败:', error)
    throw error
  }
}

// 预设标签
const PRESET_TAGS = [
  // 性格类
  '温柔体贴', '活泼开朗', '傲娇', '病娇', '天然呆',
  '成熟稳重', '腹黑', '毒舌', '文艺', '知性',
  '乐观向上', '内向害羞', '外向健谈', '神秘', '可爱软萌', '飒爽',
  '温婉', '大大咧咧', '细腻敏感', '理性冷静', '感性浪漫', '幽默风趣',
  '叛逆', '穿孔',
  
  // 二次元风格
  '萝莉', '少女', '大小姐',
  '学妹', '青梅竹马', '邻家少女',
  
  // 职业身份
  '学生', '教师', '医生', '律师', '作家', '画家', '音乐人',
  '模特', '演员', '主播', '博主', '摄影师', '咖啡师',
  
  // 兴趣爱好
  '爱读书', '爱运动', '爱音乐', '爱旅行', '爱美食', '爱游戏',
  '爱动漫', '爱电影', '爱摄影', '爱画画', '爱写作', '爱烹饪',
  
  // 特殊标签
  '夜猫子', '早起鸟', '社恐', '社牛', '吃货', '猫奴',
  '狗奴', '宅女', '运动达人', '文艺青年', '技术宅', '颜控'
]

const ShakeShake = () => {
  const navigate = useNavigate()
  const { addCharacter } = useCharacter()
  const { showStatusBar } = useSettings()
  const [isShaking, setIsShaking] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [randomAIs, setRandomAIs] = useState<any[]>([])
  const [selectedAI, setSelectedAI] = useState<any>(null)
  const [showTagSelector, setShowTagSelector] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customDescription, setCustomDescription] = useState('')
  const lastShakeTime = useRef(0)
  const shakeThreshold = 15 // 摇动阈值

  // 检测摇动
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0

    const handleMotion = (event: DeviceMotionEvent) => {
      if (isShaking || showResult) return

      const acceleration = event.accelerationIncludingGravity
      if (!acceleration) return

      const x = acceleration.x ?? 0
      const y = acceleration.y ?? 0
      const z = acceleration.z ?? 0
      
      const deltaX = Math.abs(x - lastX)
      const deltaY = Math.abs(y - lastY)
      const deltaZ = Math.abs(z - lastZ)

      // 检测是否摇动
      if (deltaX + deltaY + deltaZ > shakeThreshold) {
        const now = Date.now()
        if (now - lastShakeTime.current > 1000) {
          lastShakeTime.current = now
          handleShake()
        }
      }

      lastX = x
      lastY = y
      lastZ = z
    }

    // 请求权限（iOS 13+需要）
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleMotion)
          }
        })
        .catch(console.error)
    } else {
      window.addEventListener('devicemotion', handleMotion)
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [isShaking, showResult])

  // 处理摇动
  const handleShake = async () => {
    setIsShaking(true)
    
    // 震动反馈
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    try {
      // 生成2-3个随机AI（一次API调用）
      const count = Math.floor(Math.random() * 2) + 2 // 2-3个
      const ais = await generateRandomAIs(count, selectedTags, customDescription)
      
      setIsShaking(false)
      setRandomAIs(ais)
      setShowResult(true)
    } catch (error) {
      console.error('生成角色失败:', error)
      setIsShaking(false)
      alert('生成角色失败，请检查API配置或重试')
    }
  }

  // 手动摇一摇（点击按钮）
  const handleManualShake = () => {
    if (isShaking || showResult) return
    setShowTagSelector(true)
  }

  // 开始摇一摇
  const handleStartShake = () => {
    setShowTagSelector(false)
    handleShake()
  }

  // 切换标签选择
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // 添加AI到通讯录
  const handleAddAI = (ai: any) => {
    addCharacter(ai)
    alert(`已添加 ${ai.name} 到通讯录！`)
  }

  // 重新摇一摇
  const handleReset = () => {
    setShowResult(false)
    setRandomAIs([])
    setSelectedTags([])
    setCustomDescription('')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* iOS状态栏 */}
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航 */}
      <div className="glass-effect px-5 py-4 border-b border-gray-200/50 flex items-center">
        <button onClick={() => navigate(-1)} className="text-gray-600 mr-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">摇一摇</h1>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {!showResult ? (
          // 摇一摇界面
          <div className="text-center">
            <div 
              className={`mx-auto mb-8 transition-transform duration-500 ${
                isShaking ? 'animate-shake scale-110' : ''
              }`}
            >
              <img 
                src="/shake-icon.png" 
                alt="摇一摇" 
                className="w-48 h-48 object-contain"
              />
            </div>

            {isShaking ? (
              <div className="space-y-4">
                <div className="text-2xl font-bold text-gray-800 animate-pulse">
                  正在寻找...
                </div>
                <div className="flex justify-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-2xl font-bold text-gray-800">
                  摇一摇手机
                </div>
                <div className="text-gray-500">
                  随机遇见有趣的AI角色
                </div>
                <button
                  onClick={handleManualShake}
                  className="px-8 py-3 glass-card text-gray-800 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all ios-button"
                >
                  点击摇一摇
                </button>
              </div>
            )}
          </div>
        ) : (
          // 结果展示
          <div className="w-full max-w-md space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                🎉 发现了 {randomAIs.length} 个AI
              </div>
              <div className="text-gray-500">点击卡片查看详情</div>
            </div>

            <div className="space-y-3">
              {randomAIs.map((ai, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedAI(ai)}
                  className="glass-card rounded-2xl p-4 flex items-center space-x-4 animate-slide-up cursor-pointer hover:shadow-xl transition-all"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center text-3xl shadow-lg flex-shrink-0 border border-gray-200/50">
                    {ai.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-lg">{ai.name}</div>
                    <div className="text-sm text-gray-500 truncate">{ai.signature}</div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {ai.description.split('\n')[2]?.replace('【性格】', '')}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddAI(ai)
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all ios-button flex-shrink-0"
                  >
                    添加
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 glass-card text-gray-800 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all ios-button mt-6"
            >
              再摇一次
            </button>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      {!showResult && !isShaking && (
        <div className="pb-8 text-center text-sm text-gray-400">
          <div>摇动手机或点击按钮</div>
          <div>发现随机AI角色</div>
        </div>
      )}

      {/* 标签选择弹窗 */}
      {showTagSelector && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTagSelector(false)}
        >
          <div 
            className="glass-card rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">选择角色偏好</h2>
            <p className="text-sm text-gray-500 mb-6">选择你喜欢的角色特点，或者自己描述</p>

            {/* 标签选择 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-700">预设标签</div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    清除全部 ({selectedTags.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'glass-card text-gray-700 hover:shadow-md'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 自定义描述 */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 mb-3">自定义描述（可选）</div>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="描述你想要的角色特点，例如：喜欢看书的文艺女生，性格温柔但有点小傲娇..."
                className="w-full px-4 py-3 glass-card rounded-2xl text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>

            {/* 按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={handleStartShake}
                className="flex-1 py-3 bg-blue-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all ios-button"
              >
                开始摇一摇
              </button>
              <button
                onClick={() => setShowTagSelector(false)}
                className="px-6 py-3 glass-card text-gray-800 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all ios-button"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {selectedAI && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAI(null)}
        >
          <div 
            className="glass-card rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center text-5xl shadow-lg border border-gray-200/50">
                {selectedAI.avatar}
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-900">{selectedAI.name}</div>
                <div className="text-sm text-gray-500 mt-1">{selectedAI.signature}</div>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="space-y-4">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedAI.description}
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  handleAddAI(selectedAI)
                  setSelectedAI(null)
                }}
                className="flex-1 py-3 bg-green-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all ios-button"
              >
                添加到通讯录
              </button>
              <button
                onClick={() => setSelectedAI(null)}
                className="px-6 py-3 glass-card text-gray-800 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all ios-button"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 自定义动画样式 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-5deg); }
          20%, 40%, 60%, 80% { transform: translateX(10px) rotate(5deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

export default ShakeShake
