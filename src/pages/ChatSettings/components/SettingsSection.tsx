/**
 * 设置区块组件
 * 通用的设置区块容器
 */

import React from 'react'

interface SettingsSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg ${className}`}>
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      {children}
    </div>
  )
}

