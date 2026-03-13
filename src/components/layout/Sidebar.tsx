import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Home, Users, CalendarDays,
  Building2, BarChart3, Settings, LogOut, Shield, Crown, X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import OrgSwitcher from './OrgSwitcher';

const NAV_MAIN = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cabanas',    icon: Home,            label: 'Alojamientos' },
  { to: '/clientes',   icon: Users,           label: 'Clientes' },
  { to: '/hospedajes', icon: Building2,       label: 'Reservas' },
  { to: '/calendario', icon: CalendarDays,    label: 'Calendario' },
  { to: '/reportes',   icon: BarChart3,       label: 'Reportes' },
];

const NAV_ADMIN = [
  { to: '/admin/usuarios', icon: Shield,   label: 'Usuarios' },
  { to: '/configuracion',  icon: Settings, label: 'Configuración' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const sidebarContent = (
    <aside className="w-[216px] bg-surface-900 flex flex-col h-full">
      {/* Logo / Org Switcher */}
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-white/8 flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Home className="w-3.5 h-3.5 text-white" />
        </div>
        <OrgSwitcher />
        {/* Close button for mobile overlay */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded text-surface-500 hover:text-white transition-colors flex-shrink-0 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-px">
        <p className="px-3 mb-2 text-[10px] font-semibold text-surface-600 uppercase tracking-widest">
          Gestión
        </p>
        {NAV_MAIN.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
            }
          >
            <Icon className="w-[15px] h-[15px] flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="px-3 pt-4 pb-2 text-[10px] font-semibold text-surface-600 uppercase tracking-widest">
              Admin
            </p>
            {NAV_ADMIN.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                }
              >
                <Icon className="w-[15px] h-[15px] flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}

        {!isAdmin && (
          <>
            <p className="px-3 pt-4 pb-2 text-[10px] font-semibold text-surface-600 uppercase tracking-widest">
              Sistema
            </p>
            <NavLink
              to="/configuracion"
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
              }
            >
              <Settings className="w-[15px] h-[15px] flex-shrink-0" />
              <span>Configuración</span>
            </NavLink>
          </>
        )}

        {isSuperAdmin && (
          <>
            <p className="px-3 pt-4 pb-2 text-[10px] font-semibold text-surface-600 uppercase tracking-widest">
              Super Admin
            </p>
            <NavLink
              to="/super"
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
              }
            >
              <Crown className="w-[15px] h-[15px] flex-shrink-0" />
              <span>Panel Global</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/8 px-3 py-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate leading-tight">{user?.name ?? 'Usuario'}</p>
            <p className="text-[10px] text-surface-500 truncate leading-tight">
              {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrador' : 'Usuario'}
            </p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-1.5 rounded text-surface-500 hover:text-red-400 hover:bg-red-950/30 transition-colors flex-shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  // Desktop: fixed sidebar
  // Mobile: overlay when isOpen is true
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-[216px] z-30">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative flex-shrink-0 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
