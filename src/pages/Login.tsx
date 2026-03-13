import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Home, Loader2 } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../lib/auth';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
  organizationSlug: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showSlug, setShowSlug] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError('');
    try {
      const res = await authApi.login(data.email, data.password, data.organizationSlug || undefined);
      login(res.token, res.user, res.organization, res.organizations);
      navigate('/');
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Error al iniciar sesión');
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex flex-col flex-1 bg-surface-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-surface-900 to-surface-950 opacity-80" />
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-primary-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-md">
          <div className="w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Alojafy</h2>
          <p className="text-surface-400 text-base leading-relaxed">
            Plataforma profesional para la gestión de complejos de alojamiento turístico.
            Reservas, clientes y reportes en un solo lugar.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-left">
            {[
              { label: 'Reservas en tiempo real', desc: 'Control total del calendario' },
              { label: 'Multi-usuario', desc: 'Roles y permisos por equipo' },
              { label: 'Reportes y métricas', desc: 'Decisiones basadas en datos' },
            ].map((f) => (
              <div key={f.label} className="bg-white/5 rounded-lg p-3.5 border border-white/8">
                <p className="text-xs font-semibold text-white mb-1">{f.label}</p>
                <p className="text-xs text-surface-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:max-w-[480px] lg:flex-none lg:w-[480px]">
        <div className="w-full max-w-[360px]">
          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Alojafy</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Bienvenido</h1>
          <p className="text-surface-400 text-sm mb-8">
            Ingresá a tu panel de gestión
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="bg-red-950/50 border border-red-800/60 rounded-lg px-3.5 py-2.5 text-sm text-red-400">
                {serverError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.com"
                className="input bg-surface-800/60 border-surface-700 text-white placeholder:text-surface-500 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.email && <p className="form-error text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input bg-surface-800/60 border-surface-700 text-white placeholder:text-surface-500 focus:ring-primary-500 focus:border-primary-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error text-red-400">{errors.password.message}</p>}
            </div>

            {showSlug && (
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1.5">
                  Slug de organización
                  <span className="ml-1 text-surface-500 font-normal">(opcional)</span>
                </label>
                <input
                  {...register('organizationSlug')}
                  placeholder="mi-empresa"
                  className="input bg-surface-800/60 border-surface-700 text-white placeholder:text-surface-500 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 text-sm font-semibold mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Ingresando...</>
              ) : 'Ingresar al panel'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setShowSlug(!showSlug)}
              className="text-xs text-surface-500 hover:text-surface-400 underline underline-offset-2"
            >
              {showSlug ? 'Ocultar' : 'Tengo varias organizaciones'}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-surface-500">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Registrá tu empresa
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-6 bg-surface-800/40 border border-surface-700/50 rounded-lg p-3.5">
            <p className="text-xs font-medium text-surface-400 mb-1.5">Cuenta demo</p>
            <p className="text-xs text-surface-500">
              Email: <code className="text-primary-400">admin@demo.com</code><br />
              Contraseña: <code className="text-primary-400">admin1234</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
