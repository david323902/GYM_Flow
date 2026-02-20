import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('admin@gymflow.com')  // Valor inicial aquí
  const [password, setPassword] = useState('admin123')      // Valor inicial aquí
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      console.log('Intentando login con:', { email, password })
      
      // Primero prueba si el backend responde
      const healthCheck = await fetch('/api/health')  // ← Cambiado de /api/auth/health a /api/health
      console.log('Health check:', healthCheck.status)
      
      if (!healthCheck.ok) {
        throw new Error('Backend no disponible')
      }
      
      // Intenta el login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      console.log('Login response status:', response.status)
      
      const data = await response.json()
      console.log('Login response data:', data)
      
      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/')
      } else {
        setError(data.message || `Error ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(`Error: ${err.message}. Verifica que el backend esté corriendo en http://localhost:5000`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            GYM Flow
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de Gestión de Gimnasio
          </p>
          <div className="mt-4 p-3 bg-yellow-50 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Backend:</strong> http://localhost:5000 (Corrige esto en vite.config.js)
              <br/>
              <strong>Frontend:</strong> http://localhost:3000
            </p>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                type="email"
                value={email}  // Solo value, NO defaultValue
                onChange={(e) => setEmail(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                type="password"
                value={password}  // Solo value, NO defaultValue
                onChange={(e) => setPassword(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700 font-bold">Error:</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Conectando...' : 'Iniciar Sesión'}
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p className="font-bold">Credenciales de prueba:</p>
            <p>Email: admin@gymflow.com</p>
            <p>Contraseña: admin123</p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login