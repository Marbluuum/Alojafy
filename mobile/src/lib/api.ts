import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

const TOKEN_KEY = 'alojafy_token';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// Types
export interface AuthUser { id: string; name: string; email: string; role: string; }
export interface AuthOrg  { id: string; name: string; slug: string; plan: string; }
export interface AuthResponse { token: string; user: AuthUser; organization: AuthOrg; }

export interface DashboardStats {
  totalCabanas: number;
  cabanasOcupadas: number;
  totalClientes: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  ingresosMes: number;
  ocupacion: number;
  checkinsHoy: number;
  checkoutsHoy: number;
  reservasRecientes: Reserva[];
}

export interface Cabana {
  id: string; nombre: string; estado: string;
  capacidad: number; precioPorNoche: number; ubicacion: string;
}

export interface Reserva {
  id: string;
  cabanaId: string;
  clienteId: string;
  fechaEntrada: string;
  fechaSalida: string;
  numHuespedes: number;
  precioTotal: number;
  estado: string;
  estadoPago: string;
  desayunoIncluido: boolean;
  notas?: string;
  cabana?: { id: string; nombre: string };
  cliente?: { id: string; nombre: string; apellido: string };
}

// API methods
export const authApi = {
  login:  (email: string, password: string) => api.post<AuthResponse>('/auth/login', { email, password }),
  me:     ()                                  => api.get<{ user: AuthUser; organization: AuthOrg }>('/auth/me'),
};

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats'),
};

export const cabanasApi = {
  list:   () => api.get<Cabana[]>('/cabanas'),
};

export const reservasApi = {
  list:   () => api.get<Reserva[]>('/reservas'),
  update: (id: string, data: Partial<Reserva>) => api.put<Reserva>(`/reservas/${id}`, data),
};
