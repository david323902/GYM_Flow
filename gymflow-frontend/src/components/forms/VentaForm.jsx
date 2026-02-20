import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { ventasAPI } from '../../api/ventas'
import { clientesAPI } from '../../api/clientes'
import { planesAPI } from '../../api/planes'

const VentaForm = ({ venta, onSuccess }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: venta || {}
  })
  const queryClient = useQueryClient()

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesAPI.getAll()
  })

  const { data: planes } = useQuery({
    queryKey: ['planes'],
    queryFn: () => planesAPI.getAll()
  })

  const mutation = useMutation({
    mutationFn: (data) => 
      venta 
        ? ventasAPI.update(venta._id, data)
        : ventasAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ventas'])
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
          Cliente
        </label>
        <select
          {...register('clienteId', { required: 'Cliente es requerido' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Seleccionar cliente</option>
          {clientes?.map((cliente) => (
            <option key={cliente._id} value={cliente._id}>
              {cliente.nombre} {cliente.apellido}
            </option>
          ))}
        </select>
        {errors.clienteId && (
          <p className="mt-1 text-sm text-red-600">{errors.clienteId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Plan
        </label>
        <select
          {...register('planId', { required: 'Plan es requerido' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Seleccionar plan</option>
          {planes?.map((plan) => (
            <option key={plan._id} value={plan._id}>
              {plan.nombre} - ${plan.precio}
            </option>
          ))}
        </select>
        {errors.planId && (
          <p className="mt-1 text-sm text-red-600">{errors.planId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Fecha
        </label>
        <input
          type="date"
          {...register('fecha', { required: 'Fecha es requerida' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.fecha && (
          <p className="mt-1 text-sm text-red-600">{errors.fecha.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Método de Pago
        </label>
        <select
          {...register('metodoPago', { required: 'Método de pago es requerido' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Seleccionar método</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
        {errors.metodoPago && (
          <p className="mt-1 text-sm text-red-600">{errors.metodoPago.message}</p>
        )}
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

export default VentaForm