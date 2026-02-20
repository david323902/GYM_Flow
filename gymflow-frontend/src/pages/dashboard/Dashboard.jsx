import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clientesAPI } from '../../api/clientes'
import { asistenciasAPI } from '../../api/asistencias'
import { transaccionesAPI } from '../../api/transacciones'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import VentanaPlanes from './VentanaPlanes'
import { 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon, 
  CurrencyDollarIcon,
  LockClosedIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CalendarIcon,
  MegaphoneIcon,
  BellAlertIcon,
  DocumentChartBarIcon,
  ShoppingCartIcon,
  TagIcon
} from '@heroicons/react/24/outline'

const formatPrice = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [isPlanesModalOpen, setIsPlanesModalOpen] = useState(false)

  // 1. Cargar Clientes
  const { data: clientesData, isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesAPI.getAll()
  })

  // 2. Cargar Asistencias (El endpoint ya devuelve solo las de hoy)
  const { data: asistenciasData, isLoading: loadingAsistencias } = useQuery({
    queryKey: ['asistencias'],
    queryFn: () => asistenciasAPI.getAll(),
    refetchInterval: 30000 // Refrescar cada 30s
  })

  // 3. Cargar Transacciones
  const { data: transaccionesData, isLoading: loadingTransacciones } = useQuery({
    queryKey: ['transacciones'],
    queryFn: () => transaccionesAPI.getAll()
  })

  // --- Procesamiento de Datos ---
  const stats = useMemo(() => {
    const clientes = clientesData?.data || []
    const asistencias = asistenciasData?.data || []
    const transacciones = transaccionesData?.transacciones || []

    // Filtrar transacciones de HOY
    const hoy = new Date().toISOString().split('T')[0]
    const transaccionesHoy = transacciones.filter(t => t.fecha && t.fecha.startsWith(hoy))

    const ingresosHoy = transaccionesHoy
      .filter(t => t.tipo === 'Ingreso' || t.tipo === 'ingreso')
      .reduce((acc, curr) => acc + (curr.monto || 0), 0)

    const egresosHoy = transaccionesHoy
      .filter(t => t.tipo === 'Egreso' || t.tipo === 'egreso')
      .reduce((acc, curr) => acc + (curr.monto || 0), 0)

    // Ingresos de Ayer (para comparación automática)
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    const ayerStr = ayer.toISOString().split('T')[0]
    const ingresosAyer = transacciones
      .filter(t => t.fecha && t.fecha.startsWith(ayerStr) && (t.tipo === 'Ingreso' || t.tipo === 'ingreso'))
      .reduce((acc, curr) => acc + (curr.monto || 0), 0)

    // Calcular clientes registrados este mes
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const clientesMes = clientes.filter(c => {
      if (!c.createdAt) return false
      const fechaRegistro = new Date(c.createdAt)
      return fechaRegistro.getMonth() === currentMonth && fechaRegistro.getFullYear() === currentYear
    }).length

    // Alertas Inteligentes de Deudores
    const hoyDate = new Date()
    const deudores = clientes.filter(c => c.estado === 'vencido' || (c.fechaVencimiento && new Date(c.fechaVencimiento) < hoyDate))
    const deudoresCriticos = deudores.filter(c => {
      const vencimiento = new Date(c.fechaVencimiento)
      const diffTime = hoyDate - vencimiento
      return diffTime > (7 * 24 * 60 * 60 * 1000) // Más de 7 días de mora
    }).length

    return {
      clientes: clientes.length,
      clientesMes,
      asistenciasHoy: asistencias.length,
      ingresosHoy,
      egresosHoy,
      saldoHoy: ingresosHoy - egresosHoy,
      ingresosAyer,
      deudoresCriticos,
      totalDeudores: deudores.length
    }
  }, [clientesData, asistenciasData, transaccionesData])

  // --- Generar Actividad Reciente ---
  const recentActivities = useMemo(() => {
    // TODO: ¡Mejora de rendimiento crítica!
    // Este cálculo se realiza en el cliente y es muy ineficiente.
    // Se están trayendo TODOS los clientes, asistencias y transacciones para luego procesarlos.
    // La solución ideal es crear un endpoint en el backend que devuelva la actividad reciente ya procesada y paginada.
    // Ejemplo: GET /api/activities?limit=5
    const activities = []
    
    // Agregar asistencias recientes
    const asistencias = asistenciasData?.data || []
    asistencias.forEach(a => {
      activities.push({
        id: `asist-${a._id}`,
        user: a.usuario?.nombre || 'Usuario',
        action: 'Registró asistencia',
        time: new Date(a.fecha),
        type: 'asistencia'
      })
    })

    // Agregar transacciones recientes
    const transacciones = transaccionesData?.transacciones || []
    transacciones.forEach(t => {
      activities.push({
        id: `trans-${t._id}`,
        user: t.cliente_nombre || (t.tipo === 'Ingreso' ? 'Cliente' : 'Admin'),
        action: t.descripcion || `Registró ${t.tipo}`,
        time: new Date(t.fecha),
        type: t.tipo === 'Ingreso' || t.tipo === 'ingreso' ? 'pago' : 'transaccion'
      })
    })

    // Agregar nuevos clientes
    const clientes = clientesData?.data || []
    clientes.forEach(c => {
      activities.push({
        id: `client-${c._id}`,
        user: c.nombre,
        action: 'Se registró como cliente',
        time: new Date(c.createdAt),
        type: 'registro'
      })
    })

    // Ordenar por fecha descendente y tomar los últimos 5
    return activities
      .sort((a, b) => b.time - a.time)
      .slice(0, 5)
      .map(act => ({
        ...act,
        timeFormatted: timeAgo(act.time)
      }))
  }, [clientesData, asistenciasData, transaccionesData])

  // Helper para tiempo relativo
  function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000)
    
    const formatPlural = (value, unit) => {
      const rounded = Math.floor(value)
      return `Hace ${rounded} ${unit}${rounded > 1 ? 's' : ''}`
    }

    let interval = seconds / 31536000
    if (interval > 1) return formatPlural(interval, "año")
    interval = seconds / 2592000
    if (interval > 1) return formatPlural(interval, "mes")
    interval = seconds / 86400
    if (interval > 1) return formatPlural(interval, "día")
    interval = seconds / 3600
    if (interval > 1) return formatPlural(interval, "hora")
    interval = seconds / 60
    if (interval > 1) return formatPlural(interval, "min")
    if (seconds < 10) return "Justo ahora"

    return "Hace un momento"
  }

  if (loadingClientes || loadingAsistencias || loadingTransacciones) return <LoadingSpinner />

  const menuCards = [
    {
      title: 'Clientes',
      description: `${stats.clientesMes} nuevos este mes`,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      path: '/clientes',
      count: stats.clientes
    },
    {
      title: 'Asistencias',
      description: 'Registrar y consultar asistencias',
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-green-500',
      path: '/asistencias',
      count: stats.asistenciasHoy
    },
    {
      title: 'Ventas y Caja',
      description: 'POS, Inventario y Movimientos',
      icon: ShoppingCartIcon,
      color: 'bg-pink-500',
      path: '/ventas',
      count: 'POS'
    },
    {
      title: 'Cierre de Caja',
      description: 'Realizar cierre diario',
      icon: LockClosedIcon,
      color: 'bg-purple-500',
      path: '/cierre-caja',
      count: 'Hoy'
    },
    {
      title: 'Retención',
      description: 'Recuperar miembros inactivos',
      icon: MegaphoneIcon,
      color: 'bg-red-500',
      path: '/clientes',
      state: { showVencidos: true },
      count: 'Alertas'
    },
    {
      title: 'Planes',
      description: 'Ver lista de precios y planes',
      icon: TagIcon,
      color: 'bg-orange-500',
      action: () => setIsPlanesModalOpen(true),
      count: 'Lista'
    }
  ]

  const financialCards = [
    {
      title: 'Ingresos Hoy',
      value: formatPrice(stats.ingresosHoy),
      change: stats.ingresosHoy >= stats.ingresosAyer ? '↑ Más que ayer' : '↓ Menos que ayer',
      icon: ArrowUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Egresos Hoy',
      value: formatPrice(stats.egresosHoy),
      change: 'Hoy',
      icon: ArrowDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Saldo Neto',
      value: formatPrice(stats.saldoHoy),
      change: 'Hoy',
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-600">Bienvenido al sistema GYM Flow</p>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4 mr-1" />
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Cards de acceso rápido */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Acceso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuCards.map((card) => (
            <div
              key={card.title}
              onClick={() => {
                if (card.action) {
                  card.action()
                } else {
                  console.log('Intentando navegar a:', card.path)
                  navigate(card.path, { state: card.state })
                }
              }}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-300 border border-gray-200 hover:border-indigo-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">{card.count}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600">{card.description}</p>
              <div className="mt-4 text-indigo-600 text-sm font-medium">
                {card.action ? 'Ver' : 'Ir a'} {card.title} →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección: Alertas Inteligentes y Reportes Automáticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Tarjeta de Alertas de Deudores */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <BellAlertIcon className="h-6 w-6 text-red-500 mr-2" />
              Alertas de Deudores
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Crítico</span>
          </div>
          <p className="text-gray-600 mb-2">Tienes <span className="font-bold text-red-600">{stats.totalDeudores}</span> clientes con pagos vencidos.</p>
          <p className="text-sm text-gray-500 mb-4">{stats.deudoresCriticos} de ellos tienen más de 7 días de mora.</p>
          <button 
            onClick={() => navigate('/clientes', { state: { showVencidos: true } })}
            className="text-sm text-red-600 font-medium hover:text-red-800 underline"
          >
            Ver lista de deudores →
          </button>
        </div>

        {/* Tarjeta de Reporte Diario */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <DocumentChartBarIcon className="h-6 w-6 text-indigo-500 mr-2" />
              Reporte Diario
            </h3>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Automático</span>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-500">Ingresos vs Ayer</p>
              <p className={`text-xl font-bold ${stats.ingresosHoy >= stats.ingresosAyer ? 'text-green-600' : 'text-orange-500'}`}>
                {stats.ingresosHoy >= stats.ingresosAyer ? '+' : ''}{formatPrice(stats.ingresosHoy - stats.ingresosAyer)}
              </p>
            </div>
            <button 
              onClick={() => navigate('/cierre-caja')}
              className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-100"
            >
              Gestionar Cierre
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas financieras */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen Financiero</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {financialCards.map((card) => (
            <div key={card.title} className={`${card.bgColor} rounded-lg shadow p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.color} mt-2`}>{card.value}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color}`} />
              </div>
              <div className="flex items-center">
                <span className={`text-sm ${card.title.includes('Egresos') ? 'text-red-700' : 'text-green-700'}`}>
                  {card.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Actividad Reciente</h2>
          <p className="text-sm text-gray-600">Últimas acciones en el sistema</p>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  activity.type === 'asistencia' ? 'bg-green-100' :
                  activity.type === 'pago' ? 'bg-blue-100' :
                  activity.type === 'registro' ? 'bg-purple-100' :
                  'bg-yellow-100'
                }`}>
                  {activity.type === 'asistencia' && <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-600" />}
                  {activity.type === 'pago' && <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />}
                  {activity.type === 'registro' && <UserGroupIcon className="h-5 w-5 text-purple-600" />}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-500">{activity.timeFormatted}</p>
                  </div>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Planes */}
      <VentanaPlanes isOpen={isPlanesModalOpen} onClose={() => setIsPlanesModalOpen(false)} />
    </div>
  )
}

export default Dashboard