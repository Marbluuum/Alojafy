import { useQuery } from '@tanstack/react-query';
import { Building2, Users, CalendarDays, TrendingUp, Crown, CreditCard, Loader2 } from 'lucide-react';
import { superApi } from '../../lib/api';
import type { OrgStats } from '../../lib/api';
import TopBar from '../../components/layout/TopBar';
import { formatCurrency } from '../../utils/helpers';

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
  const { data: stats, isLoading } = useQuery({
    queryKey: ['super-stats'],
    queryFn: superApi.stats,
  });

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
      isRevenue: true,
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Panel Super Admin"
        subtitle="Vista global de la plataforma Alojafy"
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
                      <th className="text-right px-5 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-50">
                    {stats?.orgs.map((org: OrgStats) => (
                      <tr key={org.id} className="hover:bg-surface-50 transition-colors">
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
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-semibold text-surface-900">{formatCurrency(org.revenue)}</span>
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
                  <p className="text-xs text-surface-400 mt-0.5">Estado de planes por organización</p>
                </div>
              </div>
              <div className="divide-y divide-surface-50">
                {stats?.orgs.map((org: OrgStats) => (
                  <div key={org.id} className="px-5 py-4 flex items-center justify-between gap-4">
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
                      <PlanBadge plan={org.plan} />
                      <div className="text-right">
                        <p className="text-xs font-semibold text-surface-700">{formatCurrency(org.revenue)}</p>
                        <p className="text-[10px] text-surface-400">ingresos</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Activo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
