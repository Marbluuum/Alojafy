const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  return localStorage.getItem('alojafy_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthOrg {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  organization: AuthOrg;
}

export const authApi = {
  login: (email: string, password: string, organizationSlug?: string) =>
    api.post<AuthResponse>('/auth/login', { email, password, organizationSlug }),
  register: (data: { organizationName: string; name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  me: () => api.get<{ user: AuthUser; organization: AuthOrg }>('/auth/me'),
};

// ── Cabañas ────────────────────────────────────────────────────────────────
export interface Cabana {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioPorNoche: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento' | 'reservada';
  habitaciones: number;
  banos: number;
  superficieM2: number;
  ubicacion: string;
  amenidades: string[];
  imagenes: string[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const cabanasApi = {
  list:   ()                      => api.get<Cabana[]>('/cabanas'),
  get:    (id: string)            => api.get<Cabana>(`/cabanas/${id}`),
  create: (data: Partial<Cabana>) => api.post<Cabana>('/cabanas', data),
  update: (id: string, data: Partial<Cabana>) => api.put<Cabana>(`/cabanas/${id}`, data),
  delete: (id: string)            => api.delete<{ message: string }>(`/cabanas/${id}`),
};

// ── Clientes ───────────────────────────────────────────────────────────────
export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  fechaNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  pais: string;
  notas?: string;
  cantidadReservas?: number;
  organizationId: string;
  createdAt: string;
}

export const clientesApi = {
  list:   ()                        => api.get<Cliente[]>('/clientes'),
  get:    (id: string)              => api.get<Cliente>(`/clientes/${id}`),
  create: (data: Partial<Cliente>)  => api.post<Cliente>('/clientes', data),
  update: (id: string, data: Partial<Cliente>) => api.put<Cliente>(`/clientes/${id}`, data),
  delete: (id: string)              => api.delete<{ message: string }>(`/clientes/${id}`),
};

// ── Reservas ───────────────────────────────────────────────────────────────
export interface Reserva {
  id: string;
  cabanaId: string;
  clienteId: string;
  fechaEntrada: string;
  fechaSalida: string;
  numHuespedes: number;
  precioPorNoche: number;
  precioTotal: number;
  estado: 'confirmada' | 'pendiente' | 'cancelada' | 'completada';
  estadoPago: 'pagado' | 'pendiente' | 'parcial' | 'reembolsado';
  desayunoIncluido: boolean;
  notas?: string;
  cabana?: { id: string; nombre: string; precioPorNoche: number };
  cliente?: { id: string; nombre: string; apellido: string; email?: string };
  organizationId: string;
  createdAt: string;
}

export const reservasApi = {
  list:   (params?: { estado?: string; desde?: string; hasta?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return api.get<Reserva[]>(`/reservas${qs}`);
  },
  get:    (id: string)               => api.get<Reserva>(`/reservas/${id}`),
  create: (data: Partial<Reserva>)   => api.post<Reserva>('/reservas', data),
  update: (id: string, data: Partial<Reserva>) => api.put<Reserva>(`/reservas/${id}`, data),
  delete: (id: string)               => api.delete<{ message: string }>(`/reservas/${id}`),
};

// ── Dashboard ──────────────────────────────────────────────────────────────
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

export const dashboardApi = {
  stats:        ()              => api.get<DashboardStats>('/dashboard/stats'),
  reporteAnual: (year?: number) => api.get<unknown>(`/dashboard/reportes/anual${year ? `?year=${year}` : ''}`),
};

// ── Users ──────────────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const usersApi = {
  list:   ()                       => api.get<AppUser[]>('/users'),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<AppUser>('/users', data),
  update: (id: string, data: Partial<AppUser & { password: string }>) =>
    api.put<AppUser>(`/users/${id}`, data),
  delete: (id: string)             => api.delete<{ message: string }>(`/users/${id}`),
};

// ── Config ─────────────────────────────────────────────────────────────────
export interface Config {
  id: string;
  organizationId: string;
  nombreComplejo?: string;
  moneda: string;
  emailContacto?: string;
  telefono?: string;
  direccion?: string;
  checkInTime: string;
  checkOutTime: string;
}

export const configApi = {
  get:    ()                       => api.get<Config>('/config'),
  update: (data: Partial<Config>)  => api.put<Config>('/config', data),
};
