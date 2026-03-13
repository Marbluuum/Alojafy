import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-dark-50">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
