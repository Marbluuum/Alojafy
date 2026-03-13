import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Home, Users, CalendarDays,
  BedDouble, BarChart3, Settings, LogOut, TreePine
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cabanas', label: 'Cabañas', icon: Home },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/hospedajes', label: 'Hospedajes', icon: BedDouble },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900 text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-xl">
            <TreePine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">Alojafy</h1>
            <p className="text-xs text-dark-400 mt-0.5">Gestión de Cabañas</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-1 text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">
          Principal
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="pt-4 mt-4 border-t border-dark-700">
          <p className="px-3 py-1 text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">
            Sistema
          </p>
          <NavLink
            to="/configuracion"
            className={({ isActive }) =>
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }
          >
            <Settings size={18} />
            <span>Configuración</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-dark-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Administrador</p>
            <p className="text-xs text-dark-400 truncate">admin@alojafy.com</p>
          </div>
          <button className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
