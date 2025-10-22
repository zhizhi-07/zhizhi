import React, { useState, useEffect } from 'react';

interface ScheduleConfig {
  morningEnabled: boolean;
  morningHour: number; // 小时 (0-23)
  morningMinute: number; // 分钟 (0-59)
  nightEnabled: boolean;
  nightHour: number;
  nightMinute: number;
  missYouEnabled: boolean;
  missYouDays: number; // 多少天未聊天
  missYouHour: number;
  missYouMinute: number;
  noonEnabled: boolean;
  noonHour: number;
  noonMinute: number;
  randomEnabled: boolean; // 随机主动发消息
  randomMinInterval: number; // 最小间隔（小时）
  randomMaxInterval: number; // 最大间隔（小时）
  randomProbability: number; // 发送概率 (0-100)
}

const defaultConfig: ScheduleConfig = {
  morningEnabled: true,
  morningHour: 8,
  morningMinute: 0,
  nightEnabled: true,
  nightHour: 22,
  nightMinute: 0,
  missYouEnabled: true,
  missYouDays: 3,
  missYouHour: 10,
  missYouMinute: 0,
  noonEnabled: false,
  noonHour: 12,
  noonMinute: 0,
  randomEnabled: false,
  randomMinInterval: 2,
  randomMaxInterval: 6,
  randomProbability: 30,
};

export const ScheduleSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [config, setConfig] = useState<ScheduleConfig>(defaultConfig);

  // 从 localStorage 加载配置
  useEffect(() => {
    const saved = localStorage.getItem('scheduleConfig');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  // 保存配置
  const saveConfig = () => {
    localStorage.setItem('scheduleConfig', JSON.stringify(config));
    alert('✅ 定时设置已保存！');
    onClose();
  };

  // 重置为默认
  const resetConfig = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('scheduleConfig');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 标题 */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">⏰ AI 定时消息设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* 早安消息 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.morningEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, morningEnabled: e.target.checked })
                  }
                  className="w-5 h-5 rounded"
                />
                <span className="font-medium">🌅 早安问候</span>
              </label>
            </div>
            {config.morningEnabled && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-sm text-gray-600">每天</span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={config.morningHour}
                  onChange={(e) =>
                    setConfig({ ...config, morningHour: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 px-2 py-1 border rounded text-center"
                />
                <span className="text-sm text-gray-600">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={config.morningMinute}
                  onChange={(e) =>
                    setConfig({ ...config, morningMinute: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 px-2 py-1 border rounded text-center"
                />
                <span className="text-sm text-gray-600">发送</span>
              </div>
            )}
          </div>

          {/* 午间问候 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.noonEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, noonEnabled: e.target.checked })
                  }
                  className="w-5 h-5 rounded"
                />
                <span className="font-medium">🍱 午间问候</span>
              </label>
            </div>
            {config.noonEnabled && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-sm text-gray-600">每天</span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={config.noonHour}
                  onChange={(e) =>
                    setConfig({ ...config, noonHour: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 px-2 py-1 border rounded text-center"
                />
                <span className="text-sm text-gray-600">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={config.noonMinute}
                  onChange={(e) =>
                    setConfig({ ...config, noonMinute: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 px-2 py-1 border rounded text-center"
                />
                <span className="text-sm text-gray-600">发送</span>
              </div>
            )}
          </div>

          {/* 晚安消息 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.nightEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, nightEnabled: e.target.checked })
                  }
                  className="w-5 h-5 rounded"
                />
                <span className="font-medium">🌙 晚安问候</span>
              </label>
            </div>
            {config.nightEnabled && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-sm text-gray-600">每天</span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={config.nightHour}
                  onChange={(e) =>
                    setConfig({ ...config, nightHour: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 px-2 py-1 border rounded text-center"
                />
                <span className="text-sm text-gray-600">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={config.nightMinute}
                  onChange={(e) =>
                    setConfig({ ...config, nightMinute: parseInt(e.target.value) || 0 })
                  }
                  className="w-14 px-2 py-1 border rounded text-center"
                />
                <span className="text-sm text-gray-600">发送</span>
              </div>
            )}
          </div>

          {/* 长时间未聊天提醒 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.missYouEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, missYouEnabled: e.target.checked })
                  }
                  className="w-5 h-5 rounded"
                />
                <span className="font-medium">💭 想念提醒</span>
              </label>
            </div>
            {config.missYouEnabled && (
              <div className="ml-7 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={config.missYouDays}
                    onChange={(e) =>
                      setConfig({ ...config, missYouDays: parseInt(e.target.value) })
                    }
                    className="w-16 px-2 py-1 border rounded text-center"
                  />
                  <span className="text-sm text-gray-600">天未聊天时提醒</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">在</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.missYouHour}
                    onChange={(e) =>
                      setConfig({ ...config, missYouHour: parseInt(e.target.value) || 0 })
                    }
                    className="w-14 px-2 py-1 border rounded text-center"
                  />
                  <span className="text-sm text-gray-600">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={config.missYouMinute}
                    onChange={(e) =>
                      setConfig({ ...config, missYouMinute: parseInt(e.target.value) || 0 })
                    }
                    className="w-14 px-2 py-1 border rounded text-center"
                  />
                  <span className="text-sm text-gray-600">发送</span>
                </div>
              </div>
            )}
          </div>

          {/* 随机主动发消息 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.randomEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, randomEnabled: e.target.checked })
                  }
                  className="w-5 h-5 rounded"
                />
                <span className="font-medium">🎲 随机主动发消息</span>
              </label>
            </div>
            {config.randomEnabled && (
              <div className="ml-7 space-y-3">
                {/* 时间间隔 */}
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 font-medium">发送间隔</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">每</span>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={config.randomMinInterval}
                      onChange={(e) =>
                        setConfig({ ...config, randomMinInterval: parseInt(e.target.value) || 1 })
                      }
                      className="w-16 px-2 py-1 border rounded text-center"
                    />
                    <span className="text-sm text-gray-600">-</span>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={config.randomMaxInterval}
                      onChange={(e) =>
                        setConfig({ ...config, randomMaxInterval: parseInt(e.target.value) || 1 })
                      }
                      className="w-16 px-2 py-1 border rounded text-center"
                    />
                    <span className="text-sm text-gray-600">小时随机发送一次</span>
                  </div>
                  <p className="text-xs text-gray-500">例如：2-6 小时表示每 2-6 小时内随机发送</p>
                </div>

                {/* 发送概率 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 font-medium">发送概率</div>
                    <span className="text-sm font-semibold text-blue-600">{config.randomProbability}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={config.randomProbability}
                    onChange={(e) =>
                      setConfig({ ...config, randomProbability: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>10%（很少）</span>
                    <span>50%（适中）</span>
                    <span>100%（频繁）</span>
                  </div>
                  <p className="text-xs text-gray-500">概率越高，AI 发消息越频繁</p>
                </div>
              </div>
            )}
          </div>

          {/* 说明 */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-600">
            <p className="font-medium text-blue-900 mb-1">💡 提示</p>
            <ul className="space-y-1 text-xs">
              <li>• AI 会在设定的时间主动发送问候消息</li>
              <li>• 随机消息让 AI 更像真人，不可预测</li>
              <li>• 需要配置后端才能使用定时功能</li>
              <li>• 消息会根据 AI 的性格自动生成</li>
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              onClick={resetConfig}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              重置默认
            </button>
            <button
              onClick={saveConfig}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 导出获取配置的函数
export const getScheduleConfig = (): ScheduleConfig => {
  const saved = localStorage.getItem('scheduleConfig');
  if (saved) {
    return JSON.parse(saved);
  }
  return defaultConfig;
};
