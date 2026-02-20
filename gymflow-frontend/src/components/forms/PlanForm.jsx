import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { planesAPI } from '../../api/planes'

const PlanForm = ({ plan, onSuccess }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: plan || {}
  })
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data) => 
      plan 
        ? planesAPI.update(plan._id, data)
        : planesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['planes'])
      onSuccess()
    }
  })

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input
          {...register('nombre', { required: 'Nombre es requerido' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.nombre && (
          <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          {...register('descripcion')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Precio
          </label>
          <input
            type="number"
            {...register('precio', { 
              required: 'Precio es requerido',
              min: { value: 0, message: 'Precio mínimo es 0' }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.precio && (
            <p className="mt-1 text-sm text-red-600">{errors.precio.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duración (días)
          </label>
          <input
            type="number"
            {...register('duracionDias', { 
              required: 'Duración es requerida',
              min: { value: 1, message: 'Duración mínima es 1 día' }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.duracionDias && (
            <p className="mt-1 text-sm text-red-600">{errors.duracionDias.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onSuccess}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={mutation.isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {mutation.isLoading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

export default PlanForm