import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Clientes from './pages/dashboard/Clientes'
import Asistencias from './pages/dashboard/Asistencias'
import Ventas from './pages/dashboard/Ventas'
import CierreCaja from './pages/dashboard/CierreCaja'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/asistencias" element={<Asistencias />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/cierre-caja" element={<CierreCaja />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App