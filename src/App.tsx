import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Cabanas from './pages/Cabanas';
import Clientes from './pages/Clientes';
import Hospedajes from './pages/Hospedajes';
import Calendario from './pages/Calendario';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import Register from './pages/Register';
import Usuarios from './pages/admin/Usuarios';
import SuperAdmin from './pages/super/SuperAdmin';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-400">Cargando...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      {/* Protected routes */}
      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="cabanas"      element={<Cabanas />} />
        <Route path="clientes"     element={<Clientes />} />
        <Route path="hospedajes"   element={<Hospedajes />} />
        <Route path="calendario"   element={<Calendario />} />
        <Route path="reportes"     element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="admin/usuarios" element={<RequireAdmin><Usuarios /></RequireAdmin>} />
        <Route path="super" element={<RequireSuperAdmin><SuperAdmin /></RequireSuperAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
