/**
 * 聊天弹窗状态管理 Hook
 */

import { useState, useCallback } from 'react'
import { Message, MusicInfo } from '../types'
import { RedEnvelope } from '../../../context/RedEnvelopeContext'

export const useChatModals = () => {
  // 菜单
  const [showMenu, setShowMenu] = useState(false)
  
  // 音乐详情
  const [showMusicDetail, setShowMusicDetail] = useState(false)
  const [selectedMusic, setSelectedMusic] = useState<MusicInfo | null>(null)
  
  // 红包
  const [showRedEnvelopeSender, setShowRedEnvelopeSender] = useState(false)
  const [showRedEnvelopeDetail, setShowRedEnvelopeDetail] = useState(false)
  const [selectedRedEnvelope, setSelectedRedEnvelope] = useState<RedEnvelope | null>(null)
  const [canClaimRedEnvelope, setCanClaimRedEnvelope] = useState(false)
  
  // 转账
  const [showTransferSender, setShowTransferSender] = useState(false)
  
  // 亲密付
  const [showIntimatePaySender, setShowIntimatePaySender] = useState(false)
  
  // 情侣空间
  const [showCoupleSpaceInviteSender, setShowCoupleSpaceInviteSender] = useState(false)
  const [showCoupleSpaceContentModal, setShowCoupleSpaceContentModal] = useState(false)
  const [coupleSpaceContentType, setCoupleSpaceContentType] = useState<'photo' | 'message' | 'anniversary' | null>(null)
  
  // 音乐邀请
  const [showMusicInviteSelector, setShowMusicInviteSelector] = useState(false)
  
  // 表情面板
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  
  // 拍照
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraDescription, setCameraDescription] = useState('')
  
  // 语音
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [showVoiceTextMap, setShowVoiceTextMap] = useState<Record<number, boolean>>({})
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null)
  
  // 位置
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [selectedLocationMsg, setSelectedLocationMsg] = useState<Message | null>(null)
  
  // 小红书
  const [showXiaohongshuSelector, setShowXiaohongshuSelector] = useState(false)
  const [showXiaohongshuInput, setShowXiaohongshuInput] = useState(false)
  
  // 来电
  const [showIncomingCall, setShowIncomingCall] = useState(false)
  const [incomingCallIsVideo, setIncomingCallIsVideo] = useState(false)
  
  // 消息菜单
  const [longPressedMessage, setLongPressedMessage] = useState<Message | null>(null)
  const [showMessageMenu, setShowMessageMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  
  // 引用消息
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null)
  
  // 撤回消息
  const [viewingRecalledMessage, setViewingRecalledMessage] = useState<Message | null>(null)
  const [showRecallReasonModal, setShowRecallReasonModal] = useState(false)
  const [recallReason, setRecallReason] = useState('')
  const [messageToRecall, setMessageToRecall] = useState<Message | null>(null)
  
  // 批量删除
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<number>>(new Set())
  
  // 通话详情
  const [expandedCallId, setExpandedCallId] = useState<number | null>(null)
  
  // 角色状态
  const [showStatusModal, setShowStatusModal] = useState(false)
  
  // 编辑消息
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editingContent, setEditingContent] = useState('')
  
  // Token 统计
  const [showTokenDetail, setShowTokenDetail] = useState(false)
  
  // 打开音乐详情
  const openMusicDetail = useCallback((music: MusicInfo) => {
    setSelectedMusic(music)
    setShowMusicDetail(true)
  }, [])
  
  // 关闭音乐详情
  const closeMusicDetail = useCallback(() => {
    setShowMusicDetail(false)
    setSelectedMusic(null)
  }, [])
  
  // 打开红包详情
  const openRedEnvelopeDetail = useCallback((redEnvelope: RedEnvelope, canClaim: boolean) => {
    setSelectedRedEnvelope(redEnvelope)
    setCanClaimRedEnvelope(canClaim)
    setShowRedEnvelopeDetail(true)
  }, [])
  
  // 关闭红包详情
  const closeRedEnvelopeDetail = useCallback(() => {
    setShowRedEnvelopeDetail(false)
    setSelectedRedEnvelope(null)
    setCanClaimRedEnvelope(false)
  }, [])
  
  // 打开消息菜单
  const openMessageMenu = useCallback((message: Message, x: number, y: number) => {
    setLongPressedMessage(message)
    setMenuPosition({ x, y })
    setShowMessageMenu(true)
  }, [])
  
  // 关闭消息菜单
  const closeMessageMenu = useCallback(() => {
    setShowMessageMenu(false)
    setLongPressedMessage(null)
  }, [])
  
  // 开始编辑消息
  const startEditMessage = useCallback((message: Message) => {
    setEditingMessage(message)
    setEditingContent(message.content)
  }, [])
  
  // 取消编辑消息
  const cancelEditMessage = useCallback(() => {
    setEditingMessage(null)
    setEditingContent('')
  }, [])
  
  // 切换批量删除模式
  const toggleBatchDeleteMode = useCallback(() => {
    setIsBatchDeleteMode(prev => !prev)
    setSelectedMessageIds(new Set())
  }, [])
  
  // 切换消息选中状态
  const toggleMessageSelection = useCallback((messageId: number) => {
    setSelectedMessageIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }, [])
  
  // 清空选中的消息
  const clearMessageSelection = useCallback(() => {
    setSelectedMessageIds(new Set())
  }, [])
  
  return {
    // 状态
    showMenu, setShowMenu,
    showMusicDetail, selectedMusic,
    showRedEnvelopeSender, setShowRedEnvelopeSender,
    showRedEnvelopeDetail, selectedRedEnvelope, canClaimRedEnvelope,
    showTransferSender, setShowTransferSender,
    showIntimatePaySender, setShowIntimatePaySender,
    showCoupleSpaceInviteSender, setShowCoupleSpaceInviteSender,
    showCoupleSpaceContentModal, setShowCoupleSpaceContentModal,
    coupleSpaceContentType, setCoupleSpaceContentType,
    showMusicInviteSelector, setShowMusicInviteSelector,
    showEmojiPanel, setShowEmojiPanel,
    showCameraModal, setShowCameraModal,
    cameraDescription, setCameraDescription,
    showVoiceModal, setShowVoiceModal,
    voiceText, setVoiceText,
    showVoiceTextMap, setShowVoiceTextMap,
    playingVoiceId, setPlayingVoiceId,
    showLocationModal, setShowLocationModal,
    locationName, setLocationName,
    locationAddress, setLocationAddress,
    selectedLocationMsg, setSelectedLocationMsg,
    showXiaohongshuSelector, setShowXiaohongshuSelector,
    showXiaohongshuInput, setShowXiaohongshuInput,
    showIncomingCall, setShowIncomingCall,
    incomingCallIsVideo, setIncomingCallIsVideo,
    longPressedMessage, showMessageMenu, menuPosition,
    quotedMessage, setQuotedMessage,
    viewingRecalledMessage, setViewingRecalledMessage,
    showRecallReasonModal, setShowRecallReasonModal,
    recallReason, setRecallReason,
    messageToRecall, setMessageToRecall,
    isBatchDeleteMode, selectedMessageIds,
    expandedCallId, setExpandedCallId,
    showStatusModal, setShowStatusModal,
    editingMessage, editingContent, setEditingContent,
    showTokenDetail, setShowTokenDetail,
    
    // 方法
    openMusicDetail,
    closeMusicDetail,
    openRedEnvelopeDetail,
    closeRedEnvelopeDetail,
    openMessageMenu,
    closeMessageMenu,
    startEditMessage,
    cancelEditMessage,
    toggleBatchDeleteMode,
    toggleMessageSelection,
    clearMessageSelection
  }
}

