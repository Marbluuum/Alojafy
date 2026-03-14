import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Users, CalendarDays, TrendingUp, Crown,
  CreditCard, Loader2, Plus, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { superApi } from '../../lib/api';
import type { OrgStats } from '../../lib/api';
import TopBar from '../../components/layout/TopBar';
import Modal from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/helpers';

const createOrgSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  adminName: z.string().min(2, 'Mínimo 2 caracteres'),
  adminEmail: z.string().email('Email inválido'),
  adminPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  plan: z.enum(['free', 'pro', 'enterprise']),
});
type CreateOrgForm = z.infer<typeof createOrgSchema>;

const PLAN_BADGE: Record<string, string> = {
  free:       'bg-surface-100 text-surface-500',
  pro:        'bg-primary-100 text-primary-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

function PlanBadge({ plan }: { plan: string }) {
  const cls = PLAN_BADGE[plan] ?? 'bg-surface-100 text-surface-500';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {plan}
    </span>
  );
}

export default function SuperAdmin() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['super-stats'],
    queryFn: superApi.stats,
  });

  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [createOrgError, setCreateOrgError] = useState('');

  // Inline plan change loading state: orgId → loading
  const [planLoading, setPlanLoading] = useState<Record<string, boolean>>({});
  // Inline org toggle loading state
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({});

  const createOrgForm = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { plan: 'free' },
  });

  async function handleCreateOrg(data: CreateOrgForm) {
    setCreateOrgError('');
    try {
      await superApi.createOrganization(data);
      setCreateOrgOpen(false);
      createOrgForm.reset({ plan: 'free' });
      queryClient.invalidateQueries({ queryKey: ['super-stats'] });
      // Also refresh org switcher
      queryClient.invalidateQueries({ queryKey: ['auth-organizations'] });
    } catch (e: unknown) {
      setCreateOrgError(e instanceof Error ? e.message : 'Error al crear la organización');
    }
  }

  async function handlePlanChange(orgId: string, plan: string) {
    setPlanLoading((p) => ({ ...p, [orgId]: true }));
    try {
      await superApi.updateOrgPlan(orgId, plan);
      queryClient.invalidateQueries({ queryKey: ['super-stats'] });
    } finally {
      setPlanLoading((p) => ({ ...p, [orgId]: false }));
    }
  }

  async function handleActivateAll() {
    try {
      await superApi.activateAllOrgs();
      queryClient.invalidateQueries({ queryKey: ['super-stats'] });
      queryClient.invalidateQueries({ queryKey: ['auth-organizations'] });
    } catch { /* ignore */ }
  }

  async function handleToggleOrg(orgId: string) {
    setToggleLoading((p) => ({ ...p, [orgId]: true }));
    try {
      await superApi.toggleOrgActive(orgId);
      queryClient.invalidateQueries({ queryKey: ['super-stats'] });
      queryClient.invalidateQueries({ queryKey: ['auth-organizations'] });
    } finally {
      setToggleLoading((p) => ({ ...p, [orgId]: false }));
    }
  }

  const summaryCards = [
    {
      label: 'Organizaciones',
      value: stats?.totalOrgs ?? 0,
      icon: Building2,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Usuarios totales',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Reservas totales',
      value: stats?.totalReservas ?? 0,
      icon: CalendarDays,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Ingresos totales',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: TrendingUp,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Panel Super Admin"
        subtitle="Vista global de la plataforma Alojafy"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleActivateAll}
              className="btn-secondary btn-sm"
              title="Activar todas las organizaciones"
            >
              Activar todas
            </button>
            <button
              onClick={() => { createOrgForm.reset({ plan: 'free' }); setCreateOrgError(''); setCreateOrgOpen(true); }}
              className="btn-primary btn-sm"
            >
              <Plus className="w-3.5 h-3.5" />Nueva Organización
            </button>
          </div>
        }
      />

      <div className="p-6 flex-1 space-y-8">
        {/* Header badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Crown className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">Super Administrador</p>
            <p className="text-xs text-surface-400">Acceso completo a todas las organizaciones</p>
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-surface-400 mb-1">{label}</p>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                      <Icon className={`w-4.5 h-4.5 ${color}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Organizations Table */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-100">
                <h2 className="text-sm font-semibold text-surface-900">Todas las organizaciones</h2>
                <p className="text-xs text-surface-400 mt-0.5">{stats?.orgs.length ?? 0} organizaciones registradas</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-50 border-b border-surface-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Organización</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Plan</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Usuarios</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Reservas</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Ingresos</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {stats?.orgs.map((org: OrgStats) => (
                      <tr key={org.id} className={`hover:bg-surface-50 transition-colors ${org.isActive === false ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-surface-900 text-sm">{org.name}</p>
                              <p className="text-[11px] text-surface-400">{org.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <PlanBadge plan={org.plan} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-medium text-surface-700">{org.userCount}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-medium text-surface-700">{org.reservaCount}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-semibold text-surface-900">{formatCurrency(org.revenue)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleOrg(org.id)}
                            disabled={!!toggleLoading[org.id]}
                            className="flex items-center gap-1.5 text-xs mx-auto disabled:opacity-40"
                            title={org.isActive !== false ? 'Desactivar' : 'Activar'}
                          >
                            {toggleLoading[org.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
                            ) : org.isActive !== false ? (
                              <><ToggleRight className="w-5 h-5 text-emerald-600" /><span className="text-emerald-700">Activo</span></>
                            ) : (
                              <><ToggleLeft className="w-5 h-5 text-surface-400" /><span className="text-surface-500">Inactivo</span></>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Billing / Payments Section */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-surface-400" />
                <div>
                  <h2 className="text-sm font-semibold text-surface-900">Facturación y Planes</h2>
                  <p className="text-xs text-surface-400 mt-0.5">Cambiá el plan de cada organización</p>
                </div>
              </div>
              <div className="divide-y divide-surface-50">
                {stats?.orgs.map((org: OrgStats) => (
                  <div key={org.id} className={`px-5 py-4 flex items-center justify-between gap-4 ${org.isActive === false ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-surface-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{org.name}</p>
                        <p className="text-xs text-surface-400 truncate">
                          {org.userCount} usuario{org.userCount !== 1 ? 's' : ''} · {org.reservaCount} reserva{org.reservaCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Inline plan selector */}
                      <div className="relative">
                        {planLoading[org.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
                        ) : (
                          <select
                            value={org.plan}
                            onChange={(e) => handlePlanChange(org.id, e.target.value)}
                            disabled={org.isActive === false}
                            className="text-[11px] font-semibold uppercase border border-surface-200 rounded px-2 py-1 bg-white text-surface-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-surface-700">{formatCurrency(org.revenue)}</p>
                        <p className="text-[10px] text-surface-400">ingresos</p>
                      </div>
                      {/* Toggle org active */}
                      <button
                        onClick={() => handleToggleOrg(org.id)}
                        disabled={!!toggleLoading[org.id]}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors disabled:opacity-40 ${
                          org.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600'
                            : 'bg-surface-100 text-surface-500 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                        title={org.isActive !== false ? 'Click para desactivar' : 'Click para activar'}
                      >
                        {toggleLoading[org.id] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${org.isActive !== false ? 'bg-emerald-500' : 'bg-surface-400'}`} />
                        )}
                        {org.isActive !== false ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal: Nueva Organización */}
      <Modal isOpen={createOrgOpen} onClose={() => setCreateOrgOpen(false)} title="Nueva Organización" size="sm">
        <form onSubmit={createOrgForm.handleSubmit(handleCreateOrg)} className="space-y-4">
          {createOrgError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded px-3 py-2">
              {createOrgError}
            </div>
          )}
          <div>
            <label className="label">Nombre de la organización</label>
            <input {...createOrgForm.register('name')} className="input" placeholder="Mi Complejo" />
            {createOrgForm.formState.errors.name && (
              <p className="form-error">{createOrgForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="label">Nombre del administrador</label>
            <input {...createOrgForm.register('adminName')} className="input" placeholder="Juan Pérez" />
            {createOrgForm.formState.errors.adminName && (
              <p className="form-error">{createOrgForm.formState.errors.adminName.message}</p>
            )}
          </div>
          <div>
            <label className="label">Email del administrador</label>
            <input {...createOrgForm.register('adminEmail')} type="email" className="input" placeholder="admin@empresa.com" />
            {createOrgForm.formState.errors.adminEmail && (
              <p className="form-error">{createOrgForm.formState.errors.adminEmail.message}</p>
            )}
          </div>
          <div>
            <label className="label">Contraseña del administrador</label>
            <input {...createOrgForm.register('adminPassword')} type="password" className="input" placeholder="Mínimo 8 caracteres" />
            {createOrgForm.formState.errors.adminPassword && (
              <p className="form-error">{createOrgForm.formState.errors.adminPassword.message}</p>
            )}
          </div>
          <div>
            <label className="label">Plan</label>
            <select {...createOrgForm.register('plan')} className="input">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOrgOpen(false)} className="btn-secondary btn-sm">
              Cancelar
            </button>
            <button type="submit" disabled={createOrgForm.formState.isSubmitting} className="btn-primary btn-sm">
              {createOrgForm.formState.isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Crear organización'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
