import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, BedDouble, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Booking, BookingStatus } from '../types';
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

const STATUS_OPTIONS: { value: BookingStatus | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'completada', label: 'Completadas' },
  { value: 'cancelada', label: 'Canceladas' },
];

export default function Hospedajes() {
  const { reservas, cabanas, clientes, addReserva, updateReserva, deleteReserva } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'todas'>('todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editReserva, setEditReserva] = useState<Booking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getCabana = (id: string) => cabanas.find((c) => c.id === id);
  const getCliente = (id: string) => clientes.find((c) => c.id === id);

  const filtered = useMemo(() => {
    return reservas.filter((r) => {
      const cabana = getCabana(r.cabanaId);
      const cliente = getCliente(r.clienteId);
      const searchStr = `${cabana?.nombre ?? ''} ${cliente?.nombre ?? ''} ${cliente?.apellido ?? ''}`.toLowerCase();
      const matchSearch = searchStr.includes(search.toLowerCase());
      const matchStatus = statusFilter === 'todas' || r.estado === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [reservas, search, statusFilter, cabanas, clientes]);

  const handleOpenAdd = () => { setEditReserva(null); setModalOpen(true); };
  const handleOpenEdit = (r: Booking) => { setEditReserva(r); setModalOpen(true); };

  const handleSubmit = (data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editReserva) updateReserva(editReserva.id, data);
    else addReserva(data);
    setModalOpen(false);
  };

  return (
    <div>
      <TopBar title="Hospedajes" subtitle={`${reservas.length} reservas en total`} />
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar reserva..." />
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === opt.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-dark-600 border border-dark-200 hover:bg-dark-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} />
              Nueva Reserva
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Confirmadas', value: reservas.filter((r) => r.estado === 'confirmada').length, color: 'text-primary-600' },
            { label: 'Pendientes', value: reservas.filter((r) => r.estado === 'pendiente').length, color: 'text-accent-600' },
            { label: 'Completadas', value: reservas.filter((r) => r.estado === 'completada').length, color: 'text-dark-500' },
            { label: 'Canceladas', value: reservas.filter((r) => r.estado === 'cancelada').length, color: 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-dark-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={BedDouble}
            title="No hay reservas"
            description="Crea tu primera reserva para comenzar a gestionar hospedajes"
            action={{ label: 'Nueva Reserva', onClick: handleOpenAdd }}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const cabana = getCabana(r.cabanaId);
              const cliente = getCliente(r.clienteId);
              const sb = statusReservaBadge(r.estado);
              const pb = statusPagoBadge(r.estadoPago);
              const noches = calcNights(r.fechaEntrada, r.fechaSalida);

              return (
                <div key={r.id} className="card p-4 hover:shadow-card-hover transition-shadow">
                  <div className="flex flex-wrap gap-4 items-start">
                    {/* Cabaña info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <BedDouble className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-dark-800 text-sm">{cabana?.nombre ?? 'Cabaña N/A'}</p>
                        <p className="text-xs text-dark-400">{cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente N/A'}</p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm text-dark-600">
                      <Calendar size={14} className="text-dark-400" />
                      <span>{formatDisplayDate(r.fechaEntrada)}</span>
                      <span className="text-dark-300">→</span>
                      <span>{formatDisplayDate(r.fechaSalida)}</span>
                      <span className="badge-gray">{noches} noche{noches !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Status & Payment */}
                    <div className="flex items-center gap-2">
                      <span className={sb.className}>{sb.label}</span>
                      <span className={pb.className}>{pb.label}</span>
                      {r.desayunoIncluido && <span className="badge-blue">Desayuno</span>}
                    </div>

                    {/* Price */}
                    <div className="text-right ml-auto">
                      <p className="font-bold text-dark-800">{formatCurrency(r.precioTotal)}</p>
                      <p className="text-xs text-dark-400">{formatCurrency(r.precioPorNoche)}/noche</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-2 rounded-lg text-dark-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(r.id)}
                        className="p-2 rounded-lg text-dark-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {r.notas && (
                    <p className="mt-2 text-xs text-dark-400 border-t border-dark-50 pt-2">
                      💬 {r.notas}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editReserva ? 'Editar Reserva' : 'Nueva Reserva'}
        size="lg"
      >
        <HospedajeForm
          initialData={editReserva}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteReserva(deleteId)}
        title="Eliminar Reserva"
        description="¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
