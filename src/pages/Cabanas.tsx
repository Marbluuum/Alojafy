import { useState } from 'react';
import { Plus, Edit2, Trash2, Home, Users, Bath, Maximize2, MapPin } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Cabin, CabinStatus } from '../types';
import { formatCurrency, statusCabanaBadge } from '../utils/helpers';
import TopBar from '../components/layout/TopBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import CabanaForm from '../components/forms/CabanaForm';

const STATUS_OPTIONS: { value: CabinStatus | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'disponible', label: 'Disponible' },
  { value: 'ocupada', label: 'Ocupada' },
  { value: 'reservada', label: 'Reservada' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
];

export default function Cabanas() {
  const { cabanas, addCabana, updateCabana, deleteCabana } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CabinStatus | 'todas'>('todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCabana, setEditCabana] = useState<Cabin | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = cabanas.filter((c) => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.ubicacion.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todas' || c.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => { setEditCabana(null); setModalOpen(true); };
  const handleOpenEdit = (c: Cabin) => { setEditCabana(c); setModalOpen(true); };

  const handleSubmit = (data: Omit<Cabin, 'id' | 'createdAt'>) => {
    if (editCabana) {
      updateCabana(editCabana.id, data);
    } else {
      addCabana(data);
    }
    setModalOpen(false);
  };

  return (
    <div>
      <TopBar title="Cabañas" subtitle={`${cabanas.length} cabañas registradas`} />
      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar cabaña..." />
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
              Nueva Cabaña
            </button>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Home}
            title="No hay cabañas"
            description="Agrega tu primera cabaña para comenzar a gestionar reservas"
            action={{ label: 'Agregar Cabaña', onClick: handleOpenAdd }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
        title={editCabana ? 'Editar Cabaña' : 'Nueva Cabaña'}
        size="lg"
      >
        <CabanaForm
          initialData={editCabana}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteCabana(deleteId)}
        title="Eliminar Cabaña"
        description="¿Estás seguro de que deseas eliminar esta cabaña? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}

function CabanaCard({ cabin, onEdit, onDelete }: { cabin: Cabin; onEdit: () => void; onDelete: () => void }) {
  const sb = statusCabanaBadge(cabin.estado);
  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Image placeholder */}
      <div className="h-44 bg-gradient-to-br from-primary-100 to-primary-200 relative flex items-center justify-center">
        <Home className="w-12 h-12 text-primary-300" />
        <div className="absolute top-3 left-3">
          <span className={sb.className}>{sb.label}</span>
        </div>
        <div className="absolute top-3 right-3 flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 bg-white rounded-lg text-dark-500 hover:text-primary-600 shadow-sm transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-white rounded-lg text-dark-500 hover:text-red-600 shadow-sm transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-dark-800 text-base mb-1">{cabin.nombre}</h3>
        <div className="flex items-center gap-1 text-xs text-dark-400 mb-2">
          <MapPin size={12} />
          <span>{cabin.ubicacion}</span>
        </div>
        <p className="text-sm text-dark-500 mb-3 line-clamp-2">{cabin.descripcion}</p>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex flex-col items-center p-2 bg-dark-50 rounded-lg">
            <Users size={14} className="text-dark-400 mb-1" />
            <span className="text-xs font-semibold text-dark-700">{cabin.capacidad}</span>
            <span className="text-[10px] text-dark-400">Huésp.</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-dark-50 rounded-lg">
            <Home size={14} className="text-dark-400 mb-1" />
            <span className="text-xs font-semibold text-dark-700">{cabin.habitaciones}</span>
            <span className="text-[10px] text-dark-400">Hab.</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-dark-50 rounded-lg">
            <Bath size={14} className="text-dark-400 mb-1" />
            <span className="text-xs font-semibold text-dark-700">{cabin.banos}</span>
            <span className="text-[10px] text-dark-400">Baños</span>
          </div>
        </div>

        {/* Amenidades */}
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

        <div className="mt-auto pt-3 border-t border-dark-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-dark-400">Por noche</p>
            <p className="text-lg font-bold text-primary-600">{formatCurrency(cabin.precioPorNoche)}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-dark-400">
            <Maximize2 size={12} />
            <span>{cabin.superficieM2} m²</span>
          </div>
        </div>
      </div>
    </div>
  );
}
