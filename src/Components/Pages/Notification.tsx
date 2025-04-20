import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from '../Pagesmodulecss/Notification.module.css'; // Assume you have a CSS module

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Notification {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  message: string;
  created_at: string;
  source: string;
}


interface NotificationProps {
  darkMode: boolean;
}

const Notification: React.FC<NotificationProps> = ({ darkMode }) => {
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          const oldNotification = payload.old as Notification;
      
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [newNotification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === newNotification.id ? newNotification : n))
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== oldNotification.id));
          }
        }
      )
      
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Limit to recent notifications
    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }
    setNotifications(data);
  };

  return (
<div className={darkMode ? styles.darkMode : styles.lightMode}>
    <div className={styles.container}>
      <h1>Notification Dashboard</h1>
      <div className={styles.notificationList}>
        {notifications.map((notification) => (
          <div key={notification.id} className={styles.notification}>
            <p>{notification.message}</p>
            <span className={styles.timestamp}>
              {new Date(notification.created_at).toLocaleString()}
            </span>
            <span className={styles.source}>Source: {notification.source}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

export default Notification;