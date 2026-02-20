import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transaccionesAPI } from '../../api/transacciones'
import { clientesAPI } from '../../api/clientes'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { useForm } from 'react-hook-form'
import { 
  PlusIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const formatPrice = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const Transacciones = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTransaccion, setSelectedTransaccion] = useState(null)
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const queryClient = useQueryClient()

  const { data: transaccionesData, isLoading, error } = useQuery({
    queryKey: ['transacciones'],
    queryFn: () => transaccionesAPI.getAll(),
    retry: 1
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => transaccionesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['transacciones'])
    }
  })

  // Manejar datos del backend
  const transacciones = transaccionesData?.transacciones || []

  const transaccionesFiltradas = transacciones.filter(t => {
    // Normalizar a minúsculas para una comparación robusta
    const tipoTransaccion = t.tipo?.toLowerCase()
    if (tipoFiltro !== 'todos' && tipoTransaccion !== tipoFiltro) return false
    
    const fechaTransaccion = t.fecha ? t.fecha.split('T')[0] : ''
    if (fechaInicio && fechaTransaccion < fechaInicio) return false
    if (fechaFin && fechaTransaccion > fechaFin) return false
    
    return true
  })

  const totalIngresos = transaccionesFiltradas
    .filter(t => t.tipo?.toLowerCase() === 'ingreso')
    .reduce((sum, t) => sum + (parseFloat(t.monto) || 0), 0)

  const totalEgresos = transaccionesFiltradas
    .filter(t => t.tipo?.toLowerCase() === 'egreso')
    .reduce((sum, t) => sum + (parseFloat(t.monto) || 0), 0)

  const saldo = totalIngresos - totalEgresos

  const handleEdit = (transaccion) => {
    setSelectedTransaccion(transaccion)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error al cargar transacciones</h3>
        <p className="text-red-700">{error.message}</p>
        <p className="text-sm text-red-600 mt-2">
          Verifica que el endpoint /api/transacciones exista en tu backend
        </p>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transacciones</h1>
          <p className="text-gray-600">Registro de movimientos financieros</p>
        </div>
        <button
          onClick={() => {
            setSelectedTransaccion(null)
            setIsModalOpen(true)
          }}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Transacción
        </button>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <ArrowUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Ingresos</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPrice(totalIngresos)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <ArrowDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Egresos</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPrice(totalEgresos)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Saldo Neto</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPrice(saldo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Lista de transacciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transaccionesFiltradas.length > 0 ? (
                transaccionesFiltradas.map((transaccion) => (
                  <tr key={transaccion._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaccion.fecha ? new Date(transaccion.fecha).toLocaleDateString('es-ES') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaccion.descripcion || 'Sin descripción'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${transaccion.tipo?.toLowerCase() === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {transaccion.tipo?.charAt(0).toUpperCase() + transaccion.tipo?.slice(1).toLowerCase() || 'Indefinido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${transaccion.tipo?.toLowerCase() === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaccion.tipo?.toLowerCase() === 'ingreso' ? '+' : '-'}{formatPrice(parseFloat(transaccion.monto || 0))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaccion.metodoPago || 'Efectivo'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(transaccion)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaccion._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No hay transacciones registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para nueva/editar transacción */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTransaccion ? 'Editar Transacción' : 'Nueva Transacción'}
      >
        <TransaccionForm
          transaccion={selectedTransaccion}
          onSuccess={() => {
            setIsModalOpen(false)
            setSelectedTransaccion(null)
            queryClient.invalidateQueries(['transacciones'])
          }}
        />
      </Modal>
    </div>
  )
}

// Componente del formulario de transacción
const TransaccionForm = ({ transaccion, onSuccess }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: transaccion || {
      tipo: 'ingreso',
      metodoPago: 'efectivo',
      fecha: new Date().toISOString().split('T')[0]
    }
  })
  const queryClient = useQueryClient()

  // Cargar clientes para el selector
  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesAPI.getAll()
  })
  const clientes = clientesData?.data || []

  const mutation = useMutation({
    mutationFn: (data) => 
      transaccion 
        ? transaccionesAPI.update(transaccion._id, data)
        : transaccionesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transacciones'])
      onSuccess()
    },
    onError: (error) => {
      console.error('Error saving transaction:', error)
      alert(`Error: ${error.message}`)
    }
  })

  const onSubmit = (data) => {
    // Asegurarse de que el monto sea número
    const payload = {
      tipo: data.tipo,
      monto: parseFloat(data.monto),
      metodoPago: data.metodoPago,
      metodo_pago: data.metodoPago, // Enviar ambos formatos por seguridad
      descripcion: data.descripcion,
      concepto: data.descripcion,   // Enviar ambos formatos por seguridad
      fecha: data.fecha,
      observaciones: data.observaciones
    }

    // Solo enviar el campo cliente si es un ID válido de MongoDB (24 caracteres hex)
    // Si es un nombre, lo agregamos a la descripción para no perder el dato
    if (data.cliente && /^[0-9a-fA-F]{24}$/.test(data.cliente)) {
      payload.cliente = data.cliente
    } else if (data.cliente) {
      payload.descripcion = `${payload.descripcion} - Cliente: ${data.cliente}`
    }

    mutation.mutate(payload)
  }

  const tipo = watch('tipo')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tipo *
        </label>
        <select
          {...register('tipo', { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Descripción *
        </label>
        <input
          {...register('descripcion', { required: 'Descripción es requerida' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Ej: Pago de membresía mensual"
        />
        {errors.descripcion && (
          <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Monto *
        </label>
        <input
          type="number"
          step="0.01"
          {...register('monto', { 
            required: 'Monto es requerido',
            min: { value: 0.01, message: 'Monto mínimo es 0.01' }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.monto && (
          <p className="mt-1 text-sm text-red-600">{errors.monto.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Método de Pago *
          </label>
          <select
            {...register('metodoPago', { required: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fecha *
          </label>
          <input
            type="date"
            {...register('fecha', { required: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {tipo === 'ingreso' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cliente (opcional para egresos)
          </label>
          <select
            {...register('cliente')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map(cliente => (
              <option key={cliente._id} value={cliente._id}>{cliente.nombre} - {cliente.documento}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Al seleccionar un cliente, se activará su estado automáticamente.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Observaciones (opcional)
        </label>
        <textarea
          {...register('observaciones')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Notas adicionales..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
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

export default Transacciones