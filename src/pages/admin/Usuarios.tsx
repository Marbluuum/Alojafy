import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Shield, User, ToggleLeft, ToggleRight, Loader2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TopBar from '../../components/layout/TopBar';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { usersApi } from '../../lib/api';
import type { AppUser } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const createSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'USER']),
});
type CreateForm = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'USER']),
  password: z.string().min(8).or(z.literal('')),
});
type EditForm = z.infer<typeof editSchema>;

export default function Usuarios() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AppUser | null>(null);
  const [activationToast, setActivationToast] = useState('');

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'USER' },
  });
  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { password: '' },
  });

  async function load() {
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch {
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(data: CreateForm) {
    await usersApi.create(data);
    setCreateOpen(false);
    createForm.reset();
    load();
  }

  async function handleEdit(data: EditForm) {
    if (!editUser) return;
    const payload: Partial<AppUser & { password: string }> = { name: data.name, role: data.role };
    if (data.password) payload.password = data.password;
    await usersApi.update(editUser.id, payload);
    setEditUser(null);
    load();
  }

  async function handleToggleActive(u: AppUser) {
    await usersApi.update(u.id, { isActive: !u.isActive });
    load();
  }

  async function handleDelete() {
    if (!deleteUser) return;
    await usersApi.delete(deleteUser.id);
    setDeleteUser(null);
    load();
  }

  async function handleSendActivation(u: AppUser) {
    try {
      await usersApi.sendActivation(u.id);
      setActivationToast('Email de activación enviado');
      setTimeout(() => setActivationToast(''), 3000);
    } catch {
      setActivationToast('Error al enviar el email');
      setTimeout(() => setActivationToast(''), 3000);
    }
  }

  function openEdit(u: AppUser) {
    setEditUser(u);
    editForm.reset({ name: u.name, role: u.role as 'ADMIN' | 'USER', password: '' });
  }

  return (
    <div className="flex flex-col flex-1">
      {activationToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {activationToast}
        </div>
      )}
      <TopBar
        title="Usuarios"
        subtitle="Gestioná los miembros de tu equipo y sus permisos"
        actions={
          <button onClick={() => { createForm.reset({ role: 'USER' }); setCreateOpen(true); }} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" />Invitar usuario
          </button>
        }
      />

      <div className="p-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
        ) : (
          <div className="card">
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Miembro desde</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-surface-900 text-sm">{u.name}</p>
                            {u.id === me?.id && (
                              <span className="text-[10px] text-surface-400">(vos)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-surface-500">{u.email}</td>
                      <td>
                        <span className={u.role === 'ADMIN' ? 'badge-indigo' : 'badge-gray'}>
                          {u.role === 'ADMIN' ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {u.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => u.id !== me?.id && handleToggleActive(u)}
                          disabled={u.id === me?.id}
                          className="flex items-center gap-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          title={u.id === me?.id ? 'No podés cambiar tu propio estado' : undefined}
                        >
                          {u.isActive ? (
                            <><ToggleRight className="w-5 h-5 text-emerald-600" /><span className="text-emerald-700 text-xs">Activo</span></>
                          ) : (
                            <><ToggleLeft className="w-5 h-5 text-amber-400" /><span className="text-amber-600 text-xs">Pendiente activación</span></>
                          )}
                        </button>
                      </td>
                      <td className="text-surface-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSendActivation(u)}
                            className="btn-icon btn-ghost btn-sm text-surface-400 hover:text-emerald-600"
                            title="Enviar activación"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(u)}
                            className="btn-icon btn-ghost btn-sm text-surface-400 hover:text-primary-600"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => u.id !== me?.id && setDeleteUser(u)}
                            disabled={u.id === me?.id}
                            className="btn-icon btn-ghost btn-sm text-surface-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.id === me?.id ? 'No podés eliminarte a vos mismo' : 'Eliminar'}
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
          </div>
        )}
      </div>

      {/* Modal: crear usuario */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Invitar usuario" size="sm">
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
          <div className="bg-primary-50 border border-primary-100 rounded-lg px-3.5 py-3 text-xs text-primary-700 flex items-start gap-2">
            <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>Se enviará un email al usuario para que cree su contraseña. El enlace expira en 24 horas.</span>
          </div>
          <div>
            <label className="label">Nombre completo</label>
            <input {...createForm.register('name')} className="input" placeholder="Juan Pérez" />
            {createForm.formState.errors.name && <p className="form-error">{createForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input {...createForm.register('email')} type="email" className="input" placeholder="juan@empresa.com" />
            {createForm.formState.errors.email && <p className="form-error">{createForm.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Rol</label>
            <select {...createForm.register('role')} className="input">
              <option value="USER">Usuario — puede ver y crear reservas</option>
              <option value="ADMIN">Administrador — acceso completo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary btn-sm">Cancelar</button>
            <button type="submit" disabled={createForm.formState.isSubmitting} className="btn-primary btn-sm">
              {createForm.formState.isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Mail className="w-3.5 h-3.5" />Enviar invitación</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: editar usuario */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Editar usuario" size="sm">
        <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input {...editForm.register('name')} className="input" />
            {editForm.formState.errors.name && <p className="form-error">{editForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Rol</label>
            <select {...editForm.register('role')} className="input">
              <option value="USER">Usuario</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div>
            <label className="label">Nueva contraseña <span className="text-surface-400 font-normal">(dejá vacío para no cambiar)</span></label>
            <input {...editForm.register('password')} type="password" className="input" placeholder="Mínimo 8 caracteres" />
            {editForm.formState.errors.password && <p className="form-error">{editForm.formState.errors.password.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditUser(null)} className="btn-secondary btn-sm">Cancelar</button>
            <button type="submit" disabled={editForm.formState.isSubmitting} className="btn-primary btn-sm">
              {editForm.formState.isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Eliminar usuario"
        message={`¿Estás seguro de que querés eliminar a ${deleteUser?.name}? Esta acción no se puede deshacer.`}
        isDanger
      />
    </div>
  );
}
