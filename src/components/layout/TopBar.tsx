import { Bell } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatDisplayDate, today } from '../../utils/helpers';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const reservas = useStore((s) => s.reservas);
  const pendientes = reservas.filter((r) => r.estado === 'pendiente').length;

  return (
    <header className="bg-white border-b border-dark-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-dark-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-dark-400 hidden sm:block">
          {formatDisplayDate(today())}
        </span>
        <div className="relative">
          <button className="p-2 rounded-lg text-dark-400 hover:text-dark-600 hover:bg-dark-100 transition-colors relative">
            <Bell size={18} />
            {pendientes > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {pendientes}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
