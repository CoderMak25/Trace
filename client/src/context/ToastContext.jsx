import { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 border-[3px] border-ink shadow-[4px_4px_0_0_#2d2d2d] animate-fade-in blob-1 ${
              t.type === 'success' ? 'bg-yellow' : t.type === 'error' ? 'bg-red text-white' : 'bg-white'
            }`}
          >
            <Icon
              icon={
                t.type === 'success'
                  ? 'solar:check-circle-bold'
                  : t.type === 'error'
                  ? 'solar:close-circle-bold'
                  : 'solar:info-circle-bold'
              }
              className={`text-2xl mt-0.5 shrink-0 ${t.type === 'success' ? 'text-green-600' : t.type === 'error' ? 'text-white' : 'text-blue'}`}
            />
            <p className="font-heading tracking-tight text-lg leading-tight mt-0.5">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className={`ml-auto shrink-0 ${t.type === 'error' ? 'text-white/80 hover:text-white' : 'text-ink/60 hover:text-ink'}`}
            >
              <Icon icon="solar:close-circle-linear" className="text-xl" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}
