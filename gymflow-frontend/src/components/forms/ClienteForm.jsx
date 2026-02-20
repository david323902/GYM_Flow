import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { clientesAPI } from '../../api/clientes'
import { planesAPI } from '../../api/planes'
import Modal from '../common/Modal'
import { CameraIcon } from '@heroicons/react/24/outline'

const ClienteForm = ({ cliente, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: cliente || {}
  })
  const [preview, setPreview] = useState(cliente?.foto || null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const queryClient = useQueryClient()

  const { data: planes } = useQuery({
    queryKey: ['planes'],
    queryFn: () => planesAPI.getAll()
  })

  const mutation = useMutation({
    mutationFn: (data) => 
      cliente 
        ? clientesAPI.update(cliente._id, data)
        : clientesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
      onSuccess()
    }
  })

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex justify-center mb-4">
        <div className="relative h-24 w-24">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 border-2 border-indigo-100 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Perfil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-gray-400 text-3xl">📷</span>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Cambiar foto de perfil"
          />
          <div className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1 shadow-sm pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </div>
          <button
            type="button"
            onClick={startCamera}
            className="absolute bottom-0 left-0 bg-gray-800 text-white rounded-full p-1 shadow-sm hover:bg-gray-900 z-20"
            title="Usar Cámara"
          >
            <CameraIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            Documento
          </label>
          <input
            {...register('documento', { 
              required: 'Documento es requerido',
              pattern: { value: /^\d{10}$/, message: 'Debe tener 10 dígitos' }
            })}
            onInput={(e) => {
              e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.documento && (
            <p className="mt-1 text-sm text-red-600">{errors.documento.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          {...register('email', { 
            required: 'Email es requerido',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido'
            }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Teléfono
        </label>
        <input
          type="tel"
          {...register('telefono', {
            pattern: { value: /^\d{10}$/, message: 'Debe tener 10 dígitos' }
          })}
          onInput={(e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.telefono && (
          <p className="mt-1 text-sm text-red-600">{errors.telefono.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Plan
        </label>
        <select
          {...register('planId')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Seleccionar plan</option>
          {planes?.map((plan) => (
            <option key={plan._id} value={plan._id}>
              {plan.nombre} - ${plan.precio}
            </option>
          ))}
        </select>
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
  )
}

export default ClienteForm