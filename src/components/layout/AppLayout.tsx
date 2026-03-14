import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../lib/auth';
import { AlertTriangle } from 'lucide-react';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { organization, user } = useAuth();

  // Show blocking screen if org is inactive and user is NOT super admin
  if (organization?.isActive === false && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-900">Cuenta desactivada</h2>
            <p className="text-sm text-surface-500 mt-1">
              Tu cuenta <span className="font-medium text-surface-700">{organization.name}</span> fue desactivada por el administrador de la plataforma.
            </p>
            <p className="text-sm text-surface-400 mt-3">
              Para reactivarla, contactá a soporte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 lg:ml-[216px] min-h-screen overflow-x-hidden flex flex-col">
        <Outlet context={{ onMenuClick: () => setSidebarOpen(true) }} />
      </main>
    </div>
  );
}
