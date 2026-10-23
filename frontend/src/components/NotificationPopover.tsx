import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'urgent' | 'warning' | 'info' | 'success';
  targetPath: string;
  icon: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'High Balancing Cashout Risk (Simulated)',
    message: '14 Jan 18:00 UTC: Forecast over-predicted by +2,840 MW during evening peak ramp. Estimated illustrative cashout delta.',
    timestamp: '2 hours ago',
    isRead: true,
    priority: 'urgent',
    targetPath: '/?date=2026-01-14',
    icon: '🚨'
  },
  {
    id: 'notif-2',
    title: 'Severe Down-Ramp (>2,400 MW)',
    message: '25 Jan 14:00 UTC: Wind dropped -2,420 MW over 2 settlement hours. Decision forecast anticipated 52% of magnitude.',
    timestamp: '5 hours ago',
    isRead: true,
    priority: 'warning',
    targetPath: '/analytics?date=2026-01-25',
    icon: '🌪️'
  },
  {
    id: 'notif-3',
    title: 'EPEX SPOT 09:20 Cutoff (UK Time / UTC)',
    message: 'Day-ahead purchase decisions locked for 15 Jan delivery. 24 hourly periods evaluated.',
    timestamp: '1 day ago',
    isRead: true,
    priority: 'info',
    targetPath: '/forecast-explorer?date=2026-01-15',
    icon: '⚡'
  },
  {
    id: 'notif-4',
    title: 'Elexon BMRS Datasets Synced',
    message: '1,585 FUELHH actual settlement periods and 21,024 WINDFOR forecast records verified with 100% data integrity.',
    timestamp: '3 days ago',
    isRead: true,
    priority: 'success',
    targetPath: '/data-explorer',
    icon: '🟢'
  }
];

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationPopover({ isOpen, onClose, onUnreadCountChange }: NotificationPopoverProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markSingleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleItemClick = (notif: NotificationItem) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    onClose();
    navigate(notif.targetPath);
  };

  const restoreDefaults = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: '0',
        width: '380px',
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 12px 36px -4px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        zIndex: 9999,
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      {/* Popover Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span style={{
              background: '#fee2e2',
              color: '#dc2626',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px'
            }}>
              {unreadCount} New
            </span>
          )}
        </div>

        {unreadCount > 0 ? (
          <button
            onClick={markAllRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#059669',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '6px'
            }}
          >
            Mark all as read
          </button>
        ) : (
          <button
            onClick={restoreDefaults}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Reset demo alerts
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔔</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>All caught up!</div>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>No pending alerts for your trading desk.</div>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: notif.isRead ? '#ffffff' : '#f0fdf4',
                cursor: 'pointer',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                transition: 'background-color 0.15s ease',
                position: 'relative'
              }}
            >
              {/* Type Icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: notif.priority === 'urgent' ? '#fee2e2' :
                            notif.priority === 'warning' ? '#fef3c7' :
                            notif.priority === 'success' ? '#d1fae5' : '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                flexShrink: 0
              }}>
                {notif.icon}
              </div>

              {/* Text Body */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: notif.isRead ? 600 : 700,
                    color: '#0f172a'
                  }}>
                    {notif.title}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{notif.timestamp}</span>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: '#475569',
                  lineHeight: 1.45,
                  margin: '0 0 6px 0'
                }}>
                  {notif.message}
                </p>

                {/* Bottom action tags */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#059669' }}>
                    View details →
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!notif.isRead && (
                      <button
                        title="Mark as read"
                        onClick={(e) => markSingleRead(notif.id, e)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#64748b',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Read
                      </button>
                    )}
                    <button
                      title="Dismiss notification"
                      onClick={(e) => deleteNotification(notif.id, e)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#94a3b8',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Popover Footer */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11.5px',
        color: '#64748b'
      }}>
        <span>Balancing & Settlement Alerts</span>
        <span style={{ fontWeight: 600, color: '#059669' }}>GB Power Market Desk</span>
      </div>
    </div>
  );
}
