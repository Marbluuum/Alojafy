import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { dashboardApi, DashboardStats } from '../../src/lib/api';
import { useAuth } from '../../src/lib/AuthContext';
import { router } from 'expo-router';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export default function DashboardScreen() {
  const { user, organization } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await dashboardApi.stats();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const STATUS_COLORS: Record<string, string> = {
    confirmada: '#4f46e5', pendiente: '#d97706',
    completada: '#64748b', cancelada: '#dc2626',
  };
  const STATUS_LABELS: Record<string, string> = {
    confirmada: 'Confirmada', pendiente: 'Pendiente',
    completada: 'Completada', cancelada: 'Cancelada',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] ?? 'Usuario'} 👋</Text>
          <Text style={styles.orgName}>{organization?.name}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? 'U'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#4f46e5" size="large" />
        </View>
      ) : (
        <>
          {/* KPI Grid */}
          <View style={styles.kpiGrid}>
            <KpiCard label="Alojamientos" value={stats?.totalCabanas ?? 0} sub={`${stats?.cabanasOcupadas ?? 0} ocupados`} accent="#eef2ff" accentText="#4f46e5" />
            <KpiCard label="Clientes" value={stats?.totalClientes ?? 0} sub="registrados" accent="#f0fdf4" accentText="#16a34a" />
            <KpiCard label="Ingresos Mes" value={formatCurrency(stats?.ingresosMes ?? 0)} sub="confirmados" accent="#fefce8" accentText="#ca8a04" />
            <KpiCard label="Pendientes" value={stats?.reservasPendientes ?? 0} sub="por confirmar" accent="#fef2f2" accentText="#dc2626" />
          </View>

          {/* Hoy */}
          <Text style={styles.sectionTitle}>Hoy</Text>
          <View style={styles.todayRow}>
            <TouchableOpacity style={[styles.todayCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]} onPress={() => router.push('/(tabs)/reservas')}>
              <Text style={styles.todayNumber}>{stats?.checkinsHoy ?? 0}</Text>
              <Text style={styles.todayLabel}>Check-ins</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.todayCard, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]} onPress={() => router.push('/(tabs)/reservas')}>
              <Text style={styles.todayNumber}>{stats?.checkoutsHoy ?? 0}</Text>
              <Text style={styles.todayLabel}>Check-outs</Text>
            </TouchableOpacity>
            <View style={[styles.todayCard, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
              <Text style={styles.todayNumber}>{stats?.ocupacion ?? 0}%</Text>
              <Text style={styles.todayLabel}>Ocupación</Text>
            </View>
          </View>

          {/* Recent bookings */}
          <Text style={styles.sectionTitle}>Últimas Reservas</Text>
          <View style={styles.card}>
            {(stats?.reservasRecientes ?? []).length === 0 ? (
              <Text style={styles.emptyText}>Sin reservas aún</Text>
            ) : (
              (stats?.reservasRecientes ?? []).slice(0, 5).map((r, i) => (
                <View key={r.id} style={[styles.reservaRow, i > 0 && styles.rowBorder]}>
                  <View style={styles.reservaInfo}>
                    <Text style={styles.reservaCliente}>
                      {r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : '—'}
                    </Text>
                    <Text style={styles.reservaCabana}>{r.cabana?.nombre ?? '—'}</Text>
                    <Text style={styles.reservaDates}>
                      {formatDate(r.fechaEntrada)} → {formatDate(r.fechaSalida)}
                    </Text>
                  </View>
                  <View style={styles.reservaRight}>
                    <Text style={styles.reservaPrice}>{formatCurrency(r.precioTotal)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[r.estado] + '18' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[r.estado] }]}>
                        {STATUS_LABELS[r.estado] ?? r.estado}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function KpiCard({ label, value, sub, accent, accentText }: {
  label: string; value: string | number; sub: string; accent: string; accentText: string;
}) {
  return (
    <View style={[styles.kpiCard, { backgroundColor: accent, borderColor: accentText + '30' }]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: accentText }]} numberOfLines={1} adjustsFontSizeToFit>{String(value)}</Text>
      <Text style={styles.kpiSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  orgName: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#4f46e5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 16 },
  loadingBox: { height: 200, alignItems: 'center', justifyContent: 'center' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  kpiCard: {
    flex: 1, minWidth: '45%', borderRadius: 12,
    padding: 14, borderWidth: 1,
  },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  kpiSub: { fontSize: 11, color: '#94a3b8' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  todayRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  todayCard: {
    flex: 1, borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1,
  },
  todayNumber: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  todayLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  card: {
    backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
    overflow: 'hidden', marginBottom: 16,
  },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 24 },
  reservaRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 8 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  reservaInfo: { flex: 1 },
  reservaCliente: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  reservaCabana: { fontSize: 12, color: '#64748b', marginTop: 1 },
  reservaDates: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  reservaRight: { alignItems: 'flex-end' },
  reservaPrice: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
});
