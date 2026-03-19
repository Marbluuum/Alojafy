import { useState } from 'react';
import { Plus, Edit2, Trash2, Users, Mail, Phone, MapPin, Hash, BedDouble, Loader2, Download } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '../lib/api';
import type { Cliente } from '../lib/api';
import { formatDisplayDate } from '../utils/helpers';
import TopBar from '../components/layout/TopBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import ClienteForm from '../components/forms/ClienteForm';

export default function Clientes() {
  const qc = useQueryClient();
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.list,
  });

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = clientes.filter((c) => {
    const full = `${c.nombre} ${c.apellido} ${c.email} ${c.telefono} ${c.dni}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  const handleOpenAdd = () => { setEditCliente(null); setModalOpen(true); };
  const handleOpenEdit = (c: Cliente) => { setEditCliente(c); setModalOpen(true); };

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try { await clientesApi.exportCsv(); } finally { setExporting(false); }
  };

  const handleSubmit = async (data: Omit<Cliente, 'id' | 'createdAt' | 'organizationId' | 'cantidadReservas'>) => {
    if (editCliente) {
      await clientesApi.update(editCliente.id, data);
    } else {
      await clientesApi.create(data);
    }
    qc.invalidateQueries({ queryKey: ['clientes'] });
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await clientesApi.delete(deleteId);
    qc.invalidateQueries({ queryKey: ['clientes'] });
    setDeleteId(null);
  };

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Clientes"
        subtitle={`${clientes.length} clientes registrados`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExport} disabled={exporting} className="btn-secondary btn-sm">
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Exportar CSV
            </button>
            <button onClick={handleOpenAdd} className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" />Nuevo cliente
            </button>
          </div>
        }
      />

      <div className="p-6 flex-1">
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, email o DNI..." />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay clientes"
            description="Registrá tu primer cliente para empezar a gestionar reservas"
            action={{ label: 'Agregar cliente', onClick: handleOpenAdd }}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="hidden md:table-cell">Contacto</th>
                  <th className="hidden lg:table-cell">DNI / País</th>
                  <th className="hidden sm:table-cell">Reservas</th>
                  <th className="hidden lg:table-cell">Registrado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-700">
                            {c.nombre.charAt(0)}{c.apellido.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">{c.nombre} {c.apellido}</p>
                          <p className="text-xs text-surface-400 md:hidden">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-surface-600">
                          <Mail className="w-3 h-3 text-surface-400" />
                          <span className="truncate max-w-[180px]">{c.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-surface-600">
                          <Phone className="w-3 h-3 text-surface-400" />
                          {c.telefono}
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-surface-600">
                          <Hash className="w-3 h-3 text-surface-400" />
                          {c.dni}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-surface-600">
                          <MapPin className="w-3 h-3 text-surface-400" />
                          {c.ciudad ? `${c.ciudad}, ` : ''}{c.pais}
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="badge-blue">
                        <BedDouble className="w-3 h-3" />
                        {c.cantidadReservas ?? 0}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell text-surface-400 text-xs">
                      {formatDisplayDate(c.createdAt)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="btn-icon btn-ghost btn-sm text-surface-400 hover:text-primary-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="btn-icon btn-ghost btn-sm text-surface-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="md"
      >
        <ClienteForm
          initialData={editCliente as never}
          onSubmit={handleSubmit as never}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        description="¿Estás seguro de que querés eliminar este cliente?"
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
