import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Home, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../lib/auth';

const schema = z.object({
  organizationName: z.string().min(2, 'Nombre de empresa mínimo 2 caracteres'),
  name: z.string().min(2, 'Tu nombre mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  passwordConfirm: z.string(),
}).refine(d => d.password === d.passwordConfirm, {
  message: 'Las contraseñas no coinciden',
  path: ['passwordConfirm'],
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError('');
    try {
      const res = await authApi.register({
        organizationName: data.organizationName,
        name: data.name,
        email: data.email,
        password: data.password,
      });
      login(res.token, res.user, res.organization);
      navigate('/');
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Error al registrar');
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[900px] grid lg:grid-cols-[1fr_420px] shadow-card-lg rounded-xl overflow-hidden">

        {/* Izquierda — beneficios */}
        <div className="hidden lg:flex flex-col bg-surface-900 p-10 justify-center">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mb-6">
            <Home className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Alojafy</h2>
          <p className="text-surface-400 text-sm mb-8">
            Todo lo que necesitás para gestionar tu complejo de forma profesional.
          </p>
          <ul className="space-y-3.5">
            {[
              'Gestión completa de reservas y disponibilidad',
              'Dashboard con métricas e ingresos en tiempo real',
              'Múltiples usuarios con roles y permisos',
              'App mobile para gestionar desde cualquier lugar',
              'Reportes exportables y análisis de ocupación',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-surface-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Derecha — form */}
        <div className="bg-white p-8 flex flex-col justify-center">
          <h1 className="text-xl font-bold text-surface-900 mb-1">Crear cuenta</h1>
          <p className="text-sm text-surface-500 mb-6">Empezá gratis, sin tarjeta de crédito.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div>
              <label className="label">Nombre del complejo / empresa</label>
              <input
                {...register('organizationName')}
                placeholder="Ej: Cabañas El Bosque"
                className="input"
              />
              {errors.organizationName && <p className="form-error">{errors.organizationName.message}</p>}
            </div>

            <div>
              <label className="label">Tu nombre</label>
              <input
                {...register('name')}
                placeholder="Juan Pérez"
                className="input"
              />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="juan@empresa.com"
                className="input"
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Contraseña</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 caracteres"
                    className="input pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Confirmar</label>
                <input
                  {...register('passwordConfirm')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Repetir contraseña"
                  className="input"
                />
                {errors.passwordConfirm && <p className="form-error">{errors.passwordConfirm.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 font-semibold mt-1"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Creando cuenta...</>
              ) : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-surface-500">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
