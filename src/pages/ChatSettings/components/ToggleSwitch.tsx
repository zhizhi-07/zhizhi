/**
 * 开关组件
 * 通用的开关按钮
 */

import React from 'react'

interface ToggleSwitchProps {
  label: string
  checked: boolean
  onChange: () => void
  description?: string
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
  description
}) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="text-gray-800 font-medium">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 mt-1">{description}</div>
        )}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

