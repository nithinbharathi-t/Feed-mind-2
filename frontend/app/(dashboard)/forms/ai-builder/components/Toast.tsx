'use client';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'ai';
}

export default function Toast({ message, type }: ToastProps) {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    ai: '✦',
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    info: 'bg-card border-border',
    ai: 'bg-primary/10 border-primary/30',
  };

  const textColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-primary',
    ai: 'text-primary',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-4 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bgColors[type]}`}
      >
        <span className={`text-lg font-bold ${textColors[type]}`}>
          {icons[type]}
        </span>
        <span className="text-sm text-foreground/90">{message}</span>
      </div>
    </div>
  );
}
