import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Client } from '../../types';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(8, 'Teléfono inválido'),
  dni: z.string().min(6, 'DNI inválido'),
  pais: z.string().min(2),
  ciudad: z.string().optional(),
  direccion: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  notas: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  initialData?: Client | null;
  onSubmit: (data: Omit<Client, 'id' | 'createdAt' | 'totalReservas'>) => void;
  onCancel: () => void;
}

export default function ClienteForm({ initialData, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      nombre: initialData.nombre,
      apellido: initialData.apellido,
      email: initialData.email,
      telefono: initialData.telefono,
      dni: initialData.dni,
      pais: initialData.pais,
      ciudad: initialData.ciudad ?? '',
      direccion: initialData.direccion ?? '',
      fechaNacimiento: initialData.fechaNacimiento ?? '',
      notas: initialData.notas ?? '',
    } : { pais: 'Argentina' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre *</label>
          <input {...register('nombre')} className="input" placeholder="Juan" />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="label">Apellido *</label>
          <input {...register('apellido')} className="input" placeholder="Pérez" />
          {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido.message}</p>}
        </div>

        <div>
          <label className="label">Email *</label>
          <input {...register('email')} type="email" className="input" placeholder="juan@email.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Teléfono *</label>
          <input {...register('telefono')} className="input" placeholder="+54 9 ..." />
          {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
        </div>

        <div>
          <label className="label">DNI / Documento *</label>
          <input {...register('dni')} className="input" placeholder="28.456.789" />
          {errors.dni && <p className="text-red-500 text-xs mt-1">{errors.dni.message}</p>}
        </div>
        <div>
          <label className="label">Fecha de Nacimiento</label>
          <input {...register('fechaNacimiento')} type="date" className="input" />
        </div>

        <div>
          <label className="label">País *</label>
          <input {...register('pais')} className="input" placeholder="Argentina" />
          {errors.pais && <p className="text-red-500 text-xs mt-1">{errors.pais.message}</p>}
        </div>
        <div>
          <label className="label">Ciudad</label>
          <input {...register('ciudad')} className="input" placeholder="Córdoba" />
        </div>

        <div className="col-span-2">
          <label className="label">Dirección</label>
          <input {...register('direccion')} className="input" placeholder="Calle, número..." />
        </div>

        <div className="col-span-2">
          <label className="label">Notas internas</label>
          <textarea {...register('notas')} rows={2} className="input resize-none" placeholder="Observaciones sobre el cliente..." />
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-surface-100">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" className="btn-primary flex-1">
          {initialData ? 'Guardar Cambios' : 'Registrar Cliente'}
        </button>
      </div>
    </form>
  );
}
