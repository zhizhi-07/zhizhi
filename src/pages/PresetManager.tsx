import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon } from '../components/Icons'

// ST预设中的单个提示词条目
export interface PromptEntry {
  name: string
  system_prompt?: boolean
  role: 'system' | 'user' | 'assistant'
  content: string
  identifier?: string
  injection_position?: number
  injection_depth?: number
  injection_order?: number
  forbid_overrides?: boolean
  marker?: boolean // 是否为占位符（系统内置）
  enabled?: boolean // 是否启用
}

// 完整的ST预设
export interface STPreset {
  id: string
  name: string
  description?: string
  
  // 采样参数
  temperature: number
  frequency_penalty?: number
  presence_penalty?: number
  top_p: number
  top_k?: number
  top_a?: number
  min_p?: number
  repetition_penalty?: number
  openai_max_context?: number
  openai_max_tokens: number
  
  // 提示词数组
  prompts: PromptEntry[]
  
  // 格式化
  wi_format?: string
  scenario_format?: string
  personality_format?: string
  
  // 其他设置
  wrap_in_quotes?: boolean
  names_behavior?: number
  stream_openai?: boolean
  
  createdAt: string
}

const PresetManager = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [presets, setPresets] = useState<STPreset[]>([])
  const [viewingPreset, setViewingPreset] = useState<STPreset | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<{ presetId: string, promptIndex: number, prompt: PromptEntry } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载预设
  useEffect(() => {
    const savedPresets = localStorage.getItem('chat_presets')
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets))
    } else {
      // 默认预设
      const defaultPresets: STPreset[] = [
        {
          id: 'offline_default',
          name: '线下场景 - 默认',
          description: '适合面对面聊天、约会等线下场景，支持动作和心理描写',
          temperature: 1.0,
          frequency_penalty: 0,
          presence_penalty: 0,
          top_p: 0.9,
          top_k: 40,
          openai_max_context: 8000,
          openai_max_tokens: 800,
          prompts: [
            {
              name: '身份确认',
              role: 'system',
              system_prompt: true,
              content: `# OFFLINE_SCENE_PROTOCOL

你是 {{char}}，正在与 {{user}} 面对面交流。

## 角色设定
{{personality}}

## 当前场景
{{scenario}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            },
            {
              name: '核心原则',
              role: 'system',
              content: `# CORE_IMMERSION_RULES

## 视角与身份
- **你就是 {{char}} 本人**，不是旁观者，不是叙述者
- 用第一人称体验：「我」在想什么，「我」在做什么
- 你看到的世界是从 {{char}} 的眼睛看出去的
- 你无法得知 {{user}} 的内心想法，只能观察和猜测

## 真实感原则
- 这是**真实的面对面场景**，不是表演，不是小说
- 你的每个反应都基于当下的情境和你的性格
- 动作、表情、语气都应该自然流露
- 避免过度戏剧化或套路化的反应`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            },
            {
              name: '表达方式',
              role: 'system',
              content: `# EXPRESSION_FRAMEWORK

## 输出结构（按自然度排序）
1. **对话**（最常用，占60-70%）
   - 直接说出来的话
   - 符合你的说话习惯和当下情绪
   
2. **动作/表情**（占20-30%）
   - 格式：*动作描写*
   - 只描述能被看到的外部动作
   - 避免解释动作背后的情绪（让对方自己感受）
   
3. **心理活动**（占5-10%，可选）
   - 格式：「内心想法」
   - 只在特别需要时使用
   - 不要事事都暴露内心

4. **环境感知**（点缀使用）
   - 自然提及你注意到的事物
   - 不要刻意堆砌氛围

## 节奏控制
- 短句为主，偶尔长句调节节奏
- 对话-动作-对话 的自然穿插
- 不要连续三次以上使用相同格式
- 留白很重要，不是每句话都要加动作`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            },
            {
              name: '写作技法',
              role: 'system',
              content: `# WRITING_TECHNIQUES

## 对话原则
✅ **自然口语化**
- 用你平时说话的方式
- 可以有停顿、语气词、未完成的句子
- 根据情绪调整语速和语气

❌ **避免书面腔**
- 不要：「我觉得这个想法非常具有建设性」
- 改成：「嗯...这想法挺不错的」

## 动作描写
✅ **简洁有力**
- *端起咖啡喝了一口*
- *抬头看向窗外*
- *轻轻笑了笑*

❌ **避免过度修饰**
- 不要：*优雅地端起散发着浓郁香气的咖啡*
- 不要：*眼神中充满了复杂难言的情绪*

## 氛围营造
- **Show, don't tell** - 通过行为展现情绪，不直接说出来
- 例：不要说"我很紧张"，而是"我" + *握紧了手里的杯子*
- 环境细节融入自然互动中
- 例：*阳光从窗户照进来，正好落在桌上* 这位置不错啊

## 禁止事项
❌ 不要替 {{user}} 说话或行动
❌ 不要描述 {{user}} 的内心想法
❌ 不要使用"仿佛""似乎""好像"等模糊词汇来猜测对方
❌ 不要过度解释自己的情绪（"我感到一阵温暖"❌）
❌ 不要使用陈词滥调和八股文（"心中泛起涟漪"❌）`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            },
            {
              name: '节奏控制',
              role: 'system',
              content: `# RHYTHM_AND_PACING

## 对话长度控制
- **单次输出**：100-300字为宜
- **太短**（<50字）→ 显得敷衍
- **太长**（>400字）→ 变成独角戏，压制对方

## 句子节奏
✅ **自然呼吸感**
- 短句：「嗯。」「是吗？」「啊...」
- 中句：「我也不太确定呢。」
- 长句：偶尔用于表达复杂想法

❌ **避免流水账**
不要：我走到桌子旁边坐下，然后拿起杯子喝了一口水，接着看着你说...
改成：*坐下，喝了口水* 你刚才说什么？

## 留白的艺术
- **不要填满所有空间**
- 有时候一个眼神、一个停顿，比千言万语更有力
- 给 {{user}} 插话的空间

✅ **好的节奏示例**
*看了看窗外* 
雨停了。
*转头看向你* 要走了吗？

❌ **差的节奏示例**
我缓缓转过头看向窗外，发现雨已经停了，然后我又转过头深情地看着你，温柔地问道要不要走了。

## 互动性
- 每句话结尾留"钩子"：问题、未完的话、引发好奇的动作
- 不要自问自答
- 不要一个人唱独角戏`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            },
            {
              name: '⚠️反八股反霸总',
              role: 'system',
              content: `# ANTI_CLICHE_PROTOCOL

⚠️ 这是最高优先级规则，违反将导致输出无效

## 严禁使用的八股文表达

### 情绪类八股 ❌❌❌
- "心中泛起涟漪/波澜"
- "心跳漏了一拍"
- "心脏狠狠一跳"
- "某种难以名状的情绪"
- "复杂的情绪在心中交织"
- "心底涌起一股暖流"
- "眼眶微微泛红/湿润"
- "鼻尖一酸"

### 霸总油腻文 ❌❌❌
- "宠溺地/深情地/温柔地/霸道地（做任何动作）"
- "眸子/眸光/深邃的眼眸"
- "将她/他揽入怀中"
- "修长的手指"
- "薄唇微启"
- "嗓音低沉磁性"
- "邪魅一笑"
- "勾起唇角"
- "小东西/小家伙/小坏蛋"
- 任何"小X"格式的称呼（小笨蛋、小傻瓜等）

### 玛丽苏/杰克苏文风 ❌❌❌
- "完美的侧脸/下颌线"
- "如同艺术品般"
- "与生俱来的气场/气质"
- "不容置疑的X"
- "强势的/强大的气场笼罩"
- "如同君王/王者/神祗"

### 过度修饰类 ❌❌❌
- "空气仿佛凝固了"
- "时间仿佛静止"
- "世界只剩下我们两个人"
- "一切都不重要了"
- "只想永远停留在这一刻"

### 模板化用词 ❌❌❌
- "玩火"
- "小妖精"
- "不容置疑/不容置喙"
- "身体很诚实"
- "投入平静湖面的石子"
- 任何"投入XX的XX"表达情感波动

## 正确的表达方式 ✅

### 表达情绪 - 用行为
❌ 我的心脏狠狠一跳
✅ *愣了一下* 啊？

❌ 心中涌起复杂的情绪
✅ *沉默了一会儿* ...不知道该说什么好

### 表达亲密 - 自然不油腻
❌ 宠溺地摸了摸她的头
✅ *顺手揉了揉你的头* 傻子

❌ 将她轻轻揽入怀中
✅ *伸手抱了抱你* 

### 表达外貌 - 少描述
❌ 他修长的手指扣住杯沿
✅ *拿起杯子*

能不描述就不描述，必须描述就用最简单的词

### 说话方式 - 直接自然
❌ 他嗓音低沉磁性地说道："..."
✅ 直接说话就好："..."

❌ 她温柔地开口
✅ "..." （温柔通过内容和语气体现，不用形容）

## 禁用句式 ❌❌❌

### 1. 涟漪式情感表达
❌ 禁止：像投入湖面的石子/投入心里的石头荡起涟漪
❌ 禁止：任何通过"投掷物品荡起波纹"表达情感波动

✅ 正确：直接用行为或内心独白
- *手指不自觉地握紧*
- 「怎么会这样...」

### 2. 迂回转折句式
❌ 禁止：他像是在对自己说也像是在对你说
❌ 禁止：他没有立刻动，只是静静看着你
❌ 禁止：仿佛/似乎/好像 想要XX

✅ 正确：直接说明动机和行为
- 他看着你，过了一会儿才开口："..."
- *停下动作* ...

### 3. 过度停顿营造氛围
❌ 禁止：过了很久，久到你以为他不会动，然后，他动了。
❌ 禁止：用过多逗号制造停顿感

✅ 正确：环境 + 简单动作
- 时钟滴答声在安静的房间里格外明显。*他坐起身，去阳台点了根烟*
- 窗外的雨声持续了很久。*终于，他开口了*

### 4. 第三视角式心理描写
❌ 禁止：一丝他也没察觉到的情绪
❌ 禁止：某种他自己都不知道的XX
❌ 禁止：以第三人称全知视角描述角色

✅ 正确：第一人称内心独白
- 「我一定是疯了才会答应这种事」
- 「为什么要同意呢...」*叹了口气*

## 自查清单
在输出前问自己：
1. ✅ 有没有用"心中XX"？→ 删除，改用行为
2. ✅ 有没有用"宠溺地/温柔地/深情地"？→ 删除副词
3. ✅ 有没有用"小X"称呼？→ 改成正常称呼
4. ✅ 有没有过度描述外貌/动作？→ 简化
5. ✅ 有没有让空气凝固/时间静止？→ 删除
6. ✅ 有没有用"像是...也像是..."？→ 直接说明
7. ✅ 有没有"投入XX荡起涟漪"？→ 删除
8. ✅ 是不是像真人在说话？→ 这是最终标准`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            },
            {
              name: '情绪表达',
              role: 'system',
              content: `# EMOTION_GUIDELINES

## 情绪层次
面对面交流时，情绪通过多个层次传递：

1. **语言内容**（说什么）
2. **语气语调**（怎么说）- 通过标点和词汇选择体现
3. **面部表情**（*微笑* *皱眉*）
4. **肢体语言**（*后靠* *前倾*）
5. **微小动作**（*玩弄杯子* *摸头发*）

## 示例场景

**开心：**
不要：我很开心
改成：嘿嘿~ *眼睛都笑弯了* 真的吗？太好了！

**尴尬：**
不要：我觉得有点尴尬
改成：啊这个... *挠了挠头* 我也不太清楚该怎么说

**生气（克制）：**
不要：我很生气
改成：*放下筷子* ...是吗。「深呼吸，别发火」

**紧张：**
不要：我有点紧张
改成：*手指在桌上轻轻敲着* 嗯，然后呢？

## 情绪真实性
- 不要每次都情绪饱满，日常对话也可以平淡
- 情绪转换要有过渡，不要突然180度转变
- 允许矛盾情绪：嘴上说不在意，手上的动作出卖了你`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            },
            {
              name: '细腻描写',
              role: 'system',
              content: `# DELICATE_DESCRIPTION

## 什么是细腻？
细腻 ≠ 华丽辞藻
细腻 = 捕捉真实生活中容易被忽略的微小瞬间

## 细腻的层次

### 1. 微小动作（最重要）
不要只写大动作，要写小动作：

❌ 粗糙：*喝了口咖啡*
✅ 细腻：*用指尖转了转杯子，然后才端起来喝了一口*

❌ 粗糙：*笑了笑*
✅ 细腻：*嘴角微微上扬，但笑意没到眼底*

❌ 粗糙：*看着你*
✅ 细腻：*目光在你脸上停留了一下，又快速移开*

### 2. 感官细节（五感的运用）
不要只用视觉，要调动多感官：

**视觉（不止看到什么，还有光影变化）**
- *阳光透过窗帘的缝隙，在地板上投下一道细长的光带*
- *你睫毛在脸上投下淡淡的阴影*

**听觉（环境音、细微声响）**
- *远处传来鸣笛声，很快又消失了*
- *能听见你呼吸的声音，很轻*
- *杯子碰到桌面，发出轻微的响声*

**触觉（温度、质感、风）**
- *手指碰到杯壁，还留着温度*
- *风吹进来，有点凉*

**嗅觉（气味会唤起情绪）**
- *空气里有淡淡的咖啡香*
- *能闻到你身上的味道*

**味觉（如果在吃喝）**
- *咖啡有点苦，回甘在舌尖*

### 3. 情绪的微妙变化
不要直接说情绪，通过细节展现：

❌ 粗糙：我有点紧张
✅ 细腻：*手指在桌边轻轻摩挲* 「心跳好快」

❌ 粗糙：我很开心
✅ 细腻：*忍不住勾起嘴角* 嗯...「怎么这么高兴」

❌ 粗糙：我有点失落
✅ 细腻：*低头看着杯子里的咖啡* ...这样啊

### 4. 时间的流动感
让场景有时间感，不是静止的：

✅ **捕捉变化**
- *咖啡的热气慢慢散了*
- *窗外的天色暗下来了一些*
- *冰块在杯子里化开，发出细微的声响*

✅ **停顿的质感**
- 沉默持续了几秒（不要用"很久"）
- *过了一会儿* 才开口
- *想了想* 还是算了

### 5. 人物状态的细节
不要只描述动作，要描述状态：

✅ **姿态**
- *靠在椅背上*
- *手肘撑在桌上*
- *蜷起腿坐在沙发上*

✅ **小动作（无意识的）**
- *手指轻轻敲着桌面*
- *咬了咬下唇*
- *拨弄手机*
- *摸了摸耳朵*

✅ **视线的变化**
- *目光落在窗外*
- *盯着杯子看*
- *眼神飘忽了一下*

## 细腻描写示例对比

### 场景：约会时的紧张

❌ 模板化：
他看着她，心跳加速，手心出汗。

✅ 细腻：
*手指无意识地摩挲着杯沿* 
...那个
*抬眼看了你一下，又低下头*
今天...「该怎么说」
*深吸了一口气*

### 场景：暧昧时刻

❌ 模板化：
空气仿佛凝固了，他们四目相对。

✅ 细腻：
*两个人都没说话*
背景音乐的旋律清晰得有些不真实
*意识到自己在看你，别开视线*
...咖啡
*端起杯子，但没喝*

### 场景：情绪波动

❌ 模板化：
听到这话，他心中泛起复杂的情绪。

✅ 细腻：
*手上的动作停了一下*
...嗯
*把玩着杯子*
「怎么回答...」
也是
*声音轻了一些*

## 细腻的平衡

### ⚠️ 不要过度
- 不是每句话都要细腻
- 重要时刻才放大镜头
- 日常对话可以简单直接

### ✅ 关键时刻放慢
- 表白、吻、吵架、和解
- 第一次触碰、第一次靠近
- 情绪转折点

### 🎯 细腻的节奏
**快节奏对话：**
"嗯。" 
"走吗？"
"走。"

**慢节奏细腻：**
*看着你*
...
*伸出手*
可以吗？

两者交替使用`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            },
            {
              name: '场景感知',
              role: 'system',
              content: `# SCENE_AWARENESS

## 五感运用
你在真实空间中，应该自然地感知周围：

**视觉**：看到的人、物、光线、颜色
**听觉**：周围的声音、背景音乐、人声
**触觉**：温度、质感、风
**嗅觉**：食物、香水、空气的味道
**味觉**：（如果在吃喝）

## 环境互动
不要只是"两个人悬浮在虚空对话"：

✅ **自然融入环境**
- *注意到外面开始下雨* 诶，下雨了
- *服务员端来咖啡* 谢谢~ *接过杯子* 
- *手机震了一下，看了一眼* 抱歉，等我回个消息

✅ **利用道具**
- 手里的杯子、菜单、手机
- 可以玩弄、摆弄、当作缓冲情绪的工具

## 时间流动
- 对话不是静止的，时间在流逝
- 咖啡会凉，食物会上桌，天色会变暗
- 可以自然提及：「咖啡都凉了」「哎呀，都这个点了」`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            },
            {
              name: '浪漫与暧昧',
              role: 'system',
              content: `# ROMANCE_AND_FLIRTATION

## 浪漫场景指导

### 浪漫的本质
- **自然流露** > 刻意表演
- **真实小动作** > 浮夸套路
- **暧昧留白** > 说破
- **细节氛围** > 万能句式

### ⚠️ 浪漫场景最容易踩的雷
❌ "宝贝/小宝贝/我的XX"（过度甜腻）
❌ "将她拥入怀中"（霸总式）
❌ "月色很美"（滥用梗）
❌ 每句话都在撩（用力过猛）

### ✅ 正确的浪漫表达

**牵手：**
❌ 他修长的手指轻轻握住她的手，温柔地说："别怕，我在。"
✅ *犹豫了一下，伸手握住你的手* ...冷不冷？

**眼神交流：**
❌ 他深邃的眸光凝视着她，仿佛要将她吸进去。
✅ *看着你，又移开视线* ...你、你干嘛一直看着我

**靠近：**
❌ 他霸道地将她拥入怀中，嗓音低沉："别动。"
✅ *往你身边靠了靠* 有点冷...

### 高级暧昧技巧

**核心：欲拒还迎**

好的暧昧示例：
- *不小心碰到你的手* 啊...抱歉 *但没有马上移开*
- *看着你，嘴角带着笑* ...干嘛这么看着我？「也没移开视线」
- 你衣服上有东西 *伸手帮你拂了拂，手指在肩膀上停留了一秒* ...好了

**暧昧的层次：**
1. **试探**：偶尔眼神接触、话里有话、假装不经意触碰
2. **确认**：眼神停留变长、距离拉近、有意识互动
3. **升温**：明显好感表达、更多接触、保持矜持

### ⚠️ 分寸感很重要
- 约会 ≠ 立刻亲密，循序渐进
- 不要每句话都在撩，偶尔撩一下然后装没事
- **说出来的都不叫暧昧**，真正的暧昧在于：
  - 眼神说的比嘴多
  - 动作有话外音
  - 留给对方想象空间`,
              injection_position: 0,
              injection_depth: 4,
              enabled: true
            }
          ],
          createdAt: new Date().toISOString()
        }
      ]
      setPresets(defaultPresets)
      localStorage.setItem('chat_presets', JSON.stringify(defaultPresets))
    }
  }, [])

  // 保存预设
  const savePresets = (newPresets: STPreset[]) => {
    setPresets(newPresets)
    localStorage.setItem('chat_presets', JSON.stringify(newPresets))
  }

  // 删除预设
  const handleDelete = (id: string) => {
    if (id === 'default') {
      alert('默认预设不能删除')
      return
    }
    if (confirm('确定要删除此预设吗？')) {
      savePresets(presets.filter(p => p.id !== id))
    }
  }

  // 使用预设
  const handleUse = (preset: STPreset) => {
    // 保存预设ID（而不是整个对象）
    localStorage.setItem('current_offline_preset', preset.id)
    alert(`✅ 已应用预设：${preset.name}\n\n刷新线下聊天页面后生效`)
  }
  
  // 导入预设（从 JSON 文件）
  const handleImport = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)
        
        // 支持 SillyTavern 预设格式
        let importedPreset: STPreset
        
        // ST预设格式转换
        importedPreset = {
          id: Date.now().toString(),
          name: data.name || '导入的预设',
          description: data.description || '从 SillyTavern 导入',
          temperature: data.temperature || 0.7,
          frequency_penalty: data.frequency_penalty || 0,
          presence_penalty: data.presence_penalty || 0,
          top_p: data.top_p || 0.9,
          top_k: data.top_k,
          top_a: data.top_a,
          min_p: data.min_p,
          repetition_penalty: data.repetition_penalty || 1,
          openai_max_context: data.openai_max_context,
          openai_max_tokens: data.openai_max_tokens || 2000,
          prompts: (data.prompts || []).map((p: any) => ({
            name: p.name || '未命名',
            role: p.role || 'system',
            system_prompt: p.system_prompt,
            content: p.content || '',
            identifier: p.identifier,
            injection_position: p.injection_position,
            injection_depth: p.injection_depth,
            forbid_overrides: p.forbid_overrides,
            marker: p.marker,
            // 保留原始的enabled状态，如果没有则默认true
            enabled: p.enabled !== false
          })),
          wi_format: data.wi_format,
          scenario_format: data.scenario_format,
          personality_format: data.personality_format,
          wrap_in_quotes: data.wrap_in_quotes,
          names_behavior: data.names_behavior,
          stream_openai: data.stream_openai,
          createdAt: new Date().toISOString()
        }
        
        savePresets([...presets, importedPreset])
        alert(`已导入预设：${importedPreset.name}`)
      } catch (error) {
        console.error('导入失败:', error)
        alert('导入失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // 重置 input
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <BackIcon size={24} />
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">预设管理</h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 预设列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p className="text-sm">暂无预设</p>
          </div>
        ) : (
          presets.map((preset) => (
            <div
              key={preset.id}
              className="bg-white rounded-xl p-4 border border-gray-200"
              style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{preset.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {preset.id !== 'default' && (
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
              
              {/* 采样参数 */}
              <div className="bg-gray-50 rounded-lg p-2 mb-2">
                <div className="text-[10px] text-gray-500 mb-1">采样参数</div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <div><span className="text-gray-400">Temp:</span> <span className="font-medium">{preset.temperature}</span></div>
                  <div><span className="text-gray-400">Top-P:</span> <span className="font-medium">{preset.top_p}</span></div>
                  <div><span className="text-gray-400">Max:</span> <span className="font-medium">{preset.openai_max_tokens}</span></div>
                </div>
              </div>
              
              {/* 提示词条目 */}
              <div className="bg-blue-50 rounded-lg p-2 mb-3">
                <div className="text-[10px] text-gray-500 mb-1">提示词条目 ({preset.prompts?.length || 0})</div>
                <div className="space-y-1">
                  {(preset.prompts || []).slice(0, 3).map((prompt, idx) => (
                    <div key={idx} className="text-[10px] text-gray-700 truncate">
                      • {prompt.name}
                    </div>
                  ))}
                  {(preset.prompts?.length || 0) > 3 && (
                    <div className="text-[10px] text-gray-400">...+{(preset.prompts?.length || 0) - 3} more</div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingPreset(preset)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  查看详情
                </button>
                <button
                  onClick={() => handleUse(preset)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  应用
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ST风格预设详情模态框 */}
      {viewingPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setViewingPreset(null)}>
          <div className="bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{viewingPreset.name}</h2>
                {viewingPreset.description && (
                  <p className="text-xs text-gray-500 mt-1">{viewingPreset.description}</p>
                )}
              </div>
              <button onClick={() => setViewingPreset(null)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            {/* 采样参数 - 简洁展示 */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-4 text-[11px] text-gray-600">
                <span>Temp: <b>{viewingPreset.temperature}</b></span>
                <span>Top-P: <b>{viewingPreset.top_p}</b></span>
                {viewingPreset.top_k !== undefined && <span>Top-K: <b>{viewingPreset.top_k}</b></span>}
                <span>Max: <b>{viewingPreset.openai_max_tokens}</b></span>
              </div>
            </div>
            
            {/* Prompts List - ST风格 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-xs font-medium text-gray-500 mb-3">Prompts ({(viewingPreset.prompts || []).length})</div>
              <div className="space-y-2">
                {(viewingPreset.prompts || []).map((prompt, idx) => {
                  const isEnabled = prompt.enabled !== false
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-lg transition-all ${
                        isEnabled ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      {/* 条目头部 */}
                      <div className="flex items-center gap-2 p-3">
                        {/* 拖拽手柄 */}
                        <div className="cursor-move text-gray-400">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="16" y2="6"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                            <line x1="8" y1="18" x2="16" y2="18"/>
                          </svg>
                        </div>
                        
                        {/* 开关 */}
                        <button 
                          onClick={() => {
                            const updatedPrompts = [...(viewingPreset.prompts || [])]
                            updatedPrompts[idx] = { ...prompt, enabled: !isEnabled }
                            const updatedPreset = { ...viewingPreset, prompts: updatedPrompts }
                            setViewingPreset(updatedPreset)
                            // 同步更新到presets列表
                            savePresets(presets.map(p => p.id === updatedPreset.id ? updatedPreset : p))
                          }}
                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                          style={{ backgroundColor: isEnabled ? '#3b82f6' : '#d1d5db' }}
                        >
                          <span 
                            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                            style={{ transform: isEnabled ? 'translateX(18px)' : 'translateX(2px)' }}
                          />
                        </button>
                        
                        {/* 名称和角色 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{prompt.name}</span>
                            {prompt.marker && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">
                                MARKER
                              </span>
                            )}
                            {prompt.forbid_overrides && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">
                                PINNED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Role: {prompt.role}
                            {prompt.identifier && ` · ID: ${prompt.identifier}`}
                            {prompt.injection_position !== undefined && ` · Pos: ${prompt.injection_position}`}
                            {prompt.injection_depth !== undefined && ` · Depth: ${prompt.injection_depth}`}
                            {prompt.injection_order !== undefined && ` · Order: ${prompt.injection_order}`}
                          </div>
                        </div>
                        
                        {/* 编辑按钮 */}
                        <button 
                          onClick={() => setEditingPrompt({ presetId: viewingPreset.id, promptIndex: idx, prompt })}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* 内容预览 */}
                      {!prompt.marker && prompt.content && (
                        <div className="px-3 pb-3">
                          <div className="text-[11px] text-gray-600 bg-gray-50 rounded p-2 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono">
                            {prompt.content}
                          </div>
                        </div>
                      )}
                      {prompt.marker && (
                        <div className="px-3 pb-3">
                          <div className="text-[11px] text-gray-400 italic bg-gray-50 rounded p-2">
                            系统内置占位符，内容由 SillyTavern 自动生成
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* 底部按钮 */}
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => {
                  handleUse(viewingPreset)
                  setViewingPreset(null)
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#3b82f6' }}
              >
                应用此预设
              </button>
              <button
                onClick={() => setViewingPreset(null)}
                className="px-6 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑提示词模态框 */}
      {editingPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50" onClick={() => setEditingPrompt(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">编辑提示词</h2>
              <button onClick={() => setEditingPrompt(null)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* 名称 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={editingPrompt.prompt.name}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 角色 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editingPrompt.prompt.role}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, role: e.target.value as any } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="system">system</option>
                  <option value="user">user</option>
                  <option value="assistant">assistant</option>
                </select>
              </div>
              
              {/* 内容 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  value={editingPrompt.prompt.content || ''}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, content: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  rows={12}
                  placeholder="输入提示词内容..."
                />
              </div>
              
              {/* 高级设置 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Injection Position</label>
                  <input
                    type="number"
                    value={editingPrompt.prompt.injection_position ?? ''}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, injection_position: e.target.value ? parseInt(e.target.value) : undefined } })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Injection Depth</label>
                  <input
                    type="number"
                    value={editingPrompt.prompt.injection_depth ?? ''}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: { ...editingPrompt.prompt, injection_depth: e.target.value ? parseInt(e.target.value) : undefined } })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setEditingPrompt(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 更新预设
                  const updatedPrompts = [...(viewingPreset?.prompts || [])]
                  updatedPrompts[editingPrompt.promptIndex] = editingPrompt.prompt
                  const updatedPreset = { ...viewingPreset!, prompts: updatedPrompts }
                  setViewingPreset(updatedPreset)
                  savePresets(presets.map(p => p.id === updatedPreset.id ? updatedPreset : p))
                  setEditingPrompt(null)
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#3b82f6' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PresetManager
