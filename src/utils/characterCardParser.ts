/**
 * Character Card V2/V3 解析工具
 * 用于从 PNG 图片中提取嵌入的角色卡数据
 * 兼容 SillyTavern 和其他酒馆客户端的角色卡格式
 */

// Character Card V2 规范
export interface CharacterCardV2 {
  spec: 'chara_card_v2'
  spec_version: '2.0' | '3.0'
  data: {
    name: string
    description: string
    personality: string
    scenario: string
    first_mes: string
    mes_example: string
    
    // V2 扩展字段
    creator_notes?: string
    system_prompt?: string
    post_history_instructions?: string
    alternate_greetings?: string[]
    tags?: string[]
    creator?: string
    character_version?: string
    
    // Lorebook (世界书)
    character_book?: {
      name?: string
      description?: string
      scan_depth?: number
      token_budget?: number
      recursive_scanning?: boolean
      extensions?: Record<string, any>
      entries: Array<{
        keys: string[]
        content: string
        extensions?: Record<string, any>
        enabled: boolean
        insertion_order: number
        case_sensitive?: boolean
        name?: string
        priority?: number
        id?: number
        comment?: string
        selective?: boolean
        secondary_keys?: string[]
        constant?: boolean
        position?: 'before_char' | 'after_char'
      }>
    }
    
    // 其他扩展
    extensions?: Record<string, any>
  }
}

// 旧版 Character Card V1
interface CharacterCardV1 {
  name: string
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
  [key: string]: any
}

/**
 * 从 PNG 文件中提取 Character Card 数据
 */
export async function extractCharacterCardFromPNG(file: File): Promise<CharacterCardV2 | CharacterCardV1 | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        if (!arrayBuffer) {
          reject(new Error('文件读取失败'))
          return
        }
        
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // 检查 PNG 签名
        if (!isPNG(uint8Array)) {
          reject(new Error('不是有效的 PNG 文件'))
          return
        }
        
        // 查找 tEXt chunk 中的 'chara' 字段
        const charaData = extractTextChunk(uint8Array, 'chara')
        
        if (charaData) {
          try {
            // Base64 解码
            const jsonString = atob(charaData)
            const characterData = JSON.parse(jsonString)
            
            // 验证基本结构
            if (!characterData || typeof characterData !== 'object') {
              reject(new Error('Character Card 数据格式无效'))
              return
            }
            
            // 检测版本
            if (characterData.spec === 'chara_card_v2') {
              // 验证 V2 格式
              if (!characterData.data || typeof characterData.data !== 'object') {
                reject(new Error('Character Card V2 格式错误'))
                return
              }
              resolve(characterData as CharacterCardV2)
            } else {
              // 旧版格式 - 验证必要字段
              if (!characterData.name) {
                reject(new Error('Character Card V1 缺少必要字段'))
                return
              }
              resolve(characterData as CharacterCardV1)
            }
          } catch (error) {
            console.error('解析 Character Card 失败:', error)
            if (error instanceof Error && error.message.includes('Character Card')) {
              reject(error)
            } else {
              reject(new Error('Character Card 数据格式错误或已损坏'))
            }
          }
        } else {
          reject(new Error('PNG 中未找到 Character Card 数据\n\n提示：请确保这是从 SillyTavern 等酒馆客户端导出的角色卡'))
        }
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 检查是否为 PNG 文件
 */
function isPNG(uint8Array: Uint8Array): boolean {
  // PNG 签名: 89 50 4E 47 0D 0A 1A 0A
  return (
    uint8Array[0] === 0x89 &&
    uint8Array[1] === 0x50 &&
    uint8Array[2] === 0x4e &&
    uint8Array[3] === 0x47 &&
    uint8Array[4] === 0x0d &&
    uint8Array[5] === 0x0a &&
    uint8Array[6] === 0x1a &&
    uint8Array[7] === 0x0a
  )
}

/**
 * 从 PNG 中提取指定的 tEXt chunk
 */
function extractTextChunk(uint8Array: Uint8Array, keyword: string): string | null {
  let offset = 8 // 跳过 PNG 签名
  
  while (offset < uint8Array.length) {
    // 读取 chunk 长度（4 字节，大端序）
    const length = readUint32BE(uint8Array, offset)
    offset += 4
    
    // 读取 chunk 类型（4 字节）
    const type = String.fromCharCode(...uint8Array.slice(offset, offset + 4))
    offset += 4
    
    // 如果是 tEXt chunk
    if (type === 'tEXt') {
      const chunkData = uint8Array.slice(offset, offset + length)
      
      // 查找 null 分隔符
      const nullIndex = chunkData.indexOf(0)
      if (nullIndex !== -1) {
        const key = String.fromCharCode(...chunkData.slice(0, nullIndex))
        
        if (key === keyword) {
          // 找到了！提取数据
          const value = String.fromCharCode(...chunkData.slice(nullIndex + 1))
          return value
        }
      }
    }
    
    // 跳过 chunk 数据和 CRC（4 字节）
    offset += length + 4
    
    // 如果遇到 IEND chunk，停止
    if (type === 'IEND') break
  }
  
  return null
}

/**
 * 读取 32 位大端序整数
 */
function readUint32BE(uint8Array: Uint8Array, offset: number): number {
  return (
    (uint8Array[offset] << 24) |
    (uint8Array[offset + 1] << 16) |
    (uint8Array[offset + 2] << 8) |
    uint8Array[offset + 3]
  )
}

/**
 * 将 Character Card 转换为应用内部格式
 */
export function convertCharacterCardToInternal(
  card: CharacterCardV2 | CharacterCardV1,
  imageDataUrl: string
): {
  name: string
  username: string
  avatar: string
  signature: string
  description: string
  personality?: string
  scenario?: string
  firstMessage?: string
  exampleMessages?: string
  systemPrompt?: string
  characterBook?: any
  alternateGreetings?: string[]
  tags?: string[]
  creator?: string
} {
  // 检测是否为 V2 格式
  const isV2 = 'spec' in card && card.spec === 'chara_card_v2'
  const data = isV2 ? (card as CharacterCardV2).data : (card as CharacterCardV1)
  
  // 验证必要字段
  if (!data.name || !data.name.trim()) {
    throw new Error('Character Card 缺少角色名称')
  }
  
  // 构建完整描述（合并多个字段）
  const fullDescription = [
    data.description,
    data.personality ? `\n\n【性格】\n${data.personality}` : '',
    data.scenario ? `\n\n【场景】\n${data.scenario}` : '',
  ].filter(Boolean).join('').trim()
  
  return {
    name: data.name.trim(),
    username: `wxid_${Date.now().toString().slice(-8)}`, // 自动生成
    avatar: imageDataUrl, // 使用 PNG 本身作为头像
    signature: data.personality?.slice(0, 100) || '来自 Character Card',
    description: fullDescription || '这个角色还没有描述',
    personality: data.personality,
    scenario: data.scenario,
    firstMessage: data.first_mes,
    exampleMessages: data.mes_example,
    systemPrompt: 'system_prompt' in data ? data.system_prompt : undefined,
    characterBook: 'character_book' in data ? data.character_book : undefined,
    alternateGreetings: 'alternate_greetings' in data ? data.alternate_greetings : undefined,
    tags: 'tags' in data ? data.tags : undefined,
    creator: 'creator' in data ? data.creator : undefined,
  }
}
