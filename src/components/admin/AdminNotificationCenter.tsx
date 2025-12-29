import { useState, useRef, useEffect } from 'react';
import { 
  Bell, CheckCheck, X, AlertTriangle, DollarSign, Users, 
  ShoppingBag, Gavel, Store, Activity, Wifi, WifiOff 
} from 'lucide-react';
import { useAdminWebSocket } from '@/hooks/useAdminWebSocket';
import { useToast } from '@/hooks/use-toast';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'TRANSACTION_CREATED':
      return <ShoppingBag className="h-4 w-4 text-blue-500" />;
    case 'PAYMENT_RECEIVED':
      return <DollarSign className="h-4 w-4 text-green-500" />;
    case 'DISPUTE_OPENED':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'DISPUTE_RESOLVED':
      return <Gavel className="h-4 w-4 text-purple-500" />;
    case 'USER_REGISTERED':
      return <Users className="h-4 w-4 text-indigo-500" />;
    case 'STORE_CREATED':
      return <Store className="h-4 w-4 text-orange-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-l-4 border-l-red-500';
    case 'medium':
      return 'border-l-4 border-l-yellow-500';
    default:
      return 'border-l-4 border-l-gray-300';
  }
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
};

interface AdminNotificationCenterProps {
  onStatsUpdate?: (stats: { newTransactions: number; newDisputes: number; newUsers: number }) => void;
}

export function AdminNotificationCenter({ onStatsUpdate }: AdminNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    isConnected,
    notifications,
    unreadCount,
    stats,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useAdminWebSocket({
    onNotification: (notification) => {
      // Show toast for high priority notifications
      if (notification.priority === 'high') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: 'destructive',
        });
      } else if (notification.priority === 'medium') {
        toast({
          title: notification.title,
          description: notification.message,
        });
      }
    },
  });

  // Notify parent of stats changes
  useEffect(() => {
    onStatsUpdate?.(stats);
  }, [stats, onStatsUpdate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highPriorityCount = notifications.filter(n => !n.read && n.priority === 'high').length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
        aria-label="Admin Notifications"
      >
        <Bell size={20} />
        
        {/* Connection indicator */}
        <span
          className={`absolute top-1 right-1 h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
        />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold text-white rounded-full ${
            highPriorityCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800">Admin Notifications</h3>
              {isConnected ? (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  <Wifi size={10} /> Live
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  <WifiOff size={10} /> Offline
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                    title="Mark all as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                  <button
                    onClick={clearNotifications}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                    title="Clear all"
                  >
                    <X size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Real-time Stats Bar */}
          {(stats.newTransactions > 0 || stats.newDisputes > 0 || stats.newUsers > 0) && (
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                {stats.newTransactions > 0 && (
                  <span className="flex items-center gap-1 text-blue-700">
                    <ShoppingBag size={12} /> +{stats.newTransactions} orders
                  </span>
                )}
                {stats.newDisputes > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle size={12} /> +{stats.newDisputes} disputes
                  </span>
                )}
                {stats.newUsers > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Users size={12} /> +{stats.newUsers} users
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                <Bell className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="font-semibold">No notifications yet</p>
                <p className="text-sm mt-1">
                  {isConnected ? 'Monitoring for new activity...' : 'Connecting to server...'}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  } ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1">
                          {notification.priority === 'high' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-700 rounded">
                              Urgent
                            </span>
                          )}
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-center text-gray-500">
              {isConnected ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Real-time updates active
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Reconnecting...
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
