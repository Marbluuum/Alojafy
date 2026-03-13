import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Cabin } from '../../types';
import { Plus, X } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
  capacidad: z.coerce.number().min(1).max(50),
  precioPorNoche: z.coerce.number().min(100),
  estado: z.enum(['disponible', 'ocupada', 'mantenimiento', 'reservada'] as const),
  habitaciones: z.coerce.number().min(1).max(20),
  banos: z.coerce.number().min(1).max(10),
  superficieM2: z.coerce.number().min(10),
  ubicacion: z.string().min(2),
});

type FormData = z.output<typeof schema>;

interface Props {
  initialData?: Cabin | null;
  onSubmit: (data: Omit<Cabin, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const AMENIDADES_PRESET = [
  'WiFi', 'Parrilla', 'Pileta', 'Estacionamiento', 'TV',
  'Cocina completa', 'Chimenea', 'Jacuzzi', 'Desayuno',
  'Fogón', 'Aire acondicionado', 'Calefacción', 'Minibar',
];

export default function CabanaForm({ initialData, onSubmit, onCancel }: Props) {
  const [amenidades, setAmenidades] = useState<string[]>(initialData?.amenidades ?? []);
  const [newAmenidad, setNewAmenidad] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors } } = useForm<FormData, any, FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: initialData ? {
      nombre: initialData.nombre,
      descripcion: initialData.descripcion,
      capacidad: initialData.capacidad,
      precioPorNoche: initialData.precioPorNoche,
      estado: initialData.estado,
      habitaciones: initialData.habitaciones,
      banos: initialData.banos,
      superficieM2: initialData.superficieM2,
      ubicacion: initialData.ubicacion,
    } : {
      estado: 'disponible',
      capacidad: 4,
      habitaciones: 2,
      banos: 1,
      superficieM2: 60,
    },
  });

  const toggleAmenidad = (a: string) => {
    setAmenidades((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const addCustomAmenidad = () => {
    const trimmed = newAmenidad.trim();
    if (trimmed && !amenidades.includes(trimmed)) {
      setAmenidades((prev) => [...prev, trimmed]);
      setNewAmenidad('');
    }
  };

  const handleFormSubmit = (data: FormData) => {
    onSubmit({ ...data, amenidades, imagenes: initialData?.imagenes ?? [] });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nombre de la Cabaña *</label>
          <input {...register('nombre')} className="input" placeholder="Ej: Cabaña Los Pinos" />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
        </div>

        <div className="col-span-2">
          <label className="label">Descripción *</label>
          <textarea {...register('descripcion')} rows={3} className="input resize-none" placeholder="Describe la cabaña..." />
          {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion.message}</p>}
        </div>

        <div>
          <label className="label">Ubicación *</label>
          <input {...register('ubicacion')} className="input" placeholder="Ej: Sector A - Frente al lago" />
          {errors.ubicacion && <p className="text-red-500 text-xs mt-1">{errors.ubicacion.message}</p>}
        </div>

        <div>
          <label className="label">Estado *</label>
          <select {...register('estado')} className="input">
            <option value="disponible">Disponible</option>
            <option value="ocupada">Ocupada</option>
            <option value="reservada">Reservada</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </div>

        <div>
          <label className="label">Precio por Noche (ARS) *</label>
          <input {...register('precioPorNoche')} type="number" className="input" placeholder="0" />
          {errors.precioPorNoche && <p className="text-red-500 text-xs mt-1">{errors.precioPorNoche.message}</p>}
        </div>

        <div>
          <label className="label">Capacidad (personas) *</label>
          <input {...register('capacidad')} type="number" className="input" placeholder="4" />
          {errors.capacidad && <p className="text-red-500 text-xs mt-1">{errors.capacidad.message}</p>}
        </div>

        <div>
          <label className="label">Habitaciones *</label>
          <input {...register('habitaciones')} type="number" className="input" placeholder="2" />
          {errors.habitaciones && <p className="text-red-500 text-xs mt-1">{errors.habitaciones.message}</p>}
        </div>

        <div>
          <label className="label">Baños *</label>
          <input {...register('banos')} type="number" className="input" placeholder="1" />
          {errors.banos && <p className="text-red-500 text-xs mt-1">{errors.banos.message}</p>}
        </div>

        <div>
          <label className="label">Superficie (m²) *</label>
          <input {...register('superficieM2')} type="number" className="input" placeholder="60" />
          {errors.superficieM2 && <p className="text-red-500 text-xs mt-1">{errors.superficieM2.message}</p>}
        </div>
      </div>

      {/* Amenidades */}
      <div>
        <label className="label">Amenidades</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {AMENIDADES_PRESET.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenidad(a)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                amenidades.includes(a)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-dark-600 border-dark-200 hover:border-primary-400'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAmenidad}
            onChange={(e) => setNewAmenidad(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenidad())}
            className="input flex-1"
            placeholder="Agregar amenidad personalizada..."
          />
          <button type="button" onClick={addCustomAmenidad} className="btn-secondary">
            <Plus size={16} />
          </button>
        </div>
        {amenidades.filter((a) => !AMENIDADES_PRESET.includes(a)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {amenidades.filter((a) => !AMENIDADES_PRESET.includes(a)).map((a) => (
              <span key={a} className="badge-gray flex items-center gap-1">
                {a}
                <button type="button" onClick={() => toggleAmenidad(a)} className="ml-1 hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2 border-t border-dark-100">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1">
          {initialData ? 'Guardar Cambios' : 'Crear Cabaña'}
        </button>
      </div>
    </form>
  );
}
