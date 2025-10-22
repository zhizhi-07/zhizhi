import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // 检查浏览器是否支持通知
    setIsSupported('Notification' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // 请求通知权限
  const requestPermission = async () => {
    if (!isSupported) {
      console.log('浏览器不支持通知');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  };

  // 发送通知
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.log('无法发送通知：权限未授予');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/app-icon.png',
        badge: '/app-icon.png',
        ...options,
      });

      // 点击通知时聚焦窗口
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('发送通知失败:', error);
      return null;
    }
  };

  // 发送新消息通知
  const notifyNewMessage = (contactName: string, message: string) => {
    return sendNotification(`${contactName} 发来新消息`, {
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      tag: 'new-message',
      requireInteraction: false,
    });
  };

  // 发送朋友圈通知
  const notifyNewMoment = (contactName: string, content: string) => {
    return sendNotification(`${contactName} 发布了新朋友圈`, {
      body: content.length > 50 ? content.substring(0, 50) + '...' : content,
      tag: 'new-moment',
      requireInteraction: false,
    });
  };

  // 发送提醒通知
  const notifyReminder = (title: string, message: string) => {
    return sendNotification(title, {
      body: message,
      tag: 'reminder',
      requireInteraction: true,
    });
  };

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    notifyNewMessage,
    notifyNewMoment,
    notifyReminder,
  };
};
