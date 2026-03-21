import { useAuth } from '../context/AuthContext';
import { Icon } from '@iconify/react';

export default function NotificationBanner() {
  const { showNotificationPrompt, setShowNotificationPrompt, requestNotificationPermission } = useAuth();

  if (!showNotificationPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-ink border-t-[3px] border-ink text-white p-4 md:p-6 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 z-[100] animate-fade-in shadow-[0_-8px_20px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-3">
        <Icon icon="solar:bell-bing-bold-duotone" className="text-4xl shrink-0 text-yellow" />
        <div>
          <p className="font-heading text-xl tracking-tight text-white mb-1">Enable Push Notifications</p>
          <p className="text-sm text-white/70 max-w-2xl">We'd like to send you deadline reminders and team announcements so you never miss an event. You can disable this anytime.</p>
        </div>
      </div>
      <div className="flex gap-3 shrink-0 mt-2 md:mt-0">
        <button onClick={requestNotificationPermission} className="bg-yellow text-ink border-[3px] border-ink font-heading text-lg px-6 py-2 shadow-[3px_3px_0_0_#fff] hover:-translate-y-1 hover:shadow-[5px_5px_0_0_#fff] transition-all whitespace-nowrap">
          Allow Notifications
        </button>
        <button onClick={() => setShowNotificationPrompt(false)} className="bg-transparent text-white/60 font-heading text-lg px-4 py-2 hover:text-white transition-colors border-2 border-transparent whitespace-nowrap">
          Dismiss
        </button>
      </div>
    </div>
  );
}
