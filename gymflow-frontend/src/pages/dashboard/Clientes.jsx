import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { clientesAPI } from '../../api/clientes'
import { planesAPI } from '../../api/planes'
import { transaccionesAPI } from '../../api/transacciones'
import { notificacionesAPI } from '../../api/notificaciones'
import axios from 'axios'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon, PencilIcon, ArrowPathIcon, ArrowsRightLeftIcon, ClockIcon, EnvelopeIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, FunnelIcon, ArrowDownTrayIcon, ExclamationTriangleIcon, QrCodeIcon, PhotoIcon, CameraIcon, ClipboardDocumentListIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Clientes = () => {
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [showVencidos, setShowVencidos] = useState(false)
  const [filterPlan, setFilterPlan] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    if (location.state?.showVencidos) {
      setShowVencidos(true)
    }
    if (location.state?.planId) {
      setFilterPlan(location.state.planId)
    }
  }, [location.state])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isExpedienteModalOpen, setIsExpedienteModalOpen] = useState(false)
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState(null)
  const itemsPerPage = 10
  const [clienteEditar, setClienteEditar] = useState(null)
  const [clienteCambioPlan, setClienteCambioPlan] = useState(null)
  const [clienteHistory, setClienteHistory] = useState(null)
  const [clienteQr, setClienteQr] = useState(null)
  const [clienteExpediente, setClienteExpediente] = useState(null)
  const queryClient = useQueryClient()

  const { data: clientesData, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesAPI.getAll()
  })

  const { data: planesDataFilter } = useQuery({
    queryKey: ['planes'],
    queryFn: () => planesAPI.getAll()
  })
  const listaPlanes = planesDataFilter?.data?.data || planesDataFilter?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id) => clientesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['clientes'])
  })

  const clientes = clientesData?.data || clientesData || []

  // Datos para el gráfico: Cantidad de clientes por plan
  const chartData = useMemo(() => {
    return listaPlanes.map(plan => {
      const cantidad = clientes.filter(c => c.planId === plan._id || c.plan === plan.nombre).length
      return {
        nombre: plan.nombre,
        cantidad,
        id: plan._id
      }
    }).sort((a, b) => b.cantidad - a.cantidad) // Ordenar de mayor a menor popularidad
  }, [clientes, listaPlanes])

  const clientesFiltrados = clientes.filter(c => {
    const matchesSearch = c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.documento?.includes(searchTerm)
    
    const selectedPlanObj = listaPlanes.find(p => p._id === filterPlan)
    const matchesPlan = filterPlan ? (c.planId === filterPlan || (selectedPlanObj && c.plan === selectedPlanObj.nombre)) : true

    const matchesStatus = filterStatus ? c.estado === filterStatus : true

    if (showVencidos) {
      // Mostrar si el estado es explícitamente vencido O si la fecha ya pasó
      return matchesSearch && matchesPlan && matchesStatus && (c.estado === 'vencido' || (c.fechaVencimiento && new Date(c.fechaVencimiento) < new Date()))
    }
    return matchesSearch && matchesPlan && matchesStatus
  }).sort((a, b) => {
    const isVencidoA = a.estado === 'vencido' || (a.fechaVencimiento && new Date(a.fechaVencimiento) < new Date())
    const isVencidoB = b.estado === 'vencido' || (b.fechaVencimiento && new Date(b.fechaVencimiento) < new Date())
    
    if (isVencidoA && !isVencidoB) return -1
    if (!isVencidoA && isVencidoB) return 1
    return 0
  })

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, showVencidos, filterPlan, filterStatus])

  // Cerrar menú de acciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId) {
        const menu = document.getElementById(`menu-${openMenuId}`)
        if (menu && !menu.contains(event.target)) {
          setOpenMenuId(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentClientes = clientesFiltrados.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage)

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar cliente?')) deleteMutation.mutate(id)
  }

  const handleEdit = (cliente) => {
    setClienteEditar(cliente)
    setIsModalOpen(true)
  }

  const handleChangePlan = (cliente) => {
    setClienteCambioPlan(cliente)
    setIsChangePlanModalOpen(true)
  }

  const handleViewHistory = (cliente) => {
    setClienteHistory(cliente)
    setIsHistoryModalOpen(true)
  }

  const handleViewQr = (cliente) => {
    setClienteQr(cliente)
    setIsQrModalOpen(true)
  }

  const handleViewExpediente = (cliente) => {
    setClienteExpediente(cliente)
    setIsExpedienteModalOpen(true)
  }

  // --- Renovación Rápida ---
  const handleRenovar = async (cliente) => {
    const precio = cliente.planPrecio || 0
    if (!window.confirm(`¿Renovar plan "${cliente.plan}" para ${cliente.nombre}?\nCosto: $${precio}`)) return

    try {
      // 1. Obtener info del plan
      const planesRes = await planesAPI.getAll()
      const planes = planesRes.data?.data || []
      const planDetails = planes.find(p => p._id === cliente.planId) || planes.find(p => p.nombre === cliente.plan)

      if (!planDetails) {
        alert('No se encontró el plan original.')
        return
      }

      // 2. Calcular fecha
      const hoy = new Date()
      const vencimientoActual = cliente.fechaVencimiento ? new Date(cliente.fechaVencimiento) : hoy
      const fechaBase = vencimientoActual > hoy ? vencimientoActual : hoy
      const nuevaFecha = new Date(fechaBase)
      nuevaFecha.setDate(nuevaFecha.getDate() + (planDetails.duracionDias || 30))

      // 3. Transacción
      await transaccionesAPI.create({
        tipo: 'ingreso',
        monto: planDetails.precio,
        descripcion: `Renovación - ${cliente.nombre}`,
        concepto: `Renovación - ${cliente.nombre}`,
        cliente: cliente._id.toString(),
        metodoPago: 'efectivo',
        metodo_pago: 'efectivo',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: 'Renovación automática'
      })

      // 4. Actualizar Cliente
      await clientesAPI.update(cliente._id, {
        fechaVencimiento: nuevaFecha.toISOString(),
        estado: 'activo',
        entradasRestantes: cliente.tipoPlan === 'tiquetera' ? (cliente.entradasRestantes || 0) + (planDetails.entradas || 0) : undefined
      })

      // 5. Notificar
      try { await notificacionesAPI.enviarNotificacionManual({ usuarioId: cliente._id, mensaje: `Plan renovado hasta: ${nuevaFecha.toLocaleDateString()}`, canal: 'email' }) } catch (e) {}

      alert('Renovado exitosamente')
      queryClient.invalidateQueries(['clientes'])
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  // --- Enviar Recordatorios Masivos ---
  const handleEnviarRecordatorios = async () => {
    const hoy = new Date()
    
    // Filtrar clientes objetivo: Vencidos o Por Vencer (ej. en los próximos 5 días)
    const clientesObjetivo = clientesFiltrados.filter(c => {
      if (!c.fechaVencimiento) return false
      const vencimiento = new Date(c.fechaVencimiento)
      const diffTime = vencimiento - hoy
      const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // Incluir si ya venció (< 0) o si vence en los próximos 5 días
      return diasRestantes <= 5
    })

    if (clientesObjetivo.length === 0) {
      alert('No hay clientes vencidos o próximos a vencer (5 días) en la lista actual.')
      return
    }

    if (!window.confirm(`¿Enviar recordatorios a ${clientesObjetivo.length} clientes?\n(Incluye vencidos y próximos a vencer)`)) return

    try {
      const promesas = clientesObjetivo.map(c => {
        const vencimiento = new Date(c.fechaVencimiento)
        const diffTime = vencimiento - hoy
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        let mensaje = ''
        if (diasRestantes < 0) {
          mensaje = `Hola ${c.nombre}, tu plan venció el ${vencimiento.toLocaleDateString()}. ¡Te esperamos para renovar!`
        } else if (diasRestantes === 0) {
          mensaje = `Hola ${c.nombre}, tu plan vence HOY. ¡No te quedes sin entrenar!`
        } else {
          mensaje = `Hola ${c.nombre}, tu plan vence en ${diasRestantes} días (${vencimiento.toLocaleDateString()}). ¡Renueva a tiempo!`
        }

        // Usamos 'create' como método estándar si enviarNotificacionManual no existe
        const apiCall = notificacionesAPI?.enviarNotificacionManual || notificacionesAPI?.create
        
        if (typeof apiCall === 'function') {
          return apiCall({
            usuarioId: c._id,
            mensaje,
            canal: 'email'
          })
        } else {
          console.warn('API de notificaciones no disponible para:', c.nombre)
          return Promise.resolve() // Evita romper el Promise.all
        }
      })
      await Promise.all(promesas)
      alert(`Se enviaron ${clientesObjetivo.length} recordatorios exitosamente.`)
    } catch (error) {
      console.error(error)
      alert('Error al enviar recordatorios: ' + error.message)
    }
  }

  // --- Exportar a Excel ---
  const handleExportExcel = () => {
    if (!clientesFiltrados.length) return alert('No hay clientes para exportar')
    
    // 1. Definir cabeceras
    const headers = ['Nombre', 'Documento', 'Email', 'Teléfono', 'Plan', 'Estado', 'Fecha Vencimiento']
    
    // 2. Mapear datos
    const rows = clientesFiltrados.map(c => [
      c.nombre,
      c.documento,
      c.email || '',
      c.telefono || '',
      c.plan || '',
      c.estado,
      c.fechaVencimiento ? new Date(c.fechaVencimiento).toLocaleDateString() : ''
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
    link.setAttribute('download', `Clientes_Filtrados_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- Limpieza de Inactivos ---
  const handleEliminarInactivos = async () => {
    if (!window.confirm('⚠️ ZONA DE PELIGRO\n\n¿Estás seguro de eliminar permanentemente a los usuarios inactivos por más de 1 año?\n\nEsta acción borrará usuarios que no tienen actividad reciente y no tienen planes activos.\n\nEsta acción NO se puede deshacer.')) return

    try {
      // Nota: Asegúrate de agregar eliminarInactivos a tu archivo api/clientes.js
      const res = await clientesAPI.eliminarInactivos()
      alert(res.data?.message || `Limpieza completada. Se eliminaron ${res.data?.count || 0} usuarios.`)
      queryClient.invalidateQueries(['clientes'])
    } catch (error) {
      console.error(error)
      alert('Error al realizar la limpieza: ' + (error.response?.data?.message || error.message))
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestión de clientes del gimnasio</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 shadow-sm transition-colors"
            title="Exportar lista actual a Excel"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setIsRecycleBinOpen(true)}
            className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 border border-gray-300 transition-colors"
            title="Ver usuarios eliminados"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Papelera
          </button>
          <button 
            onClick={handleEliminarInactivos}
            className="flex items-center bg-red-50 text-red-700 px-4 py-2 rounded-md hover:bg-red-100 border border-red-200 transition-colors"
            title="Eliminar usuarios con más de 1 año de inactividad"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Limpiar Inactivos
          </button>
          <button 
            onClick={() => {
              setClienteEditar(null)
              setIsModalOpen(true)
            }}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Gráfico de Distribución de Clientes */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 hidden sm:block">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Clientes por Plan</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar 
                  dataKey="cantidad" 
                  name="Clientes" 
                  radius={[4, 4, 0, 0]} 
                  barSize={50}
                  onClick={(data) => setFilterPlan(data.id === filterPlan ? '' : data.id)}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.id === filterPlan ? '#312E81' : '#4F46E5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Barra de búsqueda y Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, apellido o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {clientesFiltrados.length > 0 && (
            <button
              onClick={handleEnviarRecordatorios}
              className="flex items-center bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 shadow-sm transition-colors whitespace-nowrap"
              title="Enviar recordatorio a clientes vencidos o por vencer en lista"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Recordar Pago
            </button>
          )}
          
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="vencido">Vencido</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <FunnelIcon className="h-4 w-4" />
            </div>
          </div>

          <div className="relative">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer"
            >
              <option value="">Todos los planes</option>
              {listaPlanes.map(plan => (
                <option key={plan._id} value={plan._id}>{plan.nombre}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <FunnelIcon className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-center bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors">
          <input
            id="vencidos-filter"
            type="checkbox"
            checked={showVencidos}
            onChange={(e) => setShowVencidos(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
          />
          <label htmlFor="vencidos-filter" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer select-none">
            Ver solo vencidos
          </label>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentClientes.map((cliente) => {
                const isVencido = cliente.estado === 'vencido' || (cliente.fechaVencimiento && new Date(cliente.fechaVencimiento) < new Date())
                const diasVencido = isVencido && cliente.fechaVencimiento 
                  ? Math.ceil((new Date() - new Date(cliente.fechaVencimiento)) / (1000 * 60 * 60 * 24)) 
                  : 0
                const esCritico = diasVencido > 7
                
                // Determinar estado visual (si está vencido por fecha, mostrar vencido aunque la BD diga activo)
                const estadoVisual = isVencido ? 'vencido' : cliente.estado

                return (
                <tr key={cliente._id} className={isVencido ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.nombre}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{cliente.documento}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{cliente.email}</div>
                    <div className="text-sm text-gray-500">{cliente.telefono}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${estadoVisual === 'activo' ? 'bg-green-100 text-green-800' : 
                          estadoVisual === 'vencido' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {estadoVisual}
                      </span>
                      {esCritico && (
                        <span className="flex items-center text-xs text-red-600 font-bold" title={`Deudor Crítico: ${diasVencido} días vencido`}>
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          +7 días
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left" id={`menu-${cliente._id}`}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === cliente._id ? null : cliente._id)}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                      {openMenuId === cliente._id && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                          <div className="py-1" role="menu">
                            <a href="#" onClick={(e) => { e.preventDefault(); handleRenovar(cliente); setOpenMenuId(null); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <ArrowPathIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                              Renovar
                            </a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleViewExpediente(cliente); setOpenMenuId(null); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <ClipboardDocumentListIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                              Expediente
                            </a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(cliente); setOpenMenuId(null); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                              Editar
                            </a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(cliente._id); setOpenMenuId(null); }} className="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                              <TrashIcon className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500" />
                              Eliminar
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {clientesFiltrados.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, clientesFiltrados.length)}</span> de <span className="font-medium">{clientesFiltrados.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Números de página simplificados */}
                {[...Array(totalPages)].map((_, i) => {
                  // Mostrar solo primera, última, actual y adyacentes
                  if (totalPages > 7 && Math.abs(currentPage - (i + 1)) > 1 && i !== 0 && i !== totalPages - 1) {
                    if (Math.abs(currentPage - (i + 1)) === 2) return <span key={i} className="px-2 py-2 text-gray-400 border-t border-b border-gray-300">...</span>
                    return null
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      aria-current={currentPage === i + 1 ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === i + 1
                          ? 'bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={clienteEditar ? "Editar Cliente" : "Nuevo Cliente"}
      >
        <ClienteForm 
          clienteEditar={clienteEditar}
          onSuccess={() => {
            setIsModalOpen(false)
            setClienteEditar(null)
            queryClient.invalidateQueries(['clientes'])
          }} 
        />
      </Modal>

      <Modal
        isOpen={isChangePlanModalOpen}
        onClose={() => setIsChangePlanModalOpen(false)}
        title="Cambiar Plan (Upgrade/Downgrade)"
      >
        <ChangePlanForm 
          cliente={clienteCambioPlan}
          onSuccess={() => { setIsChangePlanModalOpen(false); queryClient.invalidateQueries(['clientes']); }}
        />
      </Modal>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Historial de Cambios - ${clienteHistory?.nombre || ''}`}
      >
        <HistorialCambiosTable historial={clienteHistory?.historialCambios} />
      </Modal>

      <Modal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        title="Papelera de Reciclaje"
      >
        <PapeleraReciclaje onClose={() => setIsRecycleBinOpen(false)} />
      </Modal>

      <Modal
        isOpen={isExpedienteModalOpen}
        onClose={() => setIsExpedienteModalOpen(false)}
        title={`Expediente Digital - ${clienteExpediente?.nombre || ''}`}
      >
        <ExpedienteView clienteId={clienteExpediente?._id} />
      </Modal>

      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Código QR de Acceso"
      >
        {clienteQr && (
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${clienteQr.documento}`} 
                alt={`QR ${clienteQr.nombre}`} 
                className="w-64 h-64"
              />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">{clienteQr.nombre}</h3>
              <p className="text-gray-500 font-mono text-lg">{clienteQr.documento}</p>
            </div>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${clienteQr.documento}`;
                link.download = `QR_${clienteQr.nombre.replace(/\s+/g, '_')}.png`;
                link.target = '_blank';
                link.click();
              }}
              className="flex items-center bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 shadow-md transition-all"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Descargar QR
            </button>
            <p className="text-xs text-gray-400 text-center max-w-xs pt-2">
              El cliente puede usar este código en la entrada para registrar su asistencia automáticamente sin contacto.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

const ClienteForm = ({ onSuccess, clienteEditar }) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm()
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [preview, setPreview] = useState(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)

  const mutation = useMutation({
    mutationFn: (data) => clienteEditar 
      ? clientesAPI.update(clienteEditar._id, data)
      : clientesAPI.create(data),
    onSuccess: () => {
      alert('Cliente registrado exitosamente')
      onSuccess()
    },
    onError: (err) => {
      // Manejo robusto de errores del backend
      if (err.response?.data) {
        const { message, errores } = err.response.data
        // Si hay un array de errores (validación de mongoose), los mostramos listados
        const detalles = errores ? `\n\nErrores:\n- ${errores.join('\n- ')}` : ''
        alert(`Error: ${message}${detalles}`)
      } else {
        alert('Error de conexión o del servidor: ' + err.message)
      }
    }
  })

  // Cargar planes disponibles
  const { data: planesResponse } = useQuery({
    queryKey: ['planes'],
    queryFn: () => planesAPI.getAll()
  })
  
  // Obtener planes desde la respuesta del backend (Axios response.data.data)
  const planes = planesResponse?.data?.data || []

  // Efecto para cargar datos al editar
  useEffect(() => {
    if (clienteEditar) {
      reset({
        ...clienteEditar,
        fechaVencimiento: clienteEditar.fechaVencimiento ? clienteEditar.fechaVencimiento.split('T')[0] : ''
      })
      setPreview(clienteEditar.foto || null)
      // Intentar preseleccionar el plan basado en el nombre si estamos editando
      if (planes.length > 0 && clienteEditar.plan) {
        const planEncontrado = planes.find(p => p.nombre === clienteEditar.plan)
        if (planEncontrado) {
          setValue('planId', planEncontrado._id)
        }
      }
    }
  }, [clienteEditar, planes, reset, setValue])

  // Observar cambios en el plan para actualizar fecha de vencimiento
  const planIdSeleccionado = watch('planId')

  useEffect(() => {
    if (planIdSeleccionado && planes.length > 0) {
      const plan = planes.find(p => p._id === planIdSeleccionado)
      if (plan) {
        // Si estamos editando y el plan seleccionado es el mismo que tenía el usuario,
        // mantenemos la fecha original (para evitar sobrescribirla al cargar el formulario)
        if (clienteEditar && plan.nombre === clienteEditar.plan) {
          const fechaOriginal = clienteEditar.fechaVencimiento 
            ? clienteEditar.fechaVencimiento.split('T')[0] 
            : ''
          setValue('fechaVencimiento', fechaOriginal)
          setValue('plan', plan.nombre)
          return
        }

        const hoy = new Date()
        const dias = plan.duracionDias || 30
        const vencimiento = new Date(hoy.setDate(hoy.getDate() + dias))
        
        setValue('fechaVencimiento', vencimiento.toISOString().split('T')[0])
        setValue('plan', plan.nombre) // Guardar nombre del plan también
      }
    }
  }, [planIdSeleccionado, planes, setValue, clienteEditar])

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 1024 * 1024) return alert('La imagen no debe superar 1MB')
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
        setValue('foto', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    console.log('📸 Iniciando cámara...');
    setIsCameraOpen(true)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      setStream(mediaStream)
    } catch (err) {
      alert('Error al acceder a la cámara: ' + err.message)
      setIsCameraOpen(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraOpen(false)
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg')
      setPreview(dataUrl)
      setValue('foto', dataUrl)
      stopCamera()
    }
  }

  // Efecto para iniciar el video cuando el stream y el ref estén listos
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(e => console.error("Error al reproducir video:", e))
    }
  }, [isCameraOpen, stream])

  // Lógica de estado visual (reutilizada para el formulario)
  const getPlanStatus = (usuario) => {
    if (!usuario) return null
    const hoy = new Date()
    const vencimiento = usuario.fechaVencimiento ? new Date(usuario.fechaVencimiento) : hoy
    const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
    
    let progress = 0
    let label = ''
    let colorClass = 'bg-green-500'
    let textClass = 'text-green-700'
    let bgClass = 'bg-green-50'
    let statusText = 'Todo bien'

    if (usuario.tipoPlan === 'tiquetera') {
      const total = usuario.entradas || 10
      const restantes = usuario.entradasRestantes !== undefined ? usuario.entradasRestantes : 0
      const usados = Math.max(0, total - restantes)
      progress = total > 0 ? (usados / total) * 100 : 100
      label = `${usados} / ${total} Entradas`
      if (restantes <= 0) { colorClass = 'bg-red-500'; textClass = 'text-red-700'; bgClass = 'bg-red-50'; statusText = 'Vencido'; }
      else if (restantes <= 2) { colorClass = 'bg-yellow-500'; textClass = 'text-yellow-700'; bgClass = 'bg-yellow-50'; statusText = 'Por renovar'; }
    } else {
      const inicio = usuario.fechaInicio ? new Date(usuario.fechaInicio) : new Date(new Date(vencimiento).getTime() - (30 * 24 * 60 * 60 * 1000))
      const totalTiempo = vencimiento - inicio
      const tiempoUsado = hoy - inicio
      progress = Math.min(100, Math.max(0, totalTiempo > 0 ? (tiempoUsado / totalTiempo) * 100 : 100))
      const diasTotales = Math.ceil(totalTiempo / (1000 * 60 * 60 * 24))
      const diasUsados = Math.ceil(tiempoUsado / (1000 * 60 * 60 * 24))
      label = `${Math.max(0, diasUsados)} / ${Math.max(1, diasTotales)} Días`
      if (diasRestantes < 0) { colorClass = 'bg-red-500'; textClass = 'text-red-700'; bgClass = 'bg-red-50'; statusText = 'Vencido'; }
      else if (diasRestantes <= 5) { colorClass = 'bg-yellow-500'; textClass = 'text-yellow-700'; bgClass = 'bg-yellow-50'; statusText = 'Por renovar'; }
    }
    return { progress, label, colorClass, textClass, bgClass, statusText, diasRestantes }
  }

  const planStatus = clienteEditar ? getPlanStatus(clienteEditar) : null

  return (
    <>
    {showChangePlan ? (
      <ChangePlanForm cliente={clienteEditar} onSuccess={() => { setShowChangePlan(false); onSuccess(); }} />
    ) : (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {planStatus && (
        <div className={`p-3 rounded-lg border ${planStatus.bgClass} mb-4`}>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className={planStatus.textClass}>{planStatus.statusText.toUpperCase()}</span>
            <span className={planStatus.textClass}>{planStatus.diasRestantes < 0 ? 'Vencido' : `${planStatus.diasRestantes} días restantes`}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`${planStatus.colorClass} h-2.5 rounded-full`} style={{ width: `${planStatus.progress}%` }}></div>
          </div>
          <p className="text-xs text-center mt-1 text-gray-600">{planStatus.label}</p>
        </div>
      )}

      <div className="flex justify-center mb-6">
        <div className="relative group cursor-pointer">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 border-2 border-indigo-100 flex items-center justify-center shadow-sm">
            {preview ? (
              <img src={preview} alt="Perfil" className="h-full w-full object-cover" />
            ) : (
              <PhotoIcon className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            title="Subir foto de perfil"
          />
          <div className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1.5 shadow-md group-hover:bg-indigo-700 transition-colors">
            <PencilIcon className="h-3 w-3" />
          </div>
          <button
            type="button"
            onClick={startCamera}
            className="absolute bottom-0 -left-2 bg-gray-800 text-white rounded-full p-2 shadow-lg hover:bg-gray-900 transition-colors z-20 border-2 border-white"
            title="Tomar foto con cámara"
          >
            <CameraIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
        <input 
          {...register('nombre', { required: 'El nombre es requerido' })} 
          className="mt-1 block w-full border rounded-md p-2" 
        />
        {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Documento (DNI)</label>
        <input 
          {...register('documento', { 
            required: 'El documento es requerido',
            pattern: { value: /^\d{10}$/, message: 'Debe tener 10 dígitos numéricos' }
          })} 
          onInput={(e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
          }}
          className="mt-1 block w-full border rounded-md p-2" 
        />
        {errors.documento && <p className="text-red-500 text-xs mt-1">{errors.documento.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Género</label>
        <select {...register('genero')} className="mt-1 block w-full border rounded-md p-2">
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input 
            {...register('telefono', {
              pattern: { value: /^\d{10}$/, message: 'Debe tener 10 dígitos numéricos' }
            })} 
            onInput={(e) => {
              e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
            }}
            className="mt-1 block w-full border rounded-md p-2" 
          />
          {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Plan</label>
          <select {...register('planId', { required: true })} className="mt-1 block w-full border rounded-md p-2">
            <option value="">Seleccione un plan</option>
            {planes.map(plan => (
              <option key={plan._id} value={plan._id}>{plan.nombre} - ${plan.precio}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" {...register('email')} className="mt-1 block w-full border rounded-md p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Fecha Vencimiento</label>
        <input type="date" {...register('fechaVencimiento', { required: true })} className="mt-1 block w-full border rounded-md p-2" />
      </div>
      
      {clienteEditar && (
        <div className="pt-2">
          <button type="button" onClick={() => setShowChangePlan(true)} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
            <ArrowsRightLeftIcon className="h-4 w-4 mr-1" />
            Cambiar Plan (Upgrade/Downgrade)
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isLoading}
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {mutation.isLoading ? 'Guardando...' : (clienteEditar ? 'Actualizar Cliente' : 'Registrar Cliente')}
      </button>

      {/* Modal de Cámara */}
      <Modal
        isOpen={isCameraOpen}
        onClose={stopCamera}
        title="Tomar Foto"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-4">
            <button type="button" onClick={takePhoto} className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700">
              Capturar
            </button>
            <button type="button" onClick={stopCamera} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </form>
    )}
    </>
  )
}

const ChangePlanForm = ({ cliente, onSuccess }) => {
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: planesRes } = useQuery({
    queryKey: ['planes'],
    queryFn: () => planesAPI.getAll()
  })
  const planes = planesRes?.data?.data || []

  // Cálculos de Prorrateo
  const hoy = new Date()
  const vencimiento = cliente?.fechaVencimiento ? new Date(cliente.fechaVencimiento) : new Date()
  const diasRestantes = Math.max(0, Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24)))
  
  // Valor restante del plan actual (Estimado lineal)
  const valorDiario = (cliente?.planPrecio || 0) / 30 // Asumimos 30 días base si no tenemos duración original
  const valorRestante = diasRestantes > 0 ? (diasRestantes * valorDiario) : 0

  const nuevoPlan = planes.find(p => p._id === selectedPlanId)
  const precioNuevo = nuevoPlan?.precio || 0
  const diferencia = precioNuevo - valorRestante
  const montoAPagar = Math.max(0, diferencia)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nuevoPlan) return
    if (!window.confirm(`¿Confirmar cambio de plan a ${nuevoPlan.nombre}?\nMonto a pagar: $${montoAPagar.toFixed(2)}`)) return

    setLoading(true)
    try {
      // 1. Crear Transacción si hay pago
      if (montoAPagar > 0) {
        await transaccionesAPI.create({
          tipo: 'ingreso',
          monto: montoAPagar,
          descripcion: `Cambio de Plan: ${cliente.plan} -> ${nuevoPlan.nombre}`,
          concepto: `Cambio de Plan: ${cliente.plan} -> ${nuevoPlan.nombre}`,
          cliente: cliente._id.toString(),
          metodoPago: 'efectivo',
          metodo_pago: 'efectivo',
          fecha: new Date().toISOString().split('T')[0],
          observaciones: 'Cambio de plan'
        })
      }

      // 2. Calcular nueva fecha vencimiento
      const nuevaFecha = new Date()
      nuevaFecha.setDate(nuevaFecha.getDate() + (nuevoPlan.duracionDias || 30))

      // 3. Actualizar Cliente
      const updateData = {
        plan: nuevoPlan.nombre,
        planId: nuevoPlan._id,
        planPrecio: nuevoPlan.precio,
        tipoPlan: nuevoPlan.tipo === 'tiquetera' ? 'tiquetera' : 'mensualidad',
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: nuevaFecha.toISOString(),
        estado: 'activo',
        historial_cambios: [
          ...(cliente.historialCambios || []),
          {
            plan_anterior: cliente.plan,
            plan_nuevo: nuevoPlan.nombre,
            fecha: new Date(),
            valor_restante: valorRestante,
            monto_pagado: montoAPagar
          }
        ]
      }

      if (nuevoPlan.tipo === 'tiquetera') {
        updateData.entradas = nuevoPlan.entradas
        updateData.entradasRestantes = nuevoPlan.entradas
      }

      await clientesAPI.update(cliente._id, updateData)
      
      alert('Plan cambiado exitosamente')
      onSuccess()
    } catch (error) {
      console.error(error)
      alert('Error al cambiar plan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-gray-600">Plan Actual: <span className="font-bold">{cliente?.plan}</span></p>
        <p className="text-sm text-gray-600">Vence: {vencimiento.toLocaleDateString()}</p>
        <p className="text-sm text-gray-600">Días restantes: {diasRestantes}</p>
        <p className="text-sm text-green-600 font-medium">Valor a favor: ${valorRestante.toFixed(2)}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Seleccionar Nuevo Plan</label>
        <select 
          value={selectedPlanId} 
          onChange={(e) => setSelectedPlanId(e.target.value)}
          className="mt-1 block w-full border rounded-md p-2"
          required
        >
          <option value="">-- Seleccionar --</option>
          {planes.map(p => (
            <option key={p._id} value={p._id}>{p.nombre} (${p.precio})</option>
          ))}
        </select>
      </div>

      {nuevoPlan && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Precio Nuevo Plan:</span>
            <span className="font-bold">${precioNuevo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2 text-green-700">
            <span>(-) Valor Restante:</span>
            <span>-${valorRestante.toFixed(2)}</span>
          </div>
          <div className="border-t border-blue-200 pt-2 flex justify-between items-center text-lg">
            <span className="font-bold text-blue-900">Total a Pagar:</span>
            <span className="font-bold text-blue-900">${montoAPagar.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            El nuevo plan comenzará hoy. La fecha de vencimiento se actualizará automáticamente.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !selectedPlanId}
        className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-bold"
      >
        {loading ? 'Procesando...' : 'Confirmar Cambio de Plan'}
      </button>
    </form>
  )
}

const HistorialCambiosTable = ({ historial }) => {
  if (!historial || historial.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>No hay cambios de plan registrados para este usuario.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Anterior</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nuevo</th>
            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Pago</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {historial.map((cambio, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                {new Date(cambio.fecha).toLocaleDateString()}
                <div className="text-xs text-gray-500">{new Date(cambio.fecha).toLocaleTimeString()}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{cambio.plan_anterior || '-'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{cambio.plan_nuevo}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                {cambio.monto_pagado > 0 ? `$${cambio.monto_pagado.toFixed(2)}` : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const PapeleraReciclaje = ({ onClose }) => {
  const queryClient = useQueryClient()
  
  // Nota: Asegúrate de implementar clientesAPI.getDeleted() en tu archivo de API
  // Si no existe, usa axios.get('/usuarios/eliminados')
  const { data: eliminadosData, isLoading } = useQuery({
    queryKey: ['clientes-eliminados'],
    queryFn: async () => {
      if (clientesAPI.getDeleted) return clientesAPI.getDeleted();
      // Fallback directo a axios si el método no está en la API wrapper
      const token = localStorage.getItem('token');
      return axios.get('http://localhost:5000/api/clientes/eliminados', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
    }
  })

  const restoreMutation = useMutation({
    mutationFn: (id) => clientesAPI.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
      queryClient.invalidateQueries(['clientes-eliminados'])
      alert('Usuario restaurado')
    }
  })

  const forceDeleteMutation = useMutation({
    mutationFn: (id) => clientesAPI.forceDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes-eliminados'])
      alert('Usuario eliminado permanentemente')
    }
  })

  const usuarios = eliminadosData?.data || []

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Aquí puedes restaurar usuarios eliminados o borrarlos permanentemente.
      </p>
      
      {usuarios.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <TrashIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">La papelera está vacía</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Usuario</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Eliminado</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map(u => (
                <tr key={u._id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{u.nombre}</div>
                    <div className="text-xs text-gray-500">{u.documento}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {u.deletedAt ? new Date(u.deletedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm space-x-2">
                    <button 
                      onClick={() => { if(window.confirm('¿Restaurar usuario?')) restoreMutation.mutate(u._id) }}
                      className="text-green-600 hover:text-green-900 text-xs font-bold border border-green-200 bg-green-50 px-2 py-1 rounded"
                    >
                      Restaurar
                    </button>
                    <button 
                      onClick={() => { if(window.confirm('¿Eliminar PERMANENTEMENTE? Esta acción no se puede deshacer.')) forceDeleteMutation.mutate(u._id) }}
                      className="text-red-600 hover:text-red-900 text-xs border border-red-200 bg-red-50 px-2 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="flex justify-end">
        <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-sm">
          Cerrar
        </button>
      </div>
    </div>
  )
}

const ExpedienteView = ({ clienteId }) => {
  const [activeTab, setActiveTab] = useState('resumen')
  const { data: expedienteData, isLoading, isError } = useQuery({
    queryKey: ['expediente', clienteId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      return axios.get(`http://localhost:5000/api/clientes/${clienteId}/expediente`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
    },
    enabled: !!clienteId
  })

  if (isLoading) return <LoadingSpinner />

  if (isError) return (
    <div className="text-center py-8 text-red-600">
      <p>Error al cargar el expediente.</p>
      <p className="text-sm text-gray-500">Verifica que el servidor esté corriendo y el usuario exista.</p>
    </div>
  )

  const { usuario, historialAsistencias, estadisticas } = expedienteData?.data?.data || {}

  if (!usuario) return <p className="text-center text-gray-500 py-4">No hay datos disponibles.</p>

  return (
    <div className="space-y-6">
      {/* Tabs de Navegación */}
      <div className="flex border-b border-gray-200">
        {['resumen', 'historial', 'qr'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'qr' ? 'Código QR' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'resumen' && (
      <>
      {/* Resumen de Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-center">
          <p className="text-sm text-indigo-600 font-medium">Total Asistencias</p>
          <p className="text-3xl font-bold text-indigo-900">{estadisticas?.totalAsistencias || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
          <p className="text-sm text-green-600 font-medium">Última Visita</p>
          <p className="text-lg font-bold text-green-900">
            {estadisticas?.ultimaAsistencia 
              ? new Date(estadisticas.ultimaAsistencia).toLocaleDateString() 
              : 'Nunca'}
          </p>
          {estadisticas?.ultimaAsistencia && (
            <p className="text-xs text-green-700">
              {new Date(estadisticas.ultimaAsistencia).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          )}
        </div>
      </div>

      {/* Historial de Asistencias */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
          Historial de Asistencia (Últimas 50)
        </h4>
        
        {historialAsistencias && historialAsistencias.length > 0 ? (
          <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historialAsistencias.map((asistencia) => (
                  <tr key={asistencia._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {new Date(asistencia.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                      {new Date(asistencia.fecha).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">El cliente aún no ha registrado asistencias.</p>
          </div>
        )}
      </div>
      </>
      )}

      {activeTab === 'historial' && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Historial de Cambios de Plan</h4>
          <HistorialCambiosTable historial={usuario.historialCambios} />
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${usuario.documento}`} 
              alt={`QR ${usuario.nombre}`} 
              className="w-64 h-64"
            />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">{usuario.nombre}</h3>
            <p className="text-gray-500 font-mono text-lg">{usuario.documento}</p>
          </div>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${usuario.documento}`;
              link.download = `QR_${usuario.nombre.replace(/\s+/g, '_')}.png`;
              link.target = '_blank';
              link.click();
            }}
            className="flex items-center bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 shadow-md transition-all"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Descargar QR
          </button>
          <p className="text-xs text-gray-400 text-center max-w-xs pt-2">
            El cliente puede usar este código en la entrada para registrar su asistencia automáticamente.
          </p>
        </div>
      )}
    </div>
  )
}

export default Clientes