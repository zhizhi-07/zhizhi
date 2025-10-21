import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { initAccountingAssistant } from '../utils/accountingAssistant'

// 这个页面只是一个跳转页面，会自动跳转到记账助手的聊天页面
const AccountingChat = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // 初始化记账助手角色
    initAccountingAssistant()
    
    // 跳转到记账助手的聊天页面
    navigate('/chat/accounting_assistant', { replace: true })
  }, [navigate])

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-4">💰</div>
        <p className="text-gray-600">正在打开记账助手...</p>
      </div>
    </div>
  )
}

export default AccountingChat
