import { useState, useEffect } from 'react';

// 获取用户唯一 ID（基于浏览器指纹）
const getUserId = (): string => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

// 后端 API 基础 URL
const API_BASE = '/.netlify/functions';

export const useBackend = () => {
  const [isBackendAvailable, setIsBackendAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userId = getUserId();

  // 检查后端是否可用
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE}/sync-data?userId=${userId}`);
        setIsBackendAvailable(response.ok || response.status === 404);
      } catch (error) {
        console.log('后端不可用，使用本地模式');
        setIsBackendAvailable(false);
      }
    };
    checkBackend();
  }, [userId]);

  // 调用 AI 对话 API（支持联网搜索）
  const chatWithAI = async (
    messages: Array<{ role: string; content: string }>,
    enableWebSearch: boolean = true
  ) => {
    if (!isBackendAvailable) {
      throw new Error('Backend not available');
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          userId,
          enableWebSearch,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // 备份数据到云端
  const backupData = async (data: any) => {
    if (!isBackendAvailable) {
      console.log('后端不可用，跳过备份');
      return { success: false, message: 'Backend not available' };
    }

    try {
      const response = await fetch(`${API_BASE}/sync-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'backup',
          data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backup failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('数据备份成功:', result);
      return result;
    } catch (error) {
      console.error('备份失败:', error);
      return { success: false, error };
    }
  };

  // 从云端恢复数据
  const restoreData = async () => {
    if (!isBackendAvailable) {
      console.log('后端不可用，跳过恢复');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/sync-data?userId=${userId}`);

      if (!response.ok) {
        throw new Error(`Restore failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log('数据恢复成功:', result);
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('恢复失败:', error);
      return null;
    }
  };

  // 自动备份（防抖）
  const autoBackup = (() => {
    let timer: NodeJS.Timeout;
    return (data: any) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        backupData(data);
      }, 5000); // 5秒后备份
    };
  })();

  return {
    userId,
    isBackendAvailable,
    isLoading,
    chatWithAI,
    backupData,
    restoreData,
    autoBackup,
  };
};
