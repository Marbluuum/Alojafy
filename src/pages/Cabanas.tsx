import { useState } from 'react';
import { Plus, Edit2, Trash2, Home, Users, Bath, Maximize2, MapPin, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cabanasApi } from '../lib/api';
import type { Cabana } from '../lib/api';
import { formatCurrency, statusCabanaBadge } from '../utils/helpers';
import TopBar from '../components/layout/TopBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import CabanaForm from '../components/forms/CabanaForm';

type StatusFilter = 'todas' | 'disponible' | 'ocupada' | 'reservada' | 'mantenimiento';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'disponible', label: 'Disponible' },
  { value: 'ocupada', label: 'Ocupada' },
  { value: 'reservada', label: 'Reservada' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
];

export default function Cabanas() {
  const qc = useQueryClient();
  const { data: cabanas = [], isLoading } = useQuery({
    queryKey: ['cabanas'],
    queryFn: cabanasApi.list,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCabana, setEditCabana] = useState<Cabana | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = cabanas.filter((c) => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.ubicacion.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todas' || c.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => { setEditCabana(null); setModalOpen(true); };
  const handleOpenEdit = (c: Cabana) => { setEditCabana(c); setModalOpen(true); };

  const handleSubmit = async (data: Omit<Cabana, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) => {
    if (editCabana) {
      await cabanasApi.update(editCabana.id, data);
    } else {
      await cabanasApi.create(data);
    }
    qc.invalidateQueries({ queryKey: ['cabanas'] });
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await cabanasApi.delete(deleteId);
    qc.invalidateQueries({ queryKey: ['cabanas'] });
    setDeleteId(null);
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Alojamientos"
        subtitle={`${cabanas.length} unidades registradas`}
        actions={
          <button onClick={handleOpenAdd} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" />Nueva unidad
          </button>
        }
      />

      <div className="p-6 flex-1">
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o ubicación..." />
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
            icon={Home}
            title="No hay alojamientos"
            description="Agregá tu primera unidad para empezar a gestionar reservas"
            action={{ label: 'Agregar unidad', onClick: handleOpenAdd }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CabanaCard
                key={c.id}
                cabin={c}
                onEdit={() => handleOpenEdit(c)}
                onDelete={() => setDeleteId(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCabana ? 'Editar Alojamiento' : 'Nuevo Alojamiento'}
        size="lg"
      >
        <CabanaForm
          initialData={editCabana as never}
          onSubmit={handleSubmit as never}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Alojamiento"
        description="¿Estás seguro de que querés eliminar este alojamiento? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}

function CabanaCard({ cabin, onEdit, onDelete }: { cabin: Cabana; onEdit: () => void; onDelete: () => void }) {
  const sb = statusCabanaBadge(cabin.estado);
  return (
    <div className="card overflow-hidden flex flex-col hover:shadow-card-md transition-shadow">
      <div className="h-40 bg-gradient-to-br from-primary-100 via-primary-50 to-surface-100 relative flex items-center justify-center">
        <Home className="w-10 h-10 text-primary-200" />
        <div className="absolute top-3 left-3">
          <span className={sb.className}>{sb.label}</span>
        </div>
        <div className="absolute top-2.5 right-2.5 flex gap-1">
          <button onClick={onEdit} className="p-1.5 bg-white rounded shadow-xs text-surface-500 hover:text-primary-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 bg-white rounded shadow-xs text-surface-500 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-surface-900 text-sm mb-0.5">{cabin.nombre}</h3>
        <div className="flex items-center gap-1 text-xs text-surface-400 mb-2">
          <MapPin className="w-3 h-3" />
          <span>{cabin.ubicacion}</span>
        </div>
        <p className="text-xs text-surface-500 mb-3 line-clamp-2">{cabin.descripcion}</p>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {[
            { icon: <Users className="w-3 h-3" />, value: cabin.capacidad, label: 'Huésp.' },
            { icon: <Home className="w-3 h-3" />, value: cabin.habitaciones, label: 'Hab.' },
            { icon: <Bath className="w-3 h-3" />, value: cabin.banos, label: 'Baños' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center p-2 bg-surface-50 rounded border border-surface-100">
              <span className="text-surface-400 mb-0.5">{s.icon}</span>
              <span className="text-xs font-semibold text-surface-700">{s.value}</span>
              <span className="text-[10px] text-surface-400">{s.label}</span>
            </div>
          ))}
        </div>
        {cabin.amenidades.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {cabin.amenidades.slice(0, 3).map((a) => (
              <span key={a} className="badge-gray">{a}</span>
            ))}
            {cabin.amenidades.length > 3 && (
              <span className="badge-gray">+{cabin.amenidades.length - 3}</span>
            )}
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-surface-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-surface-400 uppercase tracking-wide">Por noche</p>
            <p className="text-base font-bold text-primary-600">{formatCurrency(cabin.precioPorNoche)}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-surface-400">
            <Maximize2 className="w-3 h-3" />
            <span>{cabin.superficieM2} m²</span>
          </div>
        </div>
      </div>
    </div>
  );
}
