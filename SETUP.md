# Alojafy — Guía de Setup

## Estructura del proyecto

```
Alojafy/
├── /                  ← Frontend Web (React + Vite)
├── backend/           ← API Backend (Express + Prisma + SQLite)
└── mobile/            ← App Mobile (Expo React Native)
```

---

## 🚀 Inicio Rápido

### 1. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Crear base de datos y aplicar esquema
npm run db:push

# Cargar datos demo
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
# → API corriendo en http://localhost:3001
```

> **Cuenta demo**: `admin@demo.com` / `admin1234`

### 2. Frontend Web

```bash
# En la raíz del proyecto
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar en desarrollo
npm run dev
# → http://localhost:5173
```

### 3. App Mobile

```bash
cd mobile

# Instalar dependencias
npm install

# Configurar URL de la API
cp .env.example .env
# Editar EXPO_PUBLIC_API_URL con tu IP local (ej: http://192.168.1.X:3001/api)

# Iniciar Expo
npm start
# Escanear el QR con la app Expo Go en tu celular
```

---

## 🏗️ Arquitectura

### Backend

| Tecnología | Uso |
|------------|-----|
| Express.js | Servidor HTTP |
| Prisma ORM | Acceso a base de datos |
| SQLite | Base de datos (dev) / PostgreSQL (prod) |
| JWT | Autenticación |
| bcryptjs | Hash de contraseñas |
| Zod | Validación de datos |

### Frontend Web

| Tecnología | Uso |
|------------|-----|
| React 19 | UI Framework |
| TypeScript | Tipado |
| Vite | Build tool |
| Tailwind CSS | Estilos |
| React Query | Data fetching + cache |
| React Router | Navegación |
| React Hook Form + Zod | Formularios |

### Mobile

| Tecnología | Uso |
|------------|-----|
| Expo | Framework |
| React Native | UI nativa |
| Expo Router | Navegación |
| AsyncStorage | Token storage |

---

## 👥 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso total: CRUD completo, gestión de usuarios, configuración |
| **USER** | Puede ver y crear reservas, consultar datos |

---

## 🔒 Autenticación

- JWT con expiración de 7 días
- Multi-tenant: cada organización tiene sus propios datos aislados
- Al registrarse, se crea la organización + el primer usuario ADMIN

## 📱 Variables de Entorno

### Backend (`backend/.env`)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="tu-secret-muy-largo-y-seguro"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3001/api
```

### Mobile (`mobile/.env`)
```
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3001/api
```

## 🚀 Producción

Para producción, cambiar SQLite por PostgreSQL:
1. En `backend/prisma/schema.prisma`, cambiar `provider = "sqlite"` por `provider = "postgresql"`
2. Actualizar `DATABASE_URL` con la URL de PostgreSQL
3. `npm run db:migrate`
