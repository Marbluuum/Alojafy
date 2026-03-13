import { useState } from 'react';
import { Plus, Edit2, Trash2, Users, Mail, Phone, MapPin, Hash, BedDouble } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Client } from '../types';
import { formatDisplayDate } from '../utils/helpers';
import TopBar from '../components/layout/TopBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import ClienteForm from '../components/forms/ClienteForm';

export default function Clientes() {
  const { clientes, reservas, addCliente, updateCliente, deleteCliente } = useStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = clientes.filter((c) => {
    const full = `${c.nombre} ${c.apellido} ${c.email} ${c.telefono} ${c.dni}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  const handleOpenAdd = () => { setEditCliente(null); setModalOpen(true); };
  const handleOpenEdit = (c: Client) => { setEditCliente(c); setModalOpen(true); };

  return (
    <div>
      <TopBar title="Clientes" subtitle={`${clientes.length} clientes registrados`} />
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente..." />
          <div className="ml-auto">
            <button onClick={handleOpenAdd} className="btn-primary">
              <Plus size={16} />
              Nuevo Cliente
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay clientes"
            description="Registra tu primer cliente para comenzar a gestionar reservas"
            action={{ label: 'Agregar Cliente', onClick: handleOpenAdd }}
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Cliente</th>
                  <th className="table-header hidden md:table-cell">Contacto</th>
                  <th className="table-header hidden lg:table-cell">DNI / País</th>
                  <th className="table-header hidden sm:table-cell">Reservas</th>
                  <th className="table-header hidden lg:table-cell">Registrado</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const clientReservas = reservas.filter((r) => r.clienteId === c.id);
                  return (
                    <tr key={c.id} className="hover:bg-dark-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary-700">
                              {c.nombre.charAt(0)}{c.apellido.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-dark-800">{c.nombre} {c.apellido}</p>
                            <p className="text-xs text-dark-400 md:hidden">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-dark-600">
                            <Mail size={13} className="text-dark-400" />
                            <span className="truncate max-w-[180px]">{c.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-dark-600">
                            <Phone size={13} className="text-dark-400" />
                            {c.telefono}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-dark-600">
                            <Hash size={13} className="text-dark-400" />
                            {c.dni}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-dark-600">
                            <MapPin size={13} className="text-dark-400" />
                            {c.ciudad ? `${c.ciudad}, ` : ''}{c.pais}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 badge-blue">
                            <BedDouble size={11} />
                            {clientReservas.length}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell hidden lg:table-cell text-dark-400 text-xs">
                        {formatDisplayDate(c.createdAt)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(c.id)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
          initialData={editCliente}
          onSubmit={(data) => {
            if (editCliente) updateCliente(editCliente.id, data);
            else addCliente(data);
            setModalOpen(false);
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteCliente(deleteId)}
        title="Eliminar Cliente"
        description="¿Estás seguro de que deseas eliminar este cliente? Sus reservas no serán eliminadas."
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
