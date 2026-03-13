import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/lib/AuthContext';

export default function PerfilScreen() {
  const { user, organization, logout } = useAuth();

  function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que querés salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir', style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={[styles.roleBadge, isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser]}>
          <Text style={[styles.roleText, isAdmin ? styles.roleTextAdmin : styles.roleTextUser]}>
            {isAdmin ? '👑 Administrador' : '👤 Usuario'}
          </Text>
        </View>
      </View>

      {/* Org info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Organización</Text>
        <View style={styles.card}>
          <InfoRow icon="business-outline" label="Nombre" value={organization?.name ?? '—'} />
          <InfoRow icon="code-outline" label="Identificador" value={organization?.slug ?? '—'} />
          <InfoRow icon="star-outline" label="Plan" value={organization?.plan ?? '—'} />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
            <Text style={styles.actionText}>Cambiar contraseña</Text>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={styles.actionChevron} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.actionBorder]}>
            <Ionicons name="notifications-outline" size={18} color="#64748b" />
            <Text style={styles.actionText}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={styles.actionChevron} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Alojafy v1.0.0</Text>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as never} size={16} color="#94a3b8" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 28, paddingTop: 12 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  avatarText: { color: 'white', fontSize: 28, fontWeight: '800' },
  userName: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleBadgeAdmin: { backgroundColor: '#eef2ff' },
  roleBadgeUser: { backgroundColor: '#f1f5f9' },
  roleText: { fontSize: 12, fontWeight: '700' },
  roleTextAdmin: { color: '#4f46e5' },
  roleTextUser: { color: '#64748b' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  card: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10 },
  infoLabel: { fontSize: 13, color: '#64748b', flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  actionBorder: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionText: { fontSize: 14, color: '#0f172a', flex: 1 },
  actionChevron: { marginLeft: 'auto' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#fecaca', marginBottom: 24,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  version: { textAlign: 'center', fontSize: 11, color: '#cbd5e1' },
});
