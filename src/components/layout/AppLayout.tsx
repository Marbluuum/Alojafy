import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar />
      <main className="flex-1 ml-[216px] min-h-screen overflow-x-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
