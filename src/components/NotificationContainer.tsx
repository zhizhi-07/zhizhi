import { useState, useEffect } from 'react'
import IOSNotification from './IOSNotification'
import { notificationManager, NotificationData } from '../utils/notificationManager'

const NotificationContainer = () => {
  const [notification, setNotification] = useState<NotificationData | null>(null)

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notif) => {
      setNotification(notif)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleClose = () => {
    notificationManager.close()
  }

  return (
    <IOSNotification
      show={!!notification}
      title={notification?.title || ''}
      subtitle={notification?.subtitle}
      message={notification?.message || ''}
      icon={notification?.icon}
      onClose={handleClose}
      onClick={notification?.onClick}
      duration={notification?.duration}
    />
  )
}

export default NotificationContainer
