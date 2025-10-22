import React, { useState } from 'react';
import { ScheduleSettings } from './ScheduleSettings';

/**
 * 定时消息设置按钮组件
 * 可以放在任何地方，点击后打开设置弹窗
 */
export const SettingsButton: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* 设置按钮 */}
      <button
        onClick={() => setShowSettings(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        title="定时消息设置"
      >
        <span>⏰</span>
        <span>定时设置</span>
      </button>

      {/* 设置弹窗 */}
      {showSettings && (
        <ScheduleSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

/**
 * 简化版：只有图标按钮
 */
export const SettingsIconButton: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        title="定时消息设置"
      >
        ⏰
      </button>

      {showSettings && (
        <ScheduleSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

/**
 * 列表项版本：适合放在设置列表中
 */
export const SettingsListItem: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowSettings(true)}
        className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⏰</span>
          <div>
            <div className="font-medium">定时消息</div>
            <div className="text-sm text-gray-500">设置 AI 主动发消息的时间</div>
          </div>
        </div>
        <span className="text-gray-400">›</span>
      </div>

      {showSettings && (
        <ScheduleSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};
