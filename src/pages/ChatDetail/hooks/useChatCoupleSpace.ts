/**
 * 情侣空间功能 Hook
 */

import { useState, useCallback } from 'react'

export const useChatCoupleSpace = () => {
  // 情侣空间邀请发送器
  const [showCoupleSpaceInviteSender, setShowCoupleSpaceInviteSender] = useState(false)
  
  // 情侣空间内容弹窗
  const [showCoupleSpaceContentModal, setShowCoupleSpaceContentModal] = useState(false)
  const [coupleSpaceContentType, setCoupleSpaceContentType] = useState<'photo' | 'message' | 'anniversary' | null>(null)
  
  // 情侣空间内容表单数据
  const [couplePhotoDescription, setCouplePhotoDescription] = useState('')
  const [couplePhotoFiles, setCouplePhotoFiles] = useState<string[]>([])
  const [coupleMessageContent, setCoupleMessageContent] = useState('')
  const [anniversaryDate, setAnniversaryDate] = useState('')
  const [anniversaryTitle, setAnniversaryTitle] = useState('')
  const [anniversaryDescription, setAnniversaryDescription] = useState('')
  
  // 打开情侣空间内容弹窗
  const openCoupleSpaceContent = useCallback((type: 'photo' | 'message' | 'anniversary') => {
    setCoupleSpaceContentType(type)
    setShowCoupleSpaceContentModal(true)
  }, [])
  
  // 关闭情侣空间内容弹窗
  const closeCoupleSpaceContent = useCallback(() => {
    setShowCoupleSpaceContentModal(false)
    setCoupleSpaceContentType(null)
    // 清空表单数据
    setCouplePhotoDescription('')
    setCouplePhotoFiles([])
    setCoupleMessageContent('')
    setAnniversaryDate('')
    setAnniversaryTitle('')
    setAnniversaryDescription('')
  }, [])
  
  return {
    // 邀请
    showCoupleSpaceInviteSender,
    setShowCoupleSpaceInviteSender,
    
    // 内容弹窗
    showCoupleSpaceContentModal,
    coupleSpaceContentType,
    openCoupleSpaceContent,
    closeCoupleSpaceContent,
    
    // 表单数据
    couplePhotoDescription,
    setCouplePhotoDescription,
    couplePhotoFiles,
    setCouplePhotoFiles,
    coupleMessageContent,
    setCoupleMessageContent,
    anniversaryDate,
    setAnniversaryDate,
    anniversaryTitle,
    setAnniversaryTitle,
    anniversaryDescription,
    setAnniversaryDescription
  }
}

