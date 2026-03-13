import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { authApi } from '../../src/lib/api';
import { useAuth } from '../../src/lib/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      await login(res.token, res.user, res.organization);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🏠</Text>
          </View>
          <Text style={styles.logoText}>Alojafy</Text>
          <Text style={styles.logoSubtitle}>Gestión de Alojamientos</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>Accedé a tu panel de gestión</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@empresa.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          {/* Demo hint */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Cuenta demo</Text>
            <Text style={styles.demoText}>admin@demo.com / admin1234</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: '#4f46e5',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: { fontSize: 28 },
  logoText: { fontSize: 28, fontWeight: '700', color: 'white', letterSpacing: -0.5 },
  logoSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc',
  },
  btn: {
    backgroundColor: '#4f46e5', borderRadius: 8,
    paddingVertical: 13, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  demoBox: {
    marginTop: 20, backgroundColor: '#f1f5f9', borderRadius: 8,
    padding: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  demoTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 2, textTransform: 'uppercase' },
  demoText: { fontSize: 12, color: '#4f46e5', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
