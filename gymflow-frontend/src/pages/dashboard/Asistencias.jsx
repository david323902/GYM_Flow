import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { asistenciasAPI } from '../../api/asistencias'
import { planesAPI } from '../../api/planes'
import { transaccionesAPI } from '../../api/transacciones'
import { clientesAPI } from '../../api/clientes'
import { notificacionesAPI } from '../../api/notificaciones'
import { ClipboardDocumentCheckIcon, UserIcon, ClockIcon, ArrowPathIcon, QrCodeIcon, CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import Modal from '../../components/common/Modal'
import { Scanner } from '@yudiel/react-qr-scanner'

const Asistencias = () => {
  const [documento, setDocumento] = useState('')
  const [selectedUsuario, setSelectedUsuario] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [modalType, setModalType] = useState('success')
  const [lastAsistencia, setLastAsistencia] = useState(null)
  const queryClient = useQueryClient()

  const { data: asistenciasData } = useQuery({
    queryKey: ['asistencias'],
    queryFn: () => asistenciasAPI.getAll(),
    refetchInterval: 30000 // Refrescar cada 30s
  })

  const mutation = useMutation({
    mutationFn: (doc) => asistenciasAPI.registrar(doc),
    onSuccess: (data) => {
      playSound('success')
      setDocumento('')
      queryClient.invalidateQueries(['asistencias'])
      setIsScannerOpen(false)
      
      // Mostrar tarjeta de éxito
      setLastAsistencia(data.data || data)
      setModalType('success')
      setIsSuccessModalOpen(true)
      
      // Cerrar automáticamente después de 3 segundos
      setTimeout(() => setIsSuccessModalOpen(false), 3000)
    },
    onError: (error) => {
      playSound('error')
      setDocumento('')
      setIsScannerOpen(false)
      
      // Mostrar tarjeta de error/denegado
      const errorData = error.response?.data || {}
      setLastAsistencia({ ...errorData, message: errorData.message || error.message })
      setModalType('error')
      setIsSuccessModalOpen(true)
      setTimeout(() => setIsSuccessModalOpen(false), 4000)
    }
  })

  const asistenciasHoy = asistenciasData?.data || asistenciasData || []

  const calcularDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return null
    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const diffTime = vencimiento - hoy
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const playSound = (type = 'success') => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'error') {
        // Sonido de error (grave y descendente)
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(200, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3)
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } else {
        // Sonido de éxito (agudo y corto)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
      }
    } catch (e) {
      console.error('Error al reproducir sonido:', e)
    }
  }

  const handleRegistrar = () => {
    if (documento.trim()) {
      mutation.mutate(documento)
    }
  }

  const handleVerDetalles = (usuario) => {
    if (usuario) {
      setSelectedUsuario(usuario)
      setIsModalOpen(true)
    }
  }

  // --- Lógica de Renovación en 1 Clic ---
  const handleRenovar = async () => {
    if (!selectedUsuario) return

    // 1. Confirmación rápida
    const precio = selectedUsuario.planPrecio || 0
    if (!window.confirm(`¿RENOVAR PLAN AHORA?\n\nCliente: ${selectedUsuario.nombre}\nPlan: ${selectedUsuario.plan}\nValor a cobrar: $${precio}\n\nSe registrará el pago y se actualizará la fecha automáticamente.`)) {
      return
    }

    try {
      // 2. Obtener detalles del plan para calcular duración exacta
      const planesRes = await planesAPI.getAll()
      const planes = planesRes.data?.data || []
      // Buscar por ID o por nombre como respaldo
      const planDetails = planes.find(p => p._id === selectedUsuario.planId) || planes.find(p => p.nombre === selectedUsuario.plan)

      if (!planDetails) {
        alert('Error: No se encontró la información del plan original. Por favor renueva desde la sección de Clientes.')
        return
      }

      // 3. Calcular nueva fecha de vencimiento
      const hoy = new Date()
      const vencimientoActual = selectedUsuario.fechaVencimiento ? new Date(selectedUsuario.fechaVencimiento) : hoy
      // Si ya venció, la renovación corre desde HOY. Si no ha vencido, se suma al final.
      const fechaBase = vencimientoActual > hoy ? vencimientoActual : hoy
      const nuevaFecha = new Date(fechaBase)
      nuevaFecha.setDate(nuevaFecha.getDate() + (planDetails.duracionDias || 30))

      // 4. Crear Transacción (Pago Rápido en Efectivo)
      await transaccionesAPI.create({
        tipo: 'ingreso',
        monto: planDetails.precio,
        descripcion: `Renovación Express - ${planDetails.nombre}`,
        concepto: `Renovación Express - ${planDetails.nombre}`,
        cliente: selectedUsuario._id.toString(),
        metodoPago: 'efectivo', // Asumimos efectivo para rapidez
        metodo_pago: 'efectivo',
        fecha: new Date().toISOString().split('T')[0],
        observaciones: 'Renovación Express'
      })

      // 5. Actualizar Cliente
      const updateData = {
        fechaVencimiento: nuevaFecha.toISOString(),
        estado: 'activo'
      }
      // Si es tiquetera, sumar entradas
      if (selectedUsuario.tipoPlan === 'tiquetera') {
        updateData.entradasRestantes = (selectedUsuario.entradasRestantes || 0) + (planDetails.entradas || 0)
      }
      await clientesAPI.update(selectedUsuario._id, updateData)

      // 6. Enviar Email Automático
      try {
        await notificacionesAPI.enviarNotificacionManual({
          usuarioId: selectedUsuario._id,
          mensaje: `¡Hola ${selectedUsuario.nombre}! Tu plan ${planDetails.nombre} ha sido renovado exitosamente. Tu nueva fecha de vencimiento es: ${nuevaFecha.toLocaleDateString()}.`,
          canal: 'email'
        })
      } catch (e) { console.warn('No se pudo enviar email', e) }

      alert(`¡Renovación Exitosa!\nNuevo vencimiento: ${nuevaFecha.toLocaleDateString()}`)
      setIsModalOpen(false)
      queryClient.invalidateQueries(['asistencias'])
    } catch (error) {
      console.error(error)
      alert('Error en la renovación: ' + error.message)
    }
  }

  // --- Helper para Estado Visual del Plan ---
  const getPlanStatus = (usuario) => {
    if (!usuario) return null
    
    const hoy = new Date()
    const vencimiento = usuario.fechaVencimiento ? new Date(usuario.fechaVencimiento) : hoy
    const diffTime = vencimiento - hoy
    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
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
      label = `${usados} / ${total} Entradas usadas`
      
      if (restantes <= 0) {
        colorClass = 'bg-red-500'
        textClass = 'text-red-700'
        bgClass = 'bg-red-50'
        statusText = 'Vencido'
      } else if (restantes <= 2) {
        colorClass = 'bg-yellow-500'
        textClass = 'text-yellow-700'
        bgClass = 'bg-yellow-50'
        statusText = 'Por renovar'
      }
    } else {
      // Mensualidad: Calcular progreso basado en tiempo
      // Si no hay fecha inicio, estimamos 30 días antes del vencimiento
      const inicio = usuario.fechaInicio ? new Date(usuario.fechaInicio) : new Date(new Date(vencimiento).getTime() - (30 * 24 * 60 * 60 * 1000))
      const totalTiempo = vencimiento - inicio
      const tiempoUsado = hoy - inicio
      
      progress = totalTiempo > 0 ? (tiempoUsado / totalTiempo) * 100 : 100
      progress = Math.min(100, Math.max(0, progress)) // Clamp 0-100
      
      const diasTotales = Math.ceil(totalTiempo / (1000 * 60 * 60 * 24))
      const diasUsados = Math.ceil(tiempoUsado / (1000 * 60 * 60 * 24))
      
      label = `${Math.max(0, diasUsados)} / ${Math.max(1, diasTotales)} Días usados`

      if (diasRestantes < 0) {
        colorClass = 'bg-red-500'
        textClass = 'text-red-700'
        bgClass = 'bg-red-50'
        statusText = 'Vencido'
      } else if (diasRestantes <= 5) {
        colorClass = 'bg-yellow-500'
        textClass = 'text-yellow-700'
        bgClass = 'bg-yellow-50'
        statusText = 'Por renovar'
      }
    }

    return { progress, label, colorClass, textClass, bgClass, statusText, diasRestantes }
  }

  const planStatus = selectedUsuario ? getPlanStatus(selectedUsuario) : null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Registro de Asistencias</h1>
        <p className="text-gray-600">Registra y consulta las asistencias del día</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Asistencias Hoy</h3>
              <p className="text-2xl font-semibold text-gray-900">{asistenciasHoy.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Última Hora</h3>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Clientes Activos</h3>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Registro rápido */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Registro Rápido</h2>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRegistrar()}
              placeholder="Ingrese documento del cliente"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 flex items-center"
            title="Escanear QR con cámara"
          >
            <QrCodeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleRegistrar}
            disabled={mutation.isLoading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isLoading ? '...' : 'Registrar'}
          </button>
        </div>
      </div>

      {/* Lista de asistencias */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Asistencias de Hoy</h2>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {asistenciasHoy.map((asistencia) => {
            const diasRestantes = calcularDiasRestantes(asistencia.usuario?.fechaVencimiento)
            return (
              <div 
                key={asistencia._id} 
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={() => handleVerDetalles(asistencia.usuario)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {asistencia.usuario?.foto ? (
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden border border-gray-200">
                        <img src={asistencia.usuario.foto} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {asistencia.usuario?.nombre || 'Usuario'}
                      </h3>
                      <p className="text-sm text-gray-500">Documento: {asistencia.usuario?.documento || asistencia.documento}</p>
                      <p className="text-xs text-gray-400">Género: {asistencia.usuario?.genero || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block">
                    {diasRestantes !== null && (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        diasRestantes < 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {diasRestantes < 0 ? `Vencido hace ${Math.abs(diasRestantes)} días` : `${diasRestantes} días restantes`}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900 font-medium">{new Date(asistencia.fecha).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal de Detalles del Usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalles del Usuario"
      >
        {selectedUsuario && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center">
              {selectedUsuario.foto ? (
                <div className="h-24 w-24 rounded-full overflow-hidden mb-3 border-2 border-indigo-100">
                  <img src={selectedUsuario.foto} alt="Perfil" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold mb-3">
                  {selectedUsuario.nombre?.charAt(0)}
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{selectedUsuario.nombre}</h3>
              <span className={`px-3 py-1 mt-2 inline-flex text-sm font-semibold rounded-full 
                ${selectedUsuario.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {selectedUsuario.estado?.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Documento</label>
                <p className="mt-1 text-sm font-medium text-gray-900">{selectedUsuario.documento}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Plan Actual</label>
                <p className="mt-1 text-sm font-medium text-gray-900">{selectedUsuario.plan}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Vencimiento</label>
                <p className={`mt-1 text-sm font-bold ${calcularDiasRestantes(selectedUsuario.fechaVencimiento) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {selectedUsuario.fechaVencimiento ? new Date(selectedUsuario.fechaVencimiento).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Género</label>
                <p className="mt-1 text-sm font-medium text-gray-900">{selectedUsuario.genero || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Email</label>
                <p className="mt-1 text-sm font-medium text-gray-900">{selectedUsuario.email || 'No registrado'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Teléfono</label>
                <p className="mt-1 text-sm font-medium text-gray-900">{selectedUsuario.telefono || 'No registrado'}</p>
              </div>
            </div>

            {/* Estado Visual del Plan */}
            {planStatus && (
              <div className={`p-4 rounded-lg border ${planStatus.bgClass} border-opacity-50`}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className={`font-bold ${planStatus.textClass}`}>Estado de Mi Plan</h4>
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${planStatus.colorClass.replace('bg-', 'bg-opacity-90 bg-')}`}>
                    {planStatus.statusText}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                  <div 
                    className={`${planStatus.colorClass} h-4 rounded-full transition-all duration-500 ease-out`} 
                    style={{ width: `${planStatus.progress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>{planStatus.label}</span>
                  <span>
                    {selectedUsuario.tipoPlan === 'tiquetera' 
                      ? `${selectedUsuario.entradasRestantes} restantes`
                      : (planStatus.diasRestantes < 0 ? `Vencido hace ${Math.abs(planStatus.diasRestantes)} días` : `${planStatus.diasRestantes} días restantes`)
                    }
                  </span>
                </div>
              </div>
            )}

            {selectedUsuario.tipoPlan === 'tiquetera' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Estado de Tiquetera</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Entradas Totales: {selectedUsuario.entradas}</span>
                  <span className="font-bold text-blue-800">Restantes: {selectedUsuario.entradasRestantes}</span>
                </div>
              </div>
            )}

            {/* Botón de Renovación Rápida */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleRenovar}
                className="w-full flex items-center justify-center bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                <ArrowPathIcon className="h-6 w-6 mr-2" />
                <span className="font-bold text-lg">Renovar Plan en 1 Clic (${selectedUsuario.planPrecio || 0})</span>
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                Genera transacción, actualiza fecha y envía correo automáticamente.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Escáner QR */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Escanear Código QR"
      >
        <div className="w-full max-w-sm mx-auto">
          <Scanner
            onScan={(result) => {
              if (result && result.length > 0) {
                if (mutation.isLoading) return
                const val = result[0].rawValue
                setDocumento(val)
                mutation.mutate(val)
              }
            }}
          />
          <p className="text-center text-sm text-gray-500 mt-4">
            Apunta la cámara al código QR del cliente para registrar su entrada automáticamente.
          </p>
        </div>
      </Modal>

      {/* Modal de Éxito (Tarjeta de Asistencia) */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={modalType === 'error' ? 'Acceso Denegado' : '¡Bienvenido!'}
      >
        {lastAsistencia && (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            {modalType === 'error' ? (
              <>
                {lastAsistencia.usuario?.foto ? (
                  <div className="h-24 w-24 rounded-full overflow-hidden mb-4 border-4 border-red-100 animate-pulse">
                    <img src={lastAsistencia.usuario.foto} alt="Perfil" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <ExclamationCircleIcon className="h-12 w-12 text-red-600" />
                  </div>
                )}
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {lastAsistencia.usuario?.nombre || lastAsistencia.nombreUsuario || 'Usuario'}
                </h2>
                <p className="text-gray-500 mb-4 font-mono">
                  {lastAsistencia.usuario?.documento || lastAsistencia.documento || 'Documento'}
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-full">
                  <div className="flex items-center justify-center mb-2">
                    <XCircleIcon className="h-6 w-6 text-red-600 mr-2" />
                    <span className="text-red-800 font-bold text-lg">Acceso Denegado</span>
                  </div>
                  <p className="text-red-700 text-sm font-bold">
                    {lastAsistencia.message || 'El plan se encuentra vencido o sin entradas.'}
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </>
            ) : (
              <>
                {lastAsistencia.usuario?.foto ? (
                  <div className="h-24 w-24 rounded-full overflow-hidden mb-4 border-4 border-green-100 animate-bounce">
                    <img src={lastAsistencia.usuario.foto} alt="Perfil" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <UserIcon className="h-12 w-12 text-green-600" />
                  </div>
                )}
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {lastAsistencia.usuario?.nombre || lastAsistencia.nombreUsuario || 'Usuario Registrado'}
                </h2>
                <p className="text-gray-500 mb-4 font-mono">
                  {lastAsistencia.usuario?.documento || lastAsistencia.documento || 'Documento'}
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                    <span className="text-green-800 font-bold text-lg">Acceso Permitido</span>
                  </div>
                  <p className="text-green-700 text-sm">
                    {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
                  </p>
                  {lastAsistencia.usuario?.plan && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm text-gray-700">
                        Plan: <span className="font-bold">{lastAsistencia.usuario.plan}</span>
                      </p>
                      {lastAsistencia.usuario.entradasRestantes !== undefined && (
                        <p className="text-sm text-gray-700">
                          Entradas restantes: <span className="font-bold">{lastAsistencia.usuario.entradasRestantes}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Asistencias