import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { cabanasApi, clientesApi } from '../../lib/api';
import type { Reserva } from '../../lib/api';
import { calcNights, formatCurrency } from '../../utils/helpers';

const schema = z.object({
  cabanaId: z.string().min(1, 'Selecciona una cabaña'),
  clienteId: z.string().min(1, 'Selecciona un cliente'),
  fechaEntrada: z.string().min(1, 'Requerido'),
  fechaSalida: z.string().min(1, 'Requerido'),
  numHuespedes: z.coerce.number().min(1, 'Mínimo 1 huésped'),
  precioPorNoche: z.coerce.number().min(0, 'Precio requerido'),
  estado: z.enum(['confirmada', 'pendiente', 'cancelada', 'completada'] as const),
  estadoPago: z.enum(['pagado', 'pendiente', 'parcial', 'reembolsado'] as const),
  desayunoIncluido: z.boolean(),
  notas: z.string().optional(),
}).refine((d) => d.fechaEntrada < d.fechaSalida, {
  message: 'La fecha de salida debe ser posterior a la entrada',
  path: ['fechaSalida'],
});

type FormData = z.output<typeof schema>;

interface Props {
  initialData?: Reserva | null;
  onSubmit: (data: Partial<Reserva>) => void;
  onCancel: () => void;
}

export default function HospedajeForm({ initialData, onSubmit, onCancel }: Props) {
  const { data: cabanas = [] } = useQuery({ queryKey: ['cabanas'], queryFn: cabanasApi.list });
  const { data: clientes = [] } = useQuery({ queryKey: ['clientes'], queryFn: clientesApi.list });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData, any, FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: initialData ? {
      cabanaId: initialData.cabanaId,
      clienteId: initialData.clienteId,
      fechaEntrada: initialData.fechaEntrada,
      fechaSalida: initialData.fechaSalida,
      numHuespedes: initialData.numHuespedes,
      precioPorNoche: initialData.precioPorNoche,
      estado: initialData.estado,
      estadoPago: initialData.estadoPago,
      desayunoIncluido: initialData.desayunoIncluido,
      notas: initialData.notas ?? '',
    } : {
      estado: 'pendiente',
      estadoPago: 'pendiente',
      desayunoIncluido: false,
      numHuespedes: 2,
    },
  });

  const watchedEntrada = watch('fechaEntrada');
  const watchedSalida = watch('fechaSalida');
  const watchedPrecio = watch('precioPorNoche');


  const noches = watchedEntrada && watchedSalida && watchedEntrada < watchedSalida
    ? calcNights(watchedEntrada, watchedSalida)
    : 0;
  const precioTotal = (watchedPrecio ?? 0) * noches;

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      precioTotal,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="label">Cabaña *</label>
          <select {...register('cabanaId')} className="input">
            <option value="">Seleccionar cabaña...</option>
            {cabanas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({formatCurrency(c.precioPorNoche)}/noche)
              </option>
            ))}
          </select>
          {errors.cabanaId && <p className="text-red-500 text-xs mt-1">{errors.cabanaId.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="label">Cliente *</label>
          <select {...register('clienteId')} className="input">
            <option value="">Seleccionar cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellido}
              </option>
            ))}
          </select>
          {errors.clienteId && <p className="text-red-500 text-xs mt-1">{errors.clienteId.message}</p>}
        </div>

        <div>
          <label className="label">Fecha de Entrada *</label>
          <input {...register('fechaEntrada')} type="date" className="input" />
          {errors.fechaEntrada && <p className="text-red-500 text-xs mt-1">{errors.fechaEntrada.message}</p>}
        </div>

        <div>
          <label className="label">Fecha de Salida *</label>
          <input {...register('fechaSalida')} type="date" className="input" />
          {errors.fechaSalida && <p className="text-red-500 text-xs mt-1">{errors.fechaSalida.message}</p>}
        </div>

        <div>
          <label className="label">N° de Huéspedes *</label>
          <input {...register('numHuespedes')} type="number" min={1} className="input" />
          {errors.numHuespedes && <p className="text-red-500 text-xs mt-1">{errors.numHuespedes.message}</p>}
        </div>

        <div>
          <label className="label">Precio por Noche *</label>
          <input
            {...register('precioPorNoche')}
            type="number"
            min={0}
            step="0.01"
            className="input"
            placeholder="0"
          />
          {errors.precioPorNoche && <p className="text-red-500 text-xs mt-1">{errors.precioPorNoche.message}</p>}
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('desayunoIncluido')} type="checkbox" className="w-4 h-4 rounded text-primary-600" />
            <span className="text-sm font-medium text-surface-700">Desayuno incluido</span>
          </label>
        </div>

        <div>
          <label className="label">Estado Reserva *</label>
          <select {...register('estado')} className="input">
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="label">Estado de Pago *</label>
          <select {...register('estadoPago')} className="input">
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
            <option value="pagado">Pagado</option>
            <option value="reembolsado">Reembolsado</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="label">Notas</label>
          <textarea {...register('notas')} rows={2} className="input resize-none" placeholder="Observaciones de la reserva..." />
        </div>
      </div>

      {/* Price Preview */}
      {noches > 0 && watchedPrecio > 0 && (
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
          <div className="flex justify-between text-sm text-surface-600 mb-1">
            <span>{formatCurrency(watchedPrecio)} × {noches} noche{noches !== 1 ? 's' : ''}</span>
            <span>{formatCurrency(precioTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-surface-800">
            <span>Total estimado</span>
            <span className="text-primary-700">{formatCurrency(precioTotal)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-surface-100">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" className="btn-primary flex-1">
          {initialData ? 'Guardar Cambios' : 'Crear Reserva'}
        </button>
      </div>
    </form>
  );
}
