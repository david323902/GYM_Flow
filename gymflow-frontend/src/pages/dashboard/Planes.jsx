import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { planesAPI } from '../../api/planes'
import { clientesAPI } from '../../api/clientes'
import { notificacionesAPI } from '../../api/notificaciones'
import { transaccionesAPI } from '../../api/transacciones'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import PlanForm from '../../components/forms/PlanForm'
import { 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  MegaphoneIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

const Planes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false)
  const [isDynamicPricingModalOpen, setIsDynamicPricingModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [editingPlanId, setEditingPlanId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [applyToUsers, setApplyToUsers] = useState(false)
  const [filterStatus, setFilterStatus] = useState('todos') // todos, activos, inactivos
  const [sortConfig, setSortConfig] = useState({ key: 'userCount', direction: 'desc' })
  
  const queryClient = useQueryClient()

  // Cargar Planes
  const { data: planes, isLoading } = useQuery({
    queryKey: ['planes'],
    queryFn: () => planesAPI.getAll()
  })

  // Cargar Clientes para estadísticas
  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesAPI.getAll()
  })

  const clientes = clientesData?.data || []

  // Cargar Transacciones para gráfico de ingresos
  const { data: transaccionesData } = useQuery({
    queryKey: ['transacciones'],
    queryFn: () => transaccionesAPI.getAll()
  })

  // Mutaciones
  const deleteMutation = useMutation({
    mutationFn: (id) => planesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['planes'])
    }
  })

  const updatePlanMutation = useMutation({
    mutationFn: (data) => planesAPI.update(data.id, data.payload),
    onSuccess: async (_, variables) => {
      // Si se seleccionó aplicar a usuarios, actualizar masivamente
      if (applyToUsers) {
        const usersToUpdate = clientes.filter(c => c.planId === variables.id)
        if (usersToUpdate.length > 0 && window.confirm(`¿Actualizar ${usersToUpdate.length} usuarios con los nuevos valores del plan?`)) {
          // Nota: Idealmente esto sería un endpoint masivo en backend. Aquí iteramos por limitación de contexto.
          for (const user of usersToUpdate) {
            await clientesAPI.update(user._id, {
              plan: variables.payload.nombre,
              planPrecio: variables.payload.precio,
              // No cambiamos fechas, solo datos del plan base
              historial_cambios: [
                ...(user.historialCambios || []),
                {
                  plan_anterior: user.plan,
                  plan_nuevo: variables.payload.nombre,
                  fecha: new Date(),
                  monto_pagado: 0,
                  valor_restante: 0
                }
              ]
            })
          }
          alert('Usuarios actualizados correctamente')
          queryClient.invalidateQueries(['clientes'])
        }
      }
      queryClient.invalidateQueries(['planes'])
      setEditingPlanId(null)
      setApplyToUsers(false)
    }
  })

  // --- Procesamiento de Datos ---
  const planesWithStats = useMemo(() => {
    if (!planes) return []
    
    return planes.map(plan => {
      const planUsers = clientes.filter(c => c.planId === plan._id || c.plan === plan.nombre)
      const activeUsers = planUsers.filter(c => c.estado === 'activo').length
      const inactiveUsers = planUsers.length - activeUsers
      const occupancy = clientes.length > 0 ? (planUsers.length / clientes.length) * 100 : 0
      
      return {
        ...plan,
        userCount: planUsers.length,
        activeUsers,
        inactiveUsers,
        occupancy,
        usersList: planUsers // Guardamos referencia para el modal
      }
    }).filter(plan => {
      if (filterStatus === 'todos') return true
      if (filterStatus === 'activos') return plan.userCount > 0
      if (filterStatus === 'inactivos') return plan.userCount === 0
      return true
    }).sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [planes, clientes, filterStatus, sortConfig])

  // --- Lógica de Precios Dinámicos ---
  const suggestedPrices = useMemo(() => {
    return planesWithStats.map(plan => {
      let suggested = plan.precio
      let reason = 'Demanda estable'
      let type = 'neutral'

      // Regla: Si ocupación > 80%, subir 10%
      if (plan.occupancy >= 80) {
        suggested = Math.round(plan.precio * 1.10)
        reason = 'Alta demanda (>80%)'
        type = 'increase'
      // Regla: Si ocupación < 30% y tiene al menos 1 usuario, bajar 5% (Promo)
      } else if (plan.occupancy <= 30 && plan.userCount > 0) {
        suggested = Math.round(plan.precio * 0.95)
        reason = 'Baja demanda (<30%)'
        type = 'decrease'
      }

      return { ...plan, suggestedPrice: suggested, reason, type }
    }).filter(p => p.type !== 'neutral')
  }, [planesWithStats])

  const applyDynamicPrices = async () => {
    if (!window.confirm(`¿Aplicar cambios de precio a ${suggestedPrices.length} planes?`)) return
    
    try {
      // Actualizar cada plan (Idealmente sería un endpoint masivo)
      for (const plan of suggestedPrices) {
        await planesAPI.update(plan._id, { 
          precio: plan.suggestedPrice,
          motivo: `Ajuste dinámico: ${plan.reason}` // Enviamos el motivo al backend
        })
      }
      alert('Precios actualizados correctamente según la demanda.')
      setIsDynamicPricingModalOpen(false)
      queryClient.invalidateQueries(['planes'])
    } catch (error) {
      alert('Error al actualizar precios')
    }
  }

  // --- Datos para Gráfico de Líneas (Ingresos 6 meses) ---
  const incomeHistory = useMemo(() => {
    const transacciones = transaccionesData?.transacciones || []
    const clientesMap = new Map(clientes.map(c => [c._id, c.plan]))
    
    // 1. Inicializar últimos 6 meses
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push({
        name: d.toLocaleString('es-ES', { month: 'short' }), // Ej: "Ene"
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        // Inicializar cada plan en 0 para que el gráfico no rompa
        ...(planes || []).reduce((acc, p) => ({ ...acc, [p.nombre]: 0 }), {})
      })
    }

    // 2. Llenar con datos
    transacciones.forEach(t => {
      if (t.tipo?.toLowerCase() !== 'ingreso') return
      const date = new Date(t.fecha)
      
      // Encontrar el mes correspondiente
      const monthData = months.find(m => m.monthIndex === date.getMonth() && m.year === date.getFullYear())
      
      if (monthData) {
        let planName = 'Otros'
        // Intentar asociar transacción a un plan a través del cliente
        if (t.cliente) {
          const clientId = typeof t.cliente === 'object' ? t.cliente._id : t.cliente
          const plan = clientesMap.get(clientId)
          if (plan) planName = plan
        }
        
        if (monthData[planName] !== undefined) {
          monthData[planName] += (parseFloat(t.monto) || 0)
        }
      }
    })
    
    return months
  }, [transaccionesData, clientes, planes])

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FF8042']

  // --- Handlers ---
  const startEditing = (plan) => {
    setEditingPlanId(plan._id)
    setEditForm({ ...plan })
    setApplyToUsers(false)
  }

  const saveEdit = () => {
    updatePlanMutation.mutate({ 
      id: editingPlanId, 
      payload: { ...editForm, motivo: 'Edición manual desde dashboard' } 
    })
  }

  const cancelEdit = () => {
    setEditingPlanId(null)
    setEditForm({})
  }

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const openUsersModal = (plan) => {
    setSelectedPlan(plan)
    setIsUsersModalOpen(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este plan?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard de Planes</h1>
          <p className="text-gray-600">Gestiona precios, duración y analiza el rendimiento de tus planes.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="todos">Todos los planes</option>
            <option value="activos">Con usuarios</option>
            <option value="inactivos">Sin usuarios</option>
          </select>
          <button
            onClick={() => setIsDynamicPricingModalOpen(true)}
            className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Precios Dinámicos
          </button>
          <button
            onClick={() => {
              setSelectedPlan(null)
              setIsModalOpen(true)
            }}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Plan
          </button>
        </div>
      </div>

      {/* Gráfico de Evolución de Ingresos */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Evolución de Ingresos por Plan (Últimos 6 meses)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart
              data={incomeHistory}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              {planes?.map((plan, index) => (
                <Line 
                  key={plan._id}
                  type="monotone" 
                  dataKey={plan.nombre} 
                  stroke={chartColors[index % chartColors.length]} 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Ocupación */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Distribución de Usuarios por Plan</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={planesWithStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" />
              <YAxis allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend />
              <Bar dataKey="activeUsers" name="Activos" stackId="a" fill="#10B981" />
              <Bar dataKey="inactiveUsers" name="Inactivos" stackId="a" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nombre')}
                >
                  Plan {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('precio')}
                >
                  Precio {sortConfig.key === 'precio' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duración / Entradas
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('userCount')}
                >
                  Usuarios {sortConfig.key === 'userCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Ocupación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {planesWithStats.map((plan) => {
                const isEditing = editingPlanId === plan._id
                return (
                  <tr key={plan._id} className={isEditing ? "bg-indigo-50" : "hover:bg-gray-50"}>
                    {/* Nombre del Plan */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.nombre} 
                          onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      ) : (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{plan.nombre}</div>
                            <div className="text-xs text-gray-500">{plan.tipo === 'tiquetera' ? 'Tiquetera' : 'Mensualidad'}</div>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Precio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="relative rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={editForm.precio}
                            onChange={(e) => setEditForm({...editForm, precio: parseFloat(e.target.value)})}
                            className="block w-full pl-7 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900 font-bold">${plan.precio}</div>
                      )}
                    </td>

                    {/* Duración */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={plan.tipo === 'tiquetera' ? editForm.entradas : editForm.duracionDias}
                            onChange={(e) => setEditForm({
                              ...editForm, 
                              [plan.tipo === 'tiquetera' ? 'entradas' : 'duracionDias']: parseInt(e.target.value)
                            })}
                            className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <span className="self-center">{plan.tipo === 'tiquetera' ? 'Entradas' : 'Días'}</span>
                        </div>
                      ) : (
                        <span>{plan.tipo === 'tiquetera' ? `${plan.entradas} Entradas` : `${plan.duracionDias} Días`}</span>
                      )}
                    </td>

                    {/* Usuarios */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => openUsersModal(plan)}
                        className="flex items-center text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        <UserGroupIcon className="h-5 w-5 mr-1" />
                        {plan.userCount} Usuarios
                      </button>
                      <div className="text-xs text-gray-500 mt-1">
                        {plan.activeUsers} activos / {plan.inactiveUsers} inactivos
                      </div>
                    </td>

                    {/* Ocupación */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${plan.occupancy}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{plan.occupancy.toFixed(0)}%</span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <button onClick={saveEdit} className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded">
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button onClick={cancelEdit} className="text-red-600 hover:text-red-900 bg-red-50 p-1 rounded">
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                          <label className="flex items-center text-xs text-gray-600 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={applyToUsers} 
                              onChange={(e) => setApplyToUsers(e.target.checked)}
                              className="mr-1 h-3 w-3 text-indigo-600 rounded"
                            />
                            Aplicar a usuarios
                          </label>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => startEditing(plan)} className="text-indigo-600 hover:text-indigo-900">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDelete(plan._id)} className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Plan"
      >
        <PlanForm
          plan={null}
          onSuccess={() => {
            setIsModalOpen(false)
            queryClient.invalidateQueries(['planes'])
          }}
        />
      </Modal>

      {/* Modal de Usuarios por Plan */}
      <Modal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        title={`Usuarios: ${selectedPlan?.nombre}`}
      >
        <UsersByPlanView plan={selectedPlan} />
      </Modal>

      {/* Modal de Precios Dinámicos */}
      <Modal
        isOpen={isDynamicPricingModalOpen}
        onClose={() => setIsDynamicPricingModalOpen(false)}
        title="Ajuste de Precios por Demanda"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            El sistema sugiere los siguientes cambios basados en la ocupación actual de cada plan.
          </p>
          
          {suggestedPrices.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <CheckIcon className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="text-gray-900 font-medium">Todos los precios están optimizados</p>
              <p className="text-sm text-gray-500">No se requieren ajustes por demanda en este momento.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sugerido</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suggestedPrices.map(plan => (
                    <tr key={plan._id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{plan.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">${plan.precio}</td>
                      <td className={`px-4 py-3 text-sm font-bold ${plan.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                        ${plan.suggestedPrice} {plan.type === 'increase' ? '↑' : '↓'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{plan.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {suggestedPrices.length > 0 && (
            <button
              onClick={applyDynamicPrices}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 font-medium"
            >
              Aplicar {suggestedPrices.length} Cambios
            </button>
          )}
        </div>
      </Modal>
    </div>
  )
}

const UsersByPlanView = ({ plan }) => {
  const [promoMessage, setPromoMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  if (!plan) return null
  const users = plan.usersList || []
  const active = users.filter(u => u.estado === 'activo').length
  const inactive = users.length - active
  
  // Estadísticas avanzadas
  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const expiringThisWeek = users.filter(u => {
    if (!u.fechaVencimiento) return false
    const vencimiento = new Date(u.fechaVencimiento)
    return vencimiento > now && vencimiento <= oneWeekFromNow
  }).length

  const inactive30Days = users.filter(u => {
    // Inactivo si no tiene asistencia en 30 días o si nunca asistió y se registró hace 30+ días
    if (u.ultimaAsistencia) {
      return new Date(u.ultimaAsistencia) < thirtyDaysAgo
    }
    return u.createdAt && new Date(u.createdAt) < thirtyDaysAgo
  }).length

  const handleSendPromo = async () => {
    if (!promoMessage.trim()) return alert('Escribe un mensaje')
    if (!window.confirm(`¿Enviar mensaje a ${active} usuarios activos de este plan?`)) return

    setIsSending(true)
    try {
      await notificacionesAPI.enviarNotificacionManual({
        planId: plan._id,
        mensaje: promoMessage,
        canal: 'whatsapp'
      })
      alert('Promoción enviada exitosamente')
      setPromoMessage('')
    } catch (error) {
      alert('Error al enviar promoción')
    } finally {
      setIsSending(false)
    }
  }

  const handleExportExcel = () => {
    if (!users.length) return alert('No hay usuarios para exportar')
    
    // 1. Definir cabeceras
    const headers = ['Nombre', 'Documento', 'Email', 'Teléfono', 'Estado', 'Fecha Vencimiento', 'Última Asistencia']
    
    // 2. Mapear datos
    const rows = users.map(u => [
      u.nombre,
      u.documento,
      u.email || '',
      u.telefono || '',
      u.estado,
      u.fechaVencimiento ? new Date(u.fechaVencimiento).toLocaleDateString() : '',
      u.ultimaAsistencia ? new Date(u.ultimaAsistencia).toLocaleDateString() : ''
    ])

    // 3. Construir CSV con BOM (\uFEFF) para que Excel reconozca tildes y ñ
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // 4. Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Usuarios_${plan.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Stats Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-2xl font-bold text-blue-700">{users.length}</p>
          <p className="text-xs text-blue-600">Total</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-2xl font-bold text-green-700">{active}</p>
          <p className="text-xs text-green-600">Activos</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-2xl font-bold text-yellow-700">{expiringThisWeek}</p>
          <p className="text-xs text-yellow-600">Vencen esta semana</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-2xl font-bold text-red-700">{inactive30Days}</p>
          <p className="text-xs text-red-600">Inactivos (30+ días)</p>
        </div>
      </div>

      {/* Lista de Usuarios (Limitada a 5 para vista rápida) */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-900">Usuarios Recientes</h4>
          <button 
            onClick={handleExportExcel}
            className="flex items-center text-sm text-green-600 hover:text-green-800 font-medium bg-green-50 px-3 py-1 rounded-md border border-green-200 transition-colors"
            title="Descargar lista completa en Excel (CSV)"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Exportar Lista
          </button>
        </div>
        <ul className="divide-y divide-gray-200 max-h-40 overflow-y-auto border rounded-md">
          {users.slice(0, 10).map(user => (
            <li key={user._id} className="px-4 py-2 flex justify-between text-sm">
              <span>{user.nombre}</span>
              <span className={user.estado === 'activo' ? 'text-green-600' : 'text-red-600'}>
                {user.estado}
              </span>
            </li>
          ))}
          {users.length > 10 && (
            <li className="px-4 py-2 text-xs text-center text-gray-500">
              ... y {users.length - 10} más
            </li>
          )}
        </ul>
      </div>

      {/* Acciones Masivas */}
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <h4 className="font-bold text-indigo-900 flex items-center mb-2">
          <MegaphoneIcon className="h-5 w-5 mr-2" />
          Enviar Promo Masiva
        </h4>
        <textarea
          value={promoMessage}
          onChange={(e) => setPromoMessage(e.target.value)}
          placeholder={`Ej: ¡Hola! Renovando tu plan ${plan.nombre} hoy obtienes un 10% OFF.`}
          className="w-full p-2 text-sm border rounded mb-2"
          rows="2"
        />
        <button 
          onClick={handleSendPromo}
          disabled={isSending || !promoMessage.trim()}
          className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSending ? 'Enviando...' : `Enviar a ${active} usuarios activos`}
        </button>
      </div>
    </div>
  )
}

export default Planes