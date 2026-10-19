import React from 'react';

interface ToastProps {
  message: string | null;
  icon?: string;
  isVisible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, icon = 'check_circle', isVisible }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 bg-surface-container-highest text-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 z-50 border border-primary/30 pointer-events-none ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}
    >
      <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
      <span className="font-body-sm text-body-sm font-medium">{message}</span>
    </div>
  );
};
