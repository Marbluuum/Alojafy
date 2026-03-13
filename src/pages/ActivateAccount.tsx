import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Loader2 } from 'lucide-react';
import { authApi } from '../lib/api';

const schema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function ActivateAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError('');
    if (!token) {
      setServerError('Token inválido o faltante.');
      return;
    }
    try {
      await authApi.activate(token, data.password);
      navigate('/login');
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Token inválido o expirado.');
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Alojafy</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Activar cuenta</h1>
        <p className="text-surface-400 text-sm mb-8">
          Creá una contraseña para activar tu cuenta y acceder al panel.
        </p>

        {!token ? (
          <div className="bg-red-950/50 border border-red-800/60 rounded-lg px-4 py-4 text-sm text-red-400 mb-6">
            El enlace de activación no es válido o ya expiró.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="bg-red-950/50 border border-red-800/60 rounded-lg px-3.5 py-2.5 text-sm text-red-400">
                {serverError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5">Contraseña</label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="input bg-surface-800/60 border-surface-700 text-white placeholder:text-surface-500 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.password && <p className="form-error text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300 mb-1.5">Confirmar contraseña</label>
              <input
                {...register('confirmPassword')}
                type="password"
                autoComplete="new-password"
                placeholder="Repetí tu contraseña"
                className="input bg-surface-800/60 border-surface-700 text-white placeholder:text-surface-500 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.confirmPassword && <p className="form-error text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 text-sm font-semibold mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Activando...</>
              ) : 'Activar cuenta'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-surface-500">
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
