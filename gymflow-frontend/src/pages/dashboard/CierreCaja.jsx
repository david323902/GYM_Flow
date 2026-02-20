import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transaccionesAPI } from '../../api/transacciones'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { notificacionesAPI } from '../../api/notificaciones'
import { 
  LockClosedIcon, 
  CalculatorIcon, 
  DocumentTextIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatPrice = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const CierreCaja = () => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [observaciones, setObservaciones] = useState('')
  const queryClient = useQueryClient()

  const { data: transaccionesData, isLoading } = useQuery({
    queryKey: ['transacciones'],
    queryFn: () => transaccionesAPI.getAll()
  })

  const cierreMutation = useMutation({
    mutationFn: (data) => transaccionesAPI.create(data),
    onSuccess: () => {
      alert('Cierre de caja guardado exitosamente.')
      queryClient.invalidateQueries(['transacciones'])
      generarReportePDF()
    }
  })

  // Filtrar transacciones por fecha seleccionada
  const transacciones = transaccionesData?.transacciones || []
  const transaccionesDia = transacciones.filter(t => 
    t.fecha && t.fecha.includes(fecha)
  )

  // Calcular resumen del día de forma optimizada con useMemo
  const resumenDia = useMemo(() => {
    return transaccionesDia.reduce((acc, t) => {
      const monto = parseFloat(t.monto) || 0
      const tipo = t.tipo?.toLowerCase()
      if (tipo === 'ingreso') {
        acc.ingresos += monto
        acc.countIngresos += 1
      } else if (tipo === 'egreso') {
        acc.egresos += monto
        acc.countEgresos += 1
      }
      return acc
    }, { ingresos: 0, egresos: 0, countIngresos: 0, countEgresos: 0 })
  }, [transaccionesDia])

  const { ingresos, egresos, countIngresos, countEgresos } = resumenDia
  const saldo = ingresos - egresos;

  const crearDocumentoPDF = () => {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(20)
    doc.text('CIERRE DE CAJA - GYM FLOW', 105, 15, { align: 'center' })
    
    // Información del día
    doc.setFontSize(12)
    doc.text(`Fecha: ${new Date(fecha).toLocaleDateString('es-ES')}`, 20, 30)
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 20, 38)
    
    // Resumen financiero
    doc.setFontSize(14)
    doc.text('RESUMEN FINANCIERO', 20, 55)
    
    const resumenData = [
      ['Concepto', 'Cantidad', 'Monto Total'],
      ['Ingresos', countIngresos, formatPrice(ingresos)],
      ['Egresos', countEgresos, formatPrice(egresos)],
      ['SALDO FINAL', '', formatPrice(saldo)]
    ]
    
    autoTable(doc, {
      startY: 60,
      head: [resumenData[0]],
      body: resumenData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' }
      }
    })
    
    // Detalle de transacciones
    doc.setFontSize(14)
    doc.text('DETALLE DE TRANSACCIONES', 20, doc.autoTable.previous.finalY + 20)
    
    const transaccionesData = transaccionesDia.map(t => [
      t.fecha ? new Date(t.fecha).toLocaleDateString('es-ES') : 'N/A',
      t.descripcion || 'Sin descripción',
      t.tipo?.toLowerCase() === 'ingreso' ? 'Ingreso' : 'Egreso',
      formatPrice(parseFloat(t.monto || 0)),
      t.metodoPago || 'Efectivo'
    ])
    
    autoTable(doc, {
      startY: doc.autoTable.previous.finalY + 25,
      head: [['Fecha', 'Descripción', 'Tipo', 'Monto', 'Método']],
      body: transaccionesData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25 }
      }
    })
    
    // Observaciones
    if (observaciones) {
      doc.setFontSize(12)
      doc.text('OBSERVACIONES:', 20, doc.lastAutoTable.finalY + 20)
      doc.setFontSize(10)
      const lines = doc.splitTextToSize(observaciones, 170)
      doc.text(lines, 20, doc.lastAutoTable.finalY + 30)
    }
    
    return doc
  }

  const descargarPDF = () => {
    const doc = crearDocumentoPDF()
    doc.save(`cierre-caja-${fecha}.pdf`)
  }

  const enviarReporteEmail = async () => {
    if (!window.confirm(`¿Enviar reporte de ingresos del ${fecha} por correo al administrador?`)) return
    
    try {
      const doc = crearDocumentoPDF()
      const pdfBase64 = doc.output('datauristring')
      
      await notificacionesAPI.enviarReporteCierre({
        fecha,
        pdfBase64
      })
      
      alert('Reporte enviado exitosamente.')
    } catch (error) {
      console.error(error)
      alert('Error al enviar el reporte.')
    }
  }

  const realizarCierre = () => {
    if (window.confirm(`¿Estás seguro de realizar el cierre de caja para el ${fecha}?\n\nIngresos: ${formatPrice(ingresos)}\nEgresos: ${formatPrice(egresos)}\nSaldo: ${formatPrice(saldo)}`)) {
      
      // 1. Generar PDF en memoria
      const doc = crearDocumentoPDF()
      const pdfBase64 = doc.output('datauristring')

      // Guardamos el cierre como una transacción especial o simplemente generamos el reporte
      cierreMutation.mutate({
        tipo: 'Egreso', // Debe ser con mayúscula
        monto: 0,
        descripcion: `CIERRE DE CAJA ${fecha}. Saldo: ${formatPrice(saldo)}`,
        concepto: `CIERRE DE CAJA ${fecha}`,
        metodoPago: 'otro',
        fecha: new Date().toISOString()
      }, {
        onSuccess: async () => {
          // 2. Enviar correo automáticamente
          try {
            await notificacionesAPI.enviarReporteCierre({
              fecha,
              pdfBase64
              // email: 'admin@gym.com' // Opcional: si no se envía, el backend usa el del .env
            })
            alert('Cierre realizado y reporte enviado por correo.')
          } catch (error) {
            console.error('Error enviando correo:', error)
            alert('Cierre guardado, pero hubo un error enviando el correo.')
          }
          // 3. Descargar copia local
          doc.save(`cierre-caja-${fecha}.pdf`)
        }
      })
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Cierre de Caja</h1>
        <p className="text-gray-600">Realiza el cierre diario de operaciones y genera reportes</p>
      </div>

      {/* Selector de fecha */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Seleccionar Fecha</h2>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        {/* Resumen del día */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CalculatorIcon className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-sm font-medium text-green-800">Ingresos del Día</h3>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatPrice(ingresos)}
            </p>
            <p className="text-sm text-green-700">
              {countIngresos} transacciones
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CalculatorIcon className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Egresos del Día</h3>
            </div>
            <p className="text-2xl font-bold text-red-900">
              {formatPrice(egresos)}
            </p>
            <p className="text-sm text-red-700">
              {countEgresos} transacciones
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">Saldo Final</h3>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatPrice(saldo)}
            </p>
            <p className="text-sm text-blue-700">
              Balance del día
            </p>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones del Cierre
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Notas sobre el cierre de caja, diferencias, incidencias, etc."
          />
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={descargarPDF}
            className="flex items-center justify-center bg-gray-600 text-white px-4 py-3 rounded-md hover:bg-gray-700"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Generar Reporte PDF
          </button>
          
          <button
            onClick={enviarReporteEmail}
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700"
          >
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            Enviar por Email
          </button>

          <button
            onClick={realizarCierre}
            disabled={transaccionesDia.length === 0}
            className="flex items-center justify-center bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Realizar Cierre de Caja
          </button>
        </div>
      </div>

      {/* Detalle de transacciones del día */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Transacciones del {new Date(fecha).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          <p className="text-sm text-gray-500">
            Total: {transaccionesDia.length} transacciones
          </p>
        </div>
        
        {transaccionesDia.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transaccionesDia.map((transaccion) => (
                  <tr key={transaccion._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaccion.createdAt ? new Date(transaccion.createdAt).toLocaleTimeString('es-ES') : 'N/A'}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <LockClosedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay transacciones registradas para esta fecha</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CierreCaja