import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { onForegroundMessage } from '../firebase/firebaseConfig';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!currentUser || currentUser.isDemo) return;
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get('/api/notifications/my-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  // Fetch on mount + every 30 seconds
  useEffect(() => {
    if (!currentUser || currentUser.isDemo) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Listen for FOREGROUND push messages (when tab is open)
  useEffect(() => {
    if (!currentUser || currentUser.isDemo) return;

    let unsubscribe;
    onForegroundMessage((payload) => {
      console.log('[Foreground FCM]', payload);

      const title = payload.notification?.title || payload.data?.title || 'Trace';
      const body = payload.notification?.body || payload.data?.body || '';

      // Show a native browser notification popup
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: body,
            icon: '/vite.svg',
            tag: 'trace-' + Date.now(), // Unique tag prevents collapsing
          });
        } catch (e) {
          // Fallback: use service worker registration to show
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, { body, icon: '/vite.svg' });
          });
        }
      }

      // Immediately re-fetch bell data
      fetchNotifications();
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all as read when opening dropdown
  const toggleDropdown = async () => {
    const newOpenState = !open;
    setOpen(newOpenState);

    if (newOpenState) {
      // Also re-fetch latest
      await fetchNotifications();

      if (notifications.some(n => !n.read)) {
        try {
          const token = await currentUser.getIdToken();
          await axios.put('/api/notifications/my-notifications/read', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
          console.error('Failed to mark read', err);
        }
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="w-10 h-10 border-[3px] border-ink bg-white flex items-center justify-center shadow-[2px_2px_0_0_#2d2d2d] hover:bg-yellow transition-colors relative blob-2"
      >
        <Icon icon={unreadCount > 0 ? "solar:bell-bing-bold-duotone" : "solar:bell-linear"} className="text-xl text-ink" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red text-white text-xs font-heading w-5 h-5 flex items-center justify-center rounded-full border-2 border-ink animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-[-60px] sm:right-[-20px] md:right-0 top-[120%] w-[300px] sm:w-[340px] max-h-[420px] bg-white border-[3px] border-ink shadow-[6px_6px_0_0_#2d2d2d] flex flex-col z-50 blob-1 overflow-hidden">
          <div className="bg-ink text-white p-3 font-heading text-lg flex justify-between items-center">
            <span>Notifications</span>
            <button onClick={() => setOpen(false)} className="hover:text-red transition-colors">
              <Icon icon="solar:close-circle-linear" className="text-2xl" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-2" style={{ scrollbarWidth: 'thin' }}>
            {notifications.length === 0 ? (
              <div className="text-center p-8 text-ink/50 text-sm">
                <Icon icon="solar:bell-off-linear" className="text-5xl mx-auto mb-3 opacity-40" />
                <p className="font-heading text-lg text-ink/40">All quiet here!</p>
                <p className="text-xs text-ink/30 mt-1">Notifications will appear when your team sends announcements or deadlines approach.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {notifications.map((n) => (
                  <Link
                    key={n._id}
                    to={n.link || '#'}
                    onClick={() => setOpen(false)}
                    className={`block p-3 border-2 border-ink transition-colors shadow-[2px_2px_0_0_#2d2d2d] cursor-pointer ${n.read ? 'bg-white hover:bg-tan/30' : 'bg-yellow/10 hover:bg-yellow/20 border-blue/40'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 text-xl shrink-0 ${n.type === 'deadline_reminder' ? 'text-red' : 'text-blue'}`}>
                        <Icon icon={n.type === 'deadline_reminder' ? 'solar:alarm-bold' : 'solar:bell-bing-bold'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-heading text-sm text-ink leading-tight mb-0.5">{n.title}</h4>
                        <p className="text-xs text-ink/60 line-clamp-2">{n.body}</p>
                        <span className="text-[10px] text-ink/35 mt-1 block font-mono">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!n.read && (
                        <span className="w-2.5 h-2.5 bg-blue rounded-full shrink-0 mt-1.5 border border-ink/30"></span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
