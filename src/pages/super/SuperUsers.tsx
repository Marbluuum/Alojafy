import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Loader2, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Modal from '../../components/ui/Modal';
import { superApi } from '../../lib/api';
import type { SuperUser, OrgStats } from '../../lib/api';

const PLAN_BADGE: Record<string, string> = {
  free:       'bg-surface-100 text-surface-500',
  pro:        'bg-primary-100 text-primary-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export default function SuperUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [assignUser, setAssignUser] = useState<SuperUser | null>(null);
  const [assignOrgId, setAssignOrgId] = useState('');
  const [assignRole, setAssignRole] = useState<'ADMIN' | 'USER'>('USER');
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [toggleLoadingMap, setToggleLoadingMap] = useState<Record<string, boolean>>({});
  const [roleLoadingMap, setRoleLoadingMap] = useState<Record<string, boolean>>({});

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['super-users'],
    queryFn: superApi.users,
  });

  const { data: orgs = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['super-organizations'],
    queryFn: superApi.organizations,
  });

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.organization.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleToggleUser(userId: string) {
    setToggleLoadingMap((m) => ({ ...m, [userId]: true }));
    try {
      await superApi.toggleUserActive(userId);
      queryClient.invalidateQueries({ queryKey: ['super-users'] });
      queryClient.invalidateQueries({ queryKey: ['super-stats'] });
    } finally {
      setToggleLoadingMap((m) => ({ ...m, [userId]: false }));
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    setRoleLoadingMap((m) => ({ ...m, [userId]: true }));
    try {
      await superApi.changeUserRole(userId, role);
      queryClient.invalidateQueries({ queryKey: ['super-users'] });
    } finally {
      setRoleLoadingMap((m) => ({ ...m, [userId]: false }));
    }
  }

  async function handleAssign() {
    if (!assignUser || !assignOrgId) return;
    setAssignError('');
    setAssignLoading(true);
    try {
      await superApi.assignOrg({ userId: assignUser.id, organizationId: assignOrgId, role: assignRole });
      queryClient.invalidateQueries({ queryKey: ['super-users'] });
      queryClient.invalidateQueries({ queryKey: ['super-stats'] });
      setAssignUser(null);
      setAssignOrgId('');
      setAssignRole('USER');
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : 'Error al asignar organización');
    } finally {
      setAssignLoading(false);
    }
  }

  function openAssign(u: SuperUser) {
    setAssignUser(u);
    setAssignOrgId('');
    setAssignRole('USER');
    setAssignError('');
  }

  // Orgs the user is NOT already in (to show in the assign dropdown)
  function getAvailableOrgs(u: SuperUser): OrgStats[] {
    return orgs.filter((o) => o.id !== u.organization.id);
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Usuarios globales"
        subtitle="Todos los usuarios de la plataforma"
      />

      <div className="p-6 flex-1 space-y-6">
        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-surface-400">Total usuarios</p>
              <p className="text-2xl font-bold text-primary-600">{users.length}</p>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-surface-400">Organizaciones</p>
              <p className="text-2xl font-bold text-emerald-600">{orgs.length}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email u organización..."
            className="input pl-9"
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100">
            <h2 className="text-sm font-semibold text-surface-900">Todos los usuarios</h2>
            <p className="text-xs text-surface-400 mt-0.5">{filtered.length} usuarios encontrados</p>
          </div>

          {loadingUsers || loadingOrgs ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Organización</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Rol</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Estado</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700 flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-surface-900 text-sm leading-tight">{u.name}</p>
                            <p className="text-xs text-surface-400 leading-tight">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-primary-700/20 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3 h-3 text-primary-400" />
                          </div>
                          <div>
                            <p className="text-sm text-surface-700 leading-tight">{u.organization.name}</p>
                            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${PLAN_BADGE[u.organization.plan] ?? 'bg-surface-100 text-surface-500'}`}>
                              {u.organization.plan}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {roleLoadingMap[u.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`text-xs font-medium border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer ${
                              u.role === 'SUPER_ADMIN' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                              u.role === 'ADMIN' ? 'bg-primary-50 border-primary-200 text-primary-700' :
                              'bg-surface-50 border-surface-200 text-surface-600'
                            }`}
                          >
                            <option value="USER">Usuario</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          disabled={!!toggleLoadingMap[u.id]}
                          className="flex items-center gap-1.5 text-xs mx-auto disabled:opacity-40"
                          title={u.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {toggleLoadingMap[u.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
                          ) : u.isActive ? (
                            <><ToggleRight className="w-5 h-5 text-emerald-600" /><span className="text-emerald-700">Activo</span></>
                          ) : (
                            <><ToggleLeft className="w-5 h-5 text-surface-400" /><span className="text-surface-500">Inactivo</span></>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openAssign(u)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2.5 py-1.5 rounded transition-colors"
                          title="Asignar a otra organización"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Asignar org
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-surface-400">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Asignar organización */}
      <Modal
        isOpen={!!assignUser}
        onClose={() => setAssignUser(null)}
        title="Asignar a organización"
        size="sm"
      >
        {assignUser && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700 flex-shrink-0">
                {assignUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">{assignUser.name}</p>
                <p className="text-xs text-surface-400">{assignUser.email}</p>
              </div>
            </div>

            {assignError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-3 py-2">
                {assignError}
              </div>
            )}

            <div>
              <label className="label">Organización destino</label>
              <select
                value={assignOrgId}
                onChange={(e) => setAssignOrgId(e.target.value)}
                className="input"
              >
                <option value="">Seleccioná una organización</option>
                {getAvailableOrgs(assignUser).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.plan})
                  </option>
                ))}
              </select>
              {getAvailableOrgs(assignUser).length === 0 && (
                <p className="text-xs text-surface-400 mt-1">El usuario ya está en todas las organizaciones</p>
              )}
            </div>

            <div>
              <label className="label">Rol en la organización</label>
              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value as 'ADMIN' | 'USER')}
                className="input"
              >
                <option value="USER">Usuario — puede ver y crear reservas</option>
                <option value="ADMIN">Administrador — acceso completo</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignUser(null)}
                className="btn-secondary btn-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssign}
                disabled={!assignOrgId || assignLoading}
                className="btn-primary btn-sm"
              >
                {assignLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Asignar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
