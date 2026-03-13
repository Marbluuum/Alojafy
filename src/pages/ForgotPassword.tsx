import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Loader2 } from 'lucide-react';
import { authApi } from '../lib/api';

const schema = z.object({
  email: z.string().email('Email inválido'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError('');
    try {
      await authApi.forgotPassword(data.email);
      setSuccess(true);
    } catch {
      setServerError('Error al procesar la solicitud. Intentá de nuevo.');
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

        <h1 className="text-2xl font-bold text-white mb-1">Recuperar contraseña</h1>
        <p className="text-surface-400 text-sm mb-8">
          Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {success ? (
          <div className="bg-emerald-950/50 border border-emerald-800/60 rounded-lg px-4 py-4 text-sm text-emerald-400 mb-6">
            Si el correo existe, recibirás un enlace para restablecer tu contraseña.
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 text-sm font-semibold mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
              ) : 'Enviar enlace'}
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
