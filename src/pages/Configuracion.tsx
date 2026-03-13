import { useState } from 'react';
import { Building2, Bell, Database, Info, ChevronRight, Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cabanasApi, clientesApi, reservasApi } from '../lib/api';
import TopBar from '../components/layout/TopBar';

export default function Configuracion() {
  const { data: cabanas = [] } = useQuery({ queryKey: ['cabanas'], queryFn: cabanasApi.list });
  const { data: clientes = [] } = useQuery({ queryKey: ['clientes'], queryFn: clientesApi.list });
  const { data: reservas = [] } = useQuery({ queryKey: ['reservas'], queryFn: () => reservasApi.list() });
  const [activeSection, setActiveSection] = useState<string>('general');

  const sections = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'datos', label: 'Datos del Sistema', icon: Database },
    { id: 'acerca', label: 'Acerca de', icon: Info },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Configuración" subtitle="Ajustes del sistema" />
      <div className="p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <div className="card overflow-hidden">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium border-b border-surface-100 last:border-0 transition-colors ${
                    activeSection === id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    {label}
                  </div>
                  <ChevronRight size={14} className="text-surface-300" />
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeSection === 'general' && (
              <div className="card p-6 space-y-5">
                <h2 className="section-title">Configuración General</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nombre del Complejo</label>
                    <input className="input" defaultValue="Complejo Alojafy" />
                  </div>
                  <div>
                    <label className="label">Tipo de Moneda</label>
                    <select className="input">
                      <option>ARS - Peso Argentino</option>
                      <option>USD - Dólar</option>
                      <option>EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Email de contacto</label>
                    <input className="input" type="email" defaultValue="admin@alojafy.com" />
                  </div>
                  <div>
                    <label className="label">Teléfono</label>
                    <input className="input" defaultValue="+54 9 351 000-0000" />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Dirección del complejo</label>
                    <input className="input" defaultValue="Ruta Provincial 3, Km 12, Villa General Belgrano, Córdoba" />
                  </div>
                  <div>
                    <label className="label">Hora de Check-in</label>
                    <input className="input" type="time" defaultValue="14:00" />
                  </div>
                  <div>
                    <label className="label">Hora de Check-out</label>
                    <input className="input" type="time" defaultValue="10:00" />
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-surface-100">
                  <button className="btn-primary">Guardar Cambios</button>
                </div>
              </div>
            )}

            {activeSection === 'notificaciones' && (
              <div className="card p-6 space-y-4">
                <h2 className="section-title">Notificaciones</h2>
                {[
                  { label: 'Nuevas reservas', desc: 'Recibir notificaciones cuando llega una nueva reserva' },
                  { label: 'Check-ins del día', desc: 'Alerta diaria con los huéspedes que llegan hoy' },
                  { label: 'Check-outs del día', desc: 'Alerta diaria con los huéspedes que se van hoy' },
                  { label: 'Pagos pendientes', desc: 'Recordatorio de reservas con pago pendiente' },
                  { label: 'Cabañas en mantenimiento', desc: 'Alertas sobre el estado de mantenimiento' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-surface-700">{label}</p>
                      <p className="text-xs text-surface-400">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'datos' && (
              <div className="card p-6 space-y-4">
                <h2 className="section-title">Datos del Sistema</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-primary-50 rounded-xl p-4 text-center border border-primary-100">
                    <p className="text-3xl font-bold text-primary-700">{cabanas.length}</p>
                    <p className="text-sm text-primary-600 mt-1">Cabañas</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <p className="text-3xl font-bold text-blue-700">{clientes.length}</p>
                    <p className="text-sm text-blue-600 mt-1">Clientes</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                    <p className="text-3xl font-bold text-amber-700">{reservas.length}</p>
                    <p className="text-sm text-amber-600 mt-1">Reservas</p>
                  </div>
                </div>
                <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                  <h3 className="text-sm font-semibold text-red-700 mb-1">Zona Peligrosa</h3>
                  <p className="text-xs text-red-600 mb-3">
                    Estas acciones son irreversibles. Úsalas con precaución.
                  </p>
                  <button className="btn-danger btn-sm">Resetear datos demo</button>
                </div>
              </div>
            )}

            {activeSection === 'acerca' && (
              <div className="card p-6">
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-surface-800 mb-1">Alojafy</h2>
                  <p className="text-sm text-surface-400 mb-1">Versión 1.0.0</p>
                  <p className="text-sm text-surface-500 max-w-sm mx-auto mt-4">
                    Sistema integral de gestión para complejos de cabañas y alquileres vacacionales.
                    Administra cabañas, clientes, reservas y genera reportes detallados.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4 max-w-xs mx-auto text-sm text-surface-500">
                    <div className="bg-surface-50 rounded-lg p-3">
                      <p className="font-semibold text-surface-700">React 18</p>
                      <p className="text-xs">Framework UI</p>
                    </div>
                    <div className="bg-surface-50 rounded-lg p-3">
                      <p className="font-semibold text-surface-700">TypeScript</p>
                      <p className="text-xs">Lenguaje</p>
                    </div>
                    <div className="bg-surface-50 rounded-lg p-3">
                      <p className="font-semibold text-surface-700">Tailwind CSS</p>
                      <p className="text-xs">Estilos</p>
                    </div>
                    <div className="bg-surface-50 rounded-lg p-3">
                      <p className="font-semibold text-surface-700">Zustand</p>
                      <p className="text-xs">Estado global</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
