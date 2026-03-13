import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Cabanas from './pages/Cabanas';
import Clientes from './pages/Clientes';
import Hospedajes from './pages/Hospedajes';
import Calendario from './pages/Calendario';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="cabanas" element={<Cabanas />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="hospedajes" element={<Hospedajes />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
