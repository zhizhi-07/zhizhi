/**
 * 滑块设置组件
 * 用于数值调整
 */

import React from 'react'

interface SliderSettingProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  unit?: string
  description?: string
}

export const SliderSetting: React.FC<SliderSettingProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  description
}) => {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-800 font-medium">{label}</div>
        <div className="text-blue-500 font-semibold">
          {value}{unit}
        </div>
      </div>
      {description && (
        <div className="text-sm text-gray-500 mb-2">{description}</div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

