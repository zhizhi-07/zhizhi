import React, { useEffect, useState } from 'react';
import { useBackend } from '../hooks/useBackend';
import { useNotifications } from '../hooks/useNotifications';

export const BackendStatus: React.FC = () => {
  const { isBackendAvailable, userId } = useBackend();
  const { isSupported, permission, requestPermission } = useNotifications();
  const [showStatus, setShowStatus] = useState(true);

  useEffect(() => {
    // 5秒后自动隐藏状态提示
    const timer = setTimeout(() => {
      setShowStatus(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!showStatus) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {/* 后端状态 */}
      <div
        className={`mb-2 p-3 rounded-lg shadow-lg ${
          isBackendAvailable
            ? 'bg-green-500 text-white'
            : 'bg-yellow-500 text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isBackendAvailable ? 'bg-white' : 'bg-white animate-pulse'
            }`}
          />
          <span className="text-sm font-medium">
            {isBackendAvailable ? '✅ 云端功能已启用' : '⚠️ 本地模式'}
          </span>
        </div>
        {isBackendAvailable && (
          <div className="mt-1 text-xs opacity-90">
            数据备份、联网搜索、主动消息已启用
          </div>
        )}
      </div>

      {/* 通知权限提示 */}
      {isSupported && permission !== 'granted' && (
        <div className="p-3 bg-blue-500 text-white rounded-lg shadow-lg">
          <div className="text-sm font-medium mb-2">🔔 开启消息通知</div>
          <div className="text-xs mb-2 opacity-90">
            允许通知后，即使关闭网页也能收到 AI 消息
          </div>
          <button
            onClick={requestPermission}
            className="w-full px-3 py-1 bg-white text-blue-500 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
          >
            开启通知
          </button>
        </div>
      )}

      {/* 关闭按钮 */}
      <button
        onClick={() => setShowStatus(false)}
        className="absolute top-2 right-2 text-white opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
};
