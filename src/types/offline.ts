/**
 * 线下聊天相关类型定义
 * 用于SillyTavern风格的线下聊天应用
 */

// ==================== 消息类型 ====================

/**
 * 单条聊天消息
 */
export interface ChatMessage {
  id: string                    // 消息唯一ID
  role: 'user' | 'assistant'    // 消息角色
  content: string               // 当前显示的内容
  timestamp: number             // 时间戳
  
  // Swipe功能：多个回复选项
  swipes?: string[]             // 所有回复选项（包括当前content）
  currentSwipeIndex?: number    // 当前显示的是第几个回复
  
  // 状态标记
  isRegenerating?: boolean      // 是否正在重新生成
  isEditing?: boolean           // 是否正在编辑
}

// ==================== 聊天会话类型 ====================

/**
 * 完整的聊天会话
 */
export interface ChatSession {
  id: string                    // 会话ID
  characterId: string           // 角色ID
  presetId: string              // 使用的预设ID
  messages: ChatMessage[]       // 消息列表
  createdAt: string            // 创建时间
  updatedAt: string            // 更新时间
  
  // 开场白相关
  greetingIndex: number         // 当前使用的开场白索引
  greetingSwipes?: string[]     // 开场白的所有选项
}

// ==================== Token统计类型 ====================

/**
 * Token使用统计
 */
export interface TokenStats {
  total: number                 // 总Token数
  remaining: number             // 剩余Token数
  percentage: number            // 使用百分比
  systemPrompt: number          // 系统提示词Token数
  lorebook: number              // 世界书Token数
  messages: number              // 消息Token数
}

// ==================== UI状态类型 ====================

/**
 * 聊天界面状态
 */
export interface ChatUIState {
  isLoading: boolean            // 是否正在加载
  editingMessageId: string | null  // 正在编辑的消息ID
  showPresetSelect: boolean     // 是否显示预设选择
  showCharacterSelect: boolean  // 是否显示角色选择
  showGreetingSelect: boolean   // 是否显示开场白选择
}
