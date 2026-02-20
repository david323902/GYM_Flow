import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ventasAPI } from '../../api/ventas'
import { productosAPI } from '../../api/productos'
import { clientesAPI } from '../../api/clientes'
import { transaccionesAPI } from '../../api/transacciones'
import { planesAPI } from '../../api/planes'
import { notificacionesAPI } from '../../api/notificaciones'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { useForm } from 'react-hook-form'
import { 
  PlusIcon, 
  ShoppingCartIcon, 
  ArchiveBoxIcon, 
  TagIcon, 
  TrashIcon, 
  PencilIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

const formatPrice = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const Ventas = () => {
  const [activeTab, setActiveTab] = useState('pos') // pos, ventas, inventario
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState(null)
  const [transaccionToEdit, setTransaccionToEdit] = useState(null)

  useEffect(() => {
    console.log('✅ El componente Ventas se ha cargado correctamente')
  }, [])

  const tabs = [
    { id: 'pos', name: 'Punto de Venta', icon: ShoppingCartIcon },
    { id: 'ventas', name: 'Historial de Ventas', icon: ClipboardDocumentListIcon },
    { id: 'inventario', name: 'Inventario', icon: ArchiveBoxIcon },
    { id: 'reportes', name: 'Reportes', icon: ChartBarIcon },
    { id: 'caja', name: 'Caja y Movimientos', icon: CurrencyDollarIcon },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestión de Ventas y Productos</h1>
        <p className="text-gray-600">Vende productos, suplementos y controla tu inventario.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
              ${activeTab === tab.id 
                ? 'bg-white text-indigo-700 shadow' 
                : 'text-gray-500 hover:bg-white/[0.12] hover:text-indigo-600'
              }`}
          >
            <tab.icon className="h-5 w-5 mr-2" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'pos' && <POSView />}
      {activeTab === 'ventas' && <VentasHistoryView />}
      {activeTab === 'inventario' && (
        <InventarioView 
          onEdit={(product) => {
            setProductToEdit(product)
            setIsModalOpen(true)
          }}
          onNew={() => {
            setProductToEdit(null)
            setIsModalOpen(true)
          }}
        />
      )}
      {activeTab === 'reportes' && <VentasReportView />}
      {activeTab === 'caja' && (
        <TransaccionesView 
          onEdit={(t) => {
            setTransaccionToEdit(t)
            setIsModalOpen(true)
          }}
          onNew={() => {
            setTransaccionToEdit(null)
            setIsModalOpen(true)
          }}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'caja' ? (transaccionToEdit ? 'Editar Transacción' : 'Nueva Transacción') : (productToEdit ? 'Editar Producto' : 'Nuevo Producto')}
      >
        {activeTab === 'caja' ? (
          <TransaccionForm 
            transaccion={transaccionToEdit} 
            onSuccess={() => setIsModalOpen(false)} 
          />
        ) : (
          <ProductForm 
            product={productToEdit} 
            onSuccess={() => setIsModalOpen(false)} 
          />
        )}
      </Modal>
    </div>
  )
}

// --- VISTA: PUNTO DE VENTA (POS) ---
const POSView = () => {
  const [cart, setCart] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const searchInputRef = useRef(null)
  const queryClient = useQueryClient()

  const { data: productosData } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productosAPI.getAll()
  })
  const productos = productosData?.data?.productos || productosData?.data?.data || []

  const { data: planesData } = useQuery({
    queryKey: ['planes'],
    queryFn: () => planesAPI.getAll()
  })
  const planes = planesData?.data?.data || planesData?.data || []

  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesAPI.getAll()
  })
  const clientes = clientesData?.data || []

  // Combinar Productos y Planes en una sola lista para el POS
  const allItems = useMemo(() => {
    const planesFormateados = planes.map(p => ({
      ...p,
      nombre: `PLAN: ${p.nombre}`, // Distintivo visual
      categoria: 'Membresía',
      stock: 9999, // Stock infinito
      isPlan: true // Bandera para lógica
    }))

    // Agregar opción de Sesión (Día) manualmente
    const sesionItem = {
      _id: 'sesion_diaria',
      nombre: 'Sesión',
      categoria: 'Servicio',
      precio: 5000,
      stock: 9999,
      isPlan: true, // Lo tratamos como plan para visualización
      isSession: true // Flag extra para lógica
    }
    return [...planesFormateados, sesionItem, ...productos]
  }, [planes, productos])

  // Auto-focus en el buscador al entrar
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const addToCart = (product) => {
    if (product.categoria !== 'Servicio' && product.stock <= 0) {
      return alert('Producto sin stock')
    }
    
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id)
      if (existing) {
        if (product.categoria !== 'Servicio' && existing.qty >= product.stock) {
          alert('No hay más stock disponible')
          return prev
        }
        return prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id))
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = Math.max(1, item.qty + delta)
        // Check stock limit
        const product = productos.find(p => p._id === id)
        if (product && product.categoria !== 'Servicio' && newQty > product.stock) {
          return item
        }
        return { ...item, qty: newQty }
      }
      return item
    }))
  }

  const total = cart.reduce((sum, item) => sum + (item.precio * item.qty), 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('El carrito está vacío')
    
    // Verificar stock bajo (menos de 5 o minStock)
    const lowStockItems = cart.filter(item => 
      !item.isPlan && 
      item.categoria !== 'Servicio' && 
      (item.stock - item.qty) < (item.minStock || 5)
    )

    let confirmMessage = `¿Confirmar venta por ${formatPrice(total)}?`
    if (lowStockItems.length > 0) {
      confirmMessage += `\n\n⚠️ ALERTA DE STOCK BAJO:\n`
      lowStockItems.forEach(i => confirmMessage += `- ${i.nombre}: Quedarán ${i.stock - i.qty} u.\n`)
    }

    if (!window.confirm(confirmMessage)) return

    // Validar: Si hay planes, debe haber un cliente seleccionado
    // Excepción: Si es una Sesión (isSession), permitimos venta sin cliente
    const hasRealPlans = cart.some(item => item.isPlan && !item.isSession)
    if (hasRealPlans && !selectedClient) {
      return alert('⚠️ Para vender un PLAN de Membresía debes seleccionar un CLIENTE primero.')
    }

    try {
      // 1. Procesar Productos (Crear Venta en historial)
      // Excluir planes y sesiones (ya que no tienen ID de producto válido para inventario)
      const productItems = cart.filter(item => !item.isPlan && !item.isSession)
      if (productItems.length > 0) {
        // Asegurar que cliente sea null explícitamente si está vacío
        const clienteId = selectedClient && selectedClient !== "" ? selectedClient : null;
        await ventasAPI.create({
          cliente: clienteId,
          items: productItems.map(item => ({
            producto: item._id,
            nombre: item.nombre,
            cantidad: item.qty,
            precioUnitario: item.precio,
            subtotal: item.precio * item.qty
          })),
          total: productItems.reduce((sum, i) => sum + (i.precio * i.qty), 0),
          fecha: new Date().toISOString(),
          metodoPago: metodoPago
        })

        // 2. Actualizar Stock
        for (const item of productItems) {
          if (item.categoria !== 'Servicio') {
            await productosAPI.updateStock(item._id, -item.qty)
          }
        }
      }

      // 3. Procesar Planes (Renovación Automática)
      const planItems = cart.filter(item => item.isPlan && !item.isSession)
      if (planItems.length > 0 && selectedClient) {
        const clienteObj = clientes.find(c => c._id === selectedClient)
        
        for (const planItem of planItems) {
          // Calcular nueva fecha
          const hoy = new Date()
          const vencimientoActual = clienteObj.fechaVencimiento ? new Date(clienteObj.fechaVencimiento) : hoy
          const fechaBase = vencimientoActual > hoy ? vencimientoActual : hoy
          const nuevaFecha = new Date(fechaBase)
          nuevaFecha.setDate(nuevaFecha.getDate() + (planItem.duracionDias || 30))

          // Actualizar Cliente
          await clientesAPI.update(selectedClient, {
            plan: planItem.nombre.replace('PLAN: ', ''),
            planId: planItem._id,
            planPrecio: planItem.precio,
            fechaVencimiento: nuevaFecha.toISOString(),
            estado: 'activo',
            // Si es tiquetera sumar entradas
            entradasRestantes: planItem.tipo === 'tiquetera' 
              ? (clienteObj.entradasRestantes || 0) + (planItem.entradas || 0) 
              : undefined
          })

          // Enviar Notificación de Renovación por Email
          try {
            await notificacionesAPI.enviarNotificacionManual({
              usuarioId: selectedClient,
              mensaje: `¡Hola ${clienteObj.nombre}! Tu plan ${planItem.nombre.replace('PLAN: ', '')} ha sido renovado exitosamente. Nueva fecha de vencimiento: ${nuevaFecha.toLocaleDateString()}.`,
              canal: 'email'
            })
          } catch (error) {
            console.error('Error enviando notificación de renovación:', error)
          }
        }
      }

      // 4. Registrar Transacción ÚNICA por el TOTAL (Caja)
      const clienteObj = selectedClient ? clientes.find(c => c._id === selectedClient) : null
      
      await transaccionesAPI.create({
        tipo: 'Ingreso', // Debe ser con mayúscula para coincidir con el modelo
        monto: total,
        concepto: `Venta POS - ${clienteObj ? clienteObj.nombre : 'Mostrador'}`,
        metodo_pago: metodoPago,
        fecha: new Date().toISOString(),
        notas: `Items: ${cart.map(i => i.nombre).join(', ')}`,
        cliente: selectedClient, // Para activar lógica de backend
        cliente_nombre: clienteObj?.nombre,
        cliente_documento: clienteObj?.documento
      })

      alert('¡Venta y Renovación procesadas exitosamente!')
      setCart([])
      setSelectedClient('')
      queryClient.invalidateQueries(['productos'])
      queryClient.invalidateQueries(['ventas'])
      queryClient.invalidateQueries(['clientes']) // Actualizar lista clientes
    } catch (error) {
      console.error(error)
      alert('Error al procesar la venta: ' + (error.response?.data?.message || error.message))
    }
  }

  const filteredItems = allItems.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (p.categoria === 'Servicio' || p.stock > 0) // Mostrar solo con stock o servicios
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      {/* Product Grid */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col">
        <div className="mb-4 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto p-1">
          {filteredItems.map(product => (
            <div 
              key={product._id} 
              onClick={() => addToCart(product)}
              className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between ${product.isPlan ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' : 'bg-gray-50 hover:bg-white'}`}
            >
              {!product.isPlan && (
                <div className="w-full h-32 mb-2 rounded-md overflow-hidden bg-white border border-gray-100 flex items-center justify-center">
                  {product.imagen ? (
                    <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <PhotoIcon className="h-10 w-10 text-gray-300" />
                  )}
                </div>
              )}

              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    product.isPlan ? 'bg-indigo-600 text-white' :
                    product.categoria === 'Suplemento' ? 'bg-blue-100 text-blue-800' :
                    product.categoria === 'Servicio' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {product.categoria}
                  </span>
                  {product.categoria !== 'Servicio' && (
                    <span className={`text-xs font-bold ${product.stock < 5 ? 'text-red-600' : 'text-gray-500'}`}>
                      Stock: {product.stock}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 mt-2 line-clamp-2">{product.nombre}</h3>
              </div>
              <div className="mt-2 font-bold text-indigo-600 text-lg">
                {formatPrice(product.precio)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white rounded-lg shadow p-4 flex flex-col">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <ShoppingCartIcon className="h-6 w-6 mr-2 text-indigo-600" />
          Carrito de Venta
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Opcional)</label>
          <select 
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
          >
            <option value="">Cliente Casual / Mostrador</option>
            {clientes.map(c => (
              <option key={c._id} value={c._id}>{c.nombre} - {c.documento}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
          <select 
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 border-t border-b py-2">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-8">El carrito está vacío</p>
          ) : (
            cart.map(item => (
              <div key={item._id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
                  <p className="text-xs text-gray-500">{formatPrice(item.precio)} x {item.qty}</p>
                  {!item.isPlan && item.categoria !== 'Servicio' && (item.stock - item.qty) < (item.minStock || 5) && (
                    <p className="text-[10px] text-red-600 font-bold flex items-center mt-0.5">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      Stock bajo ({item.stock - item.qty})
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item._id, -1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                    <MinusIcon className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item._id, 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200">
                    <PlusIcon className="h-3 w-3" />
                  </button>
                  <button onClick={() => removeFromCart(item._id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-1">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto">
          <div className="flex justify-between items-center mb-4 text-xl font-bold text-gray-900">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center"
          >
            <CheckCircleIcon className="h-6 w-6 mr-2" />
            Completar Venta
          </button>
        </div>
      </div>
    </div>
  )
}

// --- VISTA: INVENTARIO ---
const InventarioView = ({ onEdit, onNew }) => {
  const queryClient = useQueryClient()
  const { data: productosData, isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: () => productosAPI.getAll()
  })
  const productos = productosData?.data?.productos || productosData?.data?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id) => productosAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['productos'])
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Inventario de Productos</h3>
        <button onClick={onNew} className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md text-sm hover:bg-indigo-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Producto
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productos.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{p.nombre}</div>
                  {p.descripcion && <div className="text-xs text-gray-500">{p.descripcion}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {p.categoria}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(p.precio)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {p.categoria === 'Servicio' ? (
                    <span className="text-xs text-gray-400">N/A</span>
                  ) : (
                    <span className={`text-sm font-bold ${p.stock <= (p.minStock || 5) ? 'text-red-600' : 'text-green-600'}`}>
                      {p.stock} u.
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onEdit(p)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('¿Eliminar producto?')) deleteMutation.mutate(p._id) }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --- VISTA: HISTORIAL DE VENTAS ---
const VentasHistoryView = () => {
  const { data: ventas, isLoading } = useQuery({
    queryKey: ['ventas'],
    queryFn: () => ventasAPI.getAll()
  })

  const listaVentas = ventas?.data?.ventas || ventas?.data?.data || ventas?.data || []

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {listaVentas.map((venta) => (
          <li key={venta._id}>
            <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    Venta #{venta.numeroFactura || venta._id.slice(-6)}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Cliente: {venta.clienteId?.nombre || venta.cliente?.nombre || 'Mostrador'}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    {venta.items?.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatPrice(venta.total)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(venta.fecha).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// --- FORMULARIO DE PRODUCTO ---
const ProductForm = ({ product, onSuccess }) => {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: product || { categoria: 'Suplemento', stock: 0, minStock: 5 }
  })
  const [imagePreview, setImagePreview] = useState(product?.imagen || null)
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: (data) => product 
      ? productosAPI.update(product._id, data)
      : productosAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['productos'])
      onSuccess()
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const categoria = watch('categoria')

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 1024 * 1024) return alert('La imagen no debe superar 1MB') // Límite de 1MB
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setValue('imagen', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
        <input {...register('nombre', { required: true })} className="mt-1 block w-full border rounded-md p-2" />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
        <div className="mt-1 flex items-center gap-4">
          <div className="h-20 w-20 rounded-md border border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Categoría</label>
          <select {...register('categoria')} className="mt-1 block w-full border rounded-md p-2">
            <option value="Suplemento">Suplemento</option>
            <option value="Ropa">Ropa / Accesorios</option>
            <option value="Bebida">Bebida / Snack</option>
            <option value="Servicio">Servicio (Sin Stock)</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Precio Venta ($)</label>
          <input type="number" step="0.01" {...register('precio', { required: true })} className="mt-1 block w-full border rounded-md p-2" />
        </div>
      </div>

      {categoria !== 'Servicio' && (
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Actual</label>
            <input type="number" {...register('stock')} className="mt-1 block w-full border rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Mínimo (Alerta)</label>
            <input type="number" {...register('minStock')} className="mt-1 block w-full border rounded-md p-2" />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
        <textarea {...register('descripcion')} rows="2" className="mt-1 block w-full border rounded-md p-2" />
      </div>

      <button
        type="submit"
        disabled={mutation.isLoading}
        className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {mutation.isLoading ? 'Guardando...' : 'Guardar Producto'}
      </button>
    </form>
  )
}

// --- VISTA: REPORTES ---
const VentasReportView = () => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  
  const { data: ventas, isLoading } = useQuery({
    queryKey: ['ventas'],
    queryFn: () => ventasAPI.getAll()
  })

  const stats = useMemo(() => {
    const ventasList = ventas?.data?.ventas || ventas?.data?.data || ventas?.data || []
    const ventasDia = ventasList.filter(v => v.fecha && v.fecha.startsWith(fecha))
    
    const productStats = {}
    let ingresos = 0

    ventasDia.forEach(v => {
      ingresos += (v.total || 0)
      v.items?.forEach(item => {
        const nombre = item.nombre || 'Desconocido'
        productStats[nombre] = (productStats[nombre] || 0) + (item.cantidad || 0)
      })
    })

    const chartData = Object.entries(productStats)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10) // Top 10 productos

    return {
      ventasCount: ventasDia.length,
      ingresos,
      chartData
    }
  }, [ventas, fecha])

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Resumen y Filtro */}
      <div className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Reporte</label>
          <input 
            type="date" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="flex gap-8 text-right">
          <div>
            <p className="text-sm text-gray-500">Ventas Totales</p>
            <p className="text-2xl font-bold text-gray-900">{stats.ventasCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ingresos del Día</p>
            <p className="text-2xl font-bold text-green-600">{formatPrice(stats.ingresos)}</p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Productos Más Vendidos</h3>
        {stats.chartData && stats.chartData.length > 0 ? (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={stats.chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => [`${value} u.`, 'Cantidad']} />
                <Legend />
                <Bar dataKey="cantidad" name="Unidades Vendidas" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No hay ventas registradas para esta fecha.
          </div>
        )}
      </div>
    </div>
  )
}

// --- VISTA: CAJA Y MOVIMIENTOS (Transacciones) ---
const TransaccionesView = ({ onEdit, onNew }) => {
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [fechaFiltro, setFechaFiltro] = useState('')
  const queryClient = useQueryClient()

  const { data: transaccionesData, isLoading } = useQuery({
    queryKey: ['transacciones'],
    queryFn: () => transaccionesAPI.getAll()
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => transaccionesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['transacciones'])
  })

  const transacciones = transaccionesData?.transacciones || []
  const transaccionesFiltradas = transacciones.filter(t => {
    const tipoTransaccion = t.tipo?.toLowerCase()
    if (tipoFiltro !== 'todos' && tipoTransaccion !== tipoFiltro) return false
    if (fechaFiltro && !t.fecha?.includes(fechaFiltro)) return false
    return true
  })

  const totalIngresos = transaccionesFiltradas.filter(t => t.tipo?.toLowerCase() === 'ingreso').reduce((sum, t) => sum + (parseFloat(t.monto) || 0), 0)
  const totalEgresos = transaccionesFiltradas.filter(t => t.tipo?.toLowerCase() === 'egreso').reduce((sum, t) => sum + (parseFloat(t.monto) || 0), 0)
  const saldo = totalIngresos - totalEgresos

  // Datos para el gráfico de flujo de caja (últimos 7 días o filtrado)
  const chartData = useMemo(() => {
    const data = []
    // Agrupar por fecha
    const grouped = transaccionesFiltradas.reduce((acc, t) => {
      const date = t.fecha ? t.fecha.split('T')[0] : 'N/A'
      if (!acc[date]) acc[date] = { name: date, ingresos: 0, egresos: 0 }
      if (t.tipo?.toLowerCase() === 'ingreso') acc[date].ingresos += parseFloat(t.monto) || 0
      if (t.tipo?.toLowerCase() === 'egreso') acc[date].egresos += parseFloat(t.monto) || 0
      return acc
    }, {})
    
    // Convertir a array y ordenar
    return Object.values(grouped).sort((a, b) => new Date(a.name) - new Date(b.name))
  }, [transaccionesFiltradas])

  // Formatear fecha para el eje X
  const formatDateTick = (tick) => {
    if (!tick) return ''
    const [year, month, day] = tick.split('-')
    return `${day}/${month}`
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-green-100 p-3 rounded-full mr-4"><ArrowUpIcon className="h-6 w-6 text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Ingresos</p><p className="text-2xl font-bold text-gray-900">{formatPrice(totalIngresos)}</p></div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-red-100 p-3 rounded-full mr-4"><ArrowDownIcon className="h-6 w-6 text-red-600" /></div>
          <div><p className="text-sm text-gray-500">Egresos</p><p className="text-2xl font-bold text-gray-900">{formatPrice(totalEgresos)}</p></div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4"><CurrencyDollarIcon className="h-6 w-6 text-blue-600" /></div>
          <div><p className="text-sm text-gray-500">Saldo Neto</p><p className="text-2xl font-bold text-gray-900">{formatPrice(saldo)}</p></div>
        </div>
      </div>

      {/* Gráfico de Flujo de Caja (Estilo Planes) */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Flujo de Caja (Ingresos vs Egresos)</h2>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickFormatter={formatDateTick} />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatPrice(value)}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="egresos" name="Egresos" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros y Botón */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Detalle de Movimientos</h3>
        <div className="flex gap-3">
          <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="todos">Todos los tipos</option>
            <option value="ingreso">Solo Ingresos</option>
            <option value="egreso">Solo Egresos</option>
          </select>
          <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm" />
          <button onClick={onNew} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm">
            <PlusIcon className="h-4 w-4 mr-2" /> Nueva Transacción
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transaccionesFiltradas.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.fecha ? new Date(t.fecha).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{t.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.tipo?.toLowerCase() === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {t.tipo?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                    <span className={t.tipo?.toLowerCase() === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                      {t.tipo?.toLowerCase() === 'ingreso' ? '+' : '-'}{formatPrice(parseFloat(t.monto))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.metodoPago}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => onEdit(t)} className="text-indigo-600 hover:text-indigo-900 mr-3"><PencilIcon className="h-5 w-5" /></button>
                    <button onClick={() => { if(window.confirm('¿Eliminar transacción?')) deleteMutation.mutate(t._id) }} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- FORMULARIO DE TRANSACCIÓN ---
const TransaccionForm = ({ transaccion, onSuccess }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: transaccion || { tipo: 'Ingreso', metodoPago: 'efectivo', fecha: new Date().toISOString().split('T')[0] }
  })
  const queryClient = useQueryClient()
  const { data: clientesData } = useQuery({ queryKey: ['clientes'], queryFn: () => clientesAPI.getAll() })
  const clientes = clientesData?.data || []

  const mutation = useMutation({
    mutationFn: (data) => transaccion ? transaccionesAPI.update(transaccion._id, data) : transaccionesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transacciones'])
      onSuccess()
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const onSubmit = (data) => {
    const payload = {
      ...data,
      monto: parseFloat(data.monto),
      metodo_pago: data.metodoPago, // Asegurar snake_case
      concepto: data.descripcion
    }
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
        <label className="block text-sm font-medium text-gray-700">Tipo</label>
        <select {...register('tipo')} className="mt-1 block w-full border rounded-md p-2">
          <option value="Ingreso">Ingreso</option>
          <option value="Egreso">Egreso</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Descripción</label>
        <input {...register('descripcion', { required: 'Requerido' })} className="mt-1 block w-full border rounded-md p-2" />
        {errors.descripcion && <span className="text-red-500 text-xs">{errors.descripcion.message}</span>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Monto</label>
        <input type="number" step="0.01" {...register('monto', { required: 'Requerido', min: 0.01 })} className="mt-1 block w-full border rounded-md p-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
          <select {...register('metodoPago')} className="mt-1 block w-full border rounded-md p-2">
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha</label>
          <input type="date" {...register('fecha')} className="mt-1 block w-full border rounded-md p-2" />
        </div>
      </div>
      {(tipo === 'Ingreso' || tipo === 'ingreso') && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Cliente (Opcional)</label>
          <select {...register('cliente')} className="mt-1 block w-full border rounded-md p-2">
            <option value="">Seleccionar...</option>
            {clientes.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
          </select>
        </div>
      )}
      <button type="submit" disabled={mutation.isLoading} className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
        {mutation.isLoading ? 'Guardando...' : 'Guardar Transacción'}
      </button>
    </form>
  )
}

export default Ventas