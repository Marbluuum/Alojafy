import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, BedDouble, Calendar, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reservasApi, cabanasApi, clientesApi, Reserva } from '../lib/api';
import {
  formatCurrency, formatDisplayDate, statusReservaBadge,
  statusPagoBadge, calcNights
} from '../utils/helpers';
import TopBar from '../components/layout/TopBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import HospedajeForm from '../components/forms/HospedajeForm';

type BookingStatus = 'confirmada' | 'pendiente' | 'cancelada' | 'completada';
const STATUS_OPTIONS: { value: BookingStatus | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'completada', label: 'Completadas' },
  { value: 'cancelada', label: 'Canceladas' },
];

export default function Hospedajes() {
  const qc = useQueryClient();
  const { data: reservas = [], isLoading } = useQuery({ queryKey: ['reservas'], queryFn: () => reservasApi.list() });
  const { data: cabanas = [] } = useQuery({ queryKey: ['cabanas'], queryFn: cabanasApi.list });
  const { data: clientes = [] } = useQuery({ queryKey: ['clientes'], queryFn: clientesApi.list });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'todas'>('todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editReserva, setEditReserva] = useState<Reserva | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reservas.filter((r) => {
      const cabanaName = r.cabana?.nombre ?? cabanas.find(c => c.id === r.cabanaId)?.nombre ?? '';
      const clienteName = r.cliente
        ? `${r.cliente.nombre} ${r.cliente.apellido}`
        : (() => { const c = clientes.find(cl => cl.id === r.clienteId); return c ? `${c.nombre} ${c.apellido}` : ''; })();
      const searchStr = `${cabanaName} ${clienteName}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      const matchStatus = statusFilter === 'todas' || r.estado === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reservas, search, statusFilter, cabanas, clientes]);

  const handleOpenAdd = () => { setEditReserva(null); setModalOpen(true); };
  const handleOpenEdit = (r: Reserva) => { setEditReserva(r); setModalOpen(true); };

  const handleSubmit = async (data: Partial<Reserva>) => {
    if (editReserva) {
      await reservasApi.update(editReserva.id, data);
    } else {
      await reservasApi.create(data);
    }
    qc.invalidateQueries({ queryKey: ['reservas'] });
    qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await reservasApi.delete(deleteId);
    qc.invalidateQueries({ queryKey: ['reservas'] });
    qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    setDeleteId(null);
  };

  const counts = {
    confirmada: reservas.filter(r => r.estado === 'confirmada').length,
    pendiente:  reservas.filter(r => r.estado === 'pendiente').length,
    completada: reservas.filter(r => r.estado === 'completada').length,
    cancelada:  reservas.filter(r => r.estado === 'cancelada').length,
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Reservas"
        subtitle={`${reservas.length} reservas en total`}
        pendingCount={counts.pendiente}
        actions={
          <button onClick={handleOpenAdd} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" />Nueva reserva
          </button>
        }
      />

      <div className="p-6 flex-1">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Confirmadas', value: counts.confirmada, color: 'text-primary-600' },
            { label: 'Pendientes',  value: counts.pendiente,  color: 'text-amber-600' },
            { label: 'Completadas', value: counts.completada, color: 'text-surface-500' },
            { label: 'Canceladas',  value: counts.cancelada,  color: 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-surface-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cabaña o cliente..." />
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  statusFilter === opt.value
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BedDouble}
            title="No hay reservas"
            description="Creá tu primera reserva para empezar a gestionar hospedajes"
            action={{ label: 'Nueva reserva', onClick: handleOpenAdd }}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const cabanaNombre = r.cabana?.nombre ?? cabanas.find(c => c.id === r.cabanaId)?.nombre ?? '—';
              const clienteNombre = r.cliente
                ? `${r.cliente.nombre} ${r.cliente.apellido}`
                : (() => { const c = clientes.find(cl => cl.id === r.clienteId); return c ? `${c.nombre} ${c.apellido}` : '—'; })();
              const sb = statusReservaBadge(r.estado);
              const pb = statusPagoBadge(r.estadoPago);
              const noches = calcNights(r.fechaEntrada, r.fechaSalida);

              return (
                <div key={r.id} className="card p-4 hover:shadow-card-md transition-shadow">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <BedDouble className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-surface-900 text-sm truncate">{cabanaNombre}</p>
                        <p className="text-xs text-surface-400 truncate">{clienteNombre}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-surface-500 flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                      <span>{formatDisplayDate(r.fechaEntrada)}</span>
                      <span className="text-surface-300">→</span>
                      <span>{formatDisplayDate(r.fechaSalida)}</span>
                      <span className="badge-gray">{noches}n</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={sb.className}>{sb.label}</span>
                      <span className={pb.className}>{pb.label}</span>
                      {r.desayunoIncluido && <span className="badge-blue">Desayuno</span>}
                    </div>

                    <div className="text-right ml-auto flex-shrink-0">
                      <p className="font-bold text-surface-900 text-sm">{formatCurrency(r.precioTotal)}</p>
                      <p className="text-xs text-surface-400">{formatCurrency(r.precioPorNoche)}/noche</p>
                    </div>

                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => handleOpenEdit(r)} className="btn-icon btn-ghost btn-sm text-surface-400 hover:text-primary-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} className="btn-icon btn-ghost btn-sm text-surface-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {r.notas && (
                    <p className="mt-2 text-xs text-surface-400 border-t border-surface-100 pt-2">
                      {r.notas}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editReserva ? 'Editar Reserva' : 'Nueva Reserva'} size="lg">
        <HospedajeForm
          initialData={editReserva as never}
          onSubmit={handleSubmit as never}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Reserva"
        description="¿Estás seguro de que querés eliminar esta reserva?"
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
