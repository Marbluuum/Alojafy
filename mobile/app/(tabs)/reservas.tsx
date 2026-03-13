import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { reservasApi, Reserva } from '../../src/lib/api';
import { Ionicons } from '@expo/vector-icons';

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' });
}

function calcNights(from: string, to: string) {
  const d1 = new Date(from + 'T12:00:00');
  const d2 = new Date(to + 'T12:00:00');
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  confirmada: { label: 'Confirmada', bg: '#eef2ff', color: '#4f46e5' },
  pendiente:  { label: 'Pendiente',  bg: '#fefce8', color: '#ca8a04' },
  completada: { label: 'Completada', bg: '#f0fdf4', color: '#16a34a' },
  cancelada:  { label: 'Cancelada',  bg: '#fef2f2', color: '#dc2626' },
};

const PAGO_CONFIG: Record<string, { label: string; color: string }> = {
  pagado:     { label: 'Pagado',     color: '#16a34a' },
  pendiente:  { label: 'Pago pend.', color: '#ca8a04' },
  parcial:    { label: 'Parcial',    color: '#d97706' },
  reembolsado:{ label: 'Reembolsado',color: '#64748b' },
};

const STATUS_FILTERS = ['todas', 'confirmada', 'pendiente', 'completada', 'cancelada'] as const;

export default function ReservasScreen() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('todas');

  async function load() {
    try {
      const data = await reservasApi.list();
      setReservas(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = reservas
    .filter(r => filter === 'todas' || r.estado === filter)
    .sort((a, b) => b.fechaEntrada.localeCompare(a.fechaEntrada));

  async function handleChangeStatus(r: Reserva, newStatus: string) {
    try {
      await reservasApi.update(r.id, { estado: newStatus as Reserva['estado'] });
      load();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la reserva');
    }
  }

  function showStatusMenu(r: Reserva) {
    Alert.alert('Cambiar estado', undefined, [
      { text: 'Confirmar',  onPress: () => handleChangeStatus(r, 'confirmada') },
      { text: 'Completar',  onPress: () => handleChangeStatus(r, 'completada') },
      { text: 'Cancelar',   onPress: () => handleChangeStatus(r, 'cancelada'), style: 'destructive' },
      { text: 'Cerrar',     style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filters}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'todas' ? 'Todas' : STATUS_CONFIG[f]?.label ?? f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#4f46e5" size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Sin reservas</Text>
              <Text style={styles.emptyDesc}>No hay reservas con este filtro</Text>
            </View>
          ) : (
            filtered.map((r) => {
              const sc = STATUS_CONFIG[r.estado] ?? STATUS_CONFIG.pendiente;
              const pc = PAGO_CONFIG[r.estadoPago] ?? PAGO_CONFIG.pendiente;
              const noches = calcNights(r.fechaEntrada, r.fechaSalida);

              return (
                <View key={r.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cabanaInfo}>
                      <View style={styles.cabanaIcon}>
                        <Ionicons name="home" size={16} color="#4f46e5" />
                      </View>
                      <View>
                        <Text style={styles.cabanaNombre}>{r.cabana?.nombre ?? '—'}</Text>
                        <Text style={styles.clienteNombre}>
                          {r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : '—'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => showStatusMenu(r)} style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                      <Ionicons name="chevron-down" size={10} color={sc.color} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.datesRow}>
                    <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                    <Text style={styles.datesText}>{formatDate(r.fechaEntrada)} → {formatDate(r.fechaSalida)}</Text>
                    <View style={styles.nightsBadge}>
                      <Text style={styles.nightsText}>{noches}n</Text>
                    </View>
                    <Text style={[styles.pagoText, { color: pc.color }]}>{pc.label}</Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatCurrency(r.precioTotal)}</Text>
                    <Text style={styles.priceNight}>{formatCurrency(r.precioPorNoche)}/noche · {r.numHuespedes} huésp.</Text>
                  </View>

                  {r.notas && <Text style={styles.notas}>{r.notas}</Text>}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filtersContainer: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', maxHeight: 52 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: 'white' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  card: {
    backgroundColor: 'white', borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cabanaInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cabanaIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center',
  },
  cabanaNombre: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  clienteNombre: { fontSize: 12, color: '#64748b', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  datesText: { fontSize: 12, color: '#475569', flex: 1 },
  nightsBadge: {
    backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
  },
  nightsText: { fontSize: 10, color: '#64748b', fontWeight: '700' },
  pagoText: { fontSize: 11, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  priceNight: { fontSize: 11, color: '#94a3b8' },
  notas: { marginTop: 8, fontSize: 12, color: '#64748b', fontStyle: 'italic', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
});
