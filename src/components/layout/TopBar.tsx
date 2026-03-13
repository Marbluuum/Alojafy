import { Bell } from 'lucide-react';
import { formatDisplayDate, today } from '../../utils/helpers';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  pendingCount?: number;
}

export default function TopBar({ title, subtitle, actions, pendingCount = 0 }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-surface-200 px-6 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
      <div className="min-w-0">
        <h1 className="page-title leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-surface-400 mt-px truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {actions}
        <span className="text-xs text-surface-400 hidden md:block pl-2">
          {formatDisplayDate(today())}
        </span>
        <div className="relative ml-1">
          <button className="btn-icon btn-ghost relative">
            <Bell className="w-[15px] h-[15px]" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold leading-none">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
