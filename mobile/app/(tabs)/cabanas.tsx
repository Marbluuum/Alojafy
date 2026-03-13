import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { cabanasApi, Cabana } from '../../src/lib/api';
import { Ionicons } from '@expo/vector-icons';

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  disponible:    { label: 'Disponible',    bg: '#f0fdf4', color: '#16a34a' },
  ocupada:       { label: 'Ocupada',       bg: '#fef2f2', color: '#dc2626' },
  reservada:     { label: 'Reservada',     bg: '#eef2ff', color: '#4f46e5' },
  mantenimiento: { label: 'Mantenimiento', bg: '#fefce8', color: '#ca8a04' },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

export default function CabanasScreen() {
  const [cabanas, setCabanas] = useState<Cabana[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await cabanasApi.list();
      setCabanas(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Summary counts
  const counts = {
    disponible:    cabanas.filter(c => c.estado === 'disponible').length,
    ocupada:       cabanas.filter(c => c.estado === 'ocupada').length,
    reservada:     cabanas.filter(c => c.estado === 'reservada').length,
    mantenimiento: cabanas.filter(c => c.estado === 'mantenimiento').length,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
    >
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#4f46e5" size="large" />
        </View>
      ) : (
        <>
          {/* Summary */}
          <View style={styles.summaryGrid}>
            {Object.entries(counts).map(([status, count]) => {
              const s = STATUS[status];
              return (
                <View key={status} style={[styles.summaryCard, { backgroundColor: s.bg }]}>
                  <Text style={[styles.summaryCount, { color: s.color }]}>{count}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </View>
              );
            })}
          </View>

          {/* List */}
          <Text style={styles.sectionTitle}>{cabanas.length} alojamientos</Text>
          {cabanas.map((c) => {
            const s = STATUS[c.estado] ?? STATUS.disponible;
            return (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    <Ionicons name="home" size={20} color="#4f46e5" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{c.nombre}</Text>
                    <Text style={styles.cardLocation}>{c.ubicacion}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>

                <View style={styles.specsRow}>
                  <SpecItem icon="people-outline" value={`${c.capacidad} huésp.`} />
                  <SpecItem icon="cash-outline" value={`${formatCurrency(c.precioPorNoche)}/noche`} />
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function SpecItem({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.specItem}>
      <Ionicons name={icon as never} size={13} color="#94a3b8" />
      <Text style={styles.specText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  loadingBox: { height: 200, alignItems: 'center', justifyContent: 'center' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1, minWidth: '45%', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  summaryCount: { fontSize: 28, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card: {
    backgroundColor: 'white', borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
    padding: 14, marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  cardLocation: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  specsRow: { flexDirection: 'row', gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specText: { fontSize: 12, color: '#64748b' },
});
