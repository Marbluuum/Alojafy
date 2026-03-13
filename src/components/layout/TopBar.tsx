import { Bell, Menu } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { formatDisplayDate, today } from '../../utils/helpers';

interface OutletCtx {
  onMenuClick?: () => void;
}

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  pendingCount?: number;
  onMenuClick?: () => void;
}

export default function TopBar({ title, subtitle, actions, pendingCount = 0, onMenuClick }: TopBarProps) {
  // Try to get onMenuClick from outlet context if not passed directly
  let ctxMenuClick: (() => void) | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useOutletContext<OutletCtx>();
    ctxMenuClick = ctx?.onMenuClick;
  } catch {
    // not inside outlet context
  }

  const handleMenuClick = onMenuClick ?? ctxMenuClick;

  return (
    <header className="h-14 bg-white border-b border-surface-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — visible on mobile/tablet */}
        <button
          onClick={handleMenuClick}
          className="lg:hidden p-1.5 rounded text-surface-500 hover:text-surface-700 hover:bg-surface-100 transition-colors flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="page-title leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-surface-400 mt-px truncate">{subtitle}</p>}
        </div>
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
