import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from '../pages/dashboard/Dashboard'
import Clientes from '../pages/dashboard/Clientes'
import Asistencias from '../pages/dashboard/Asistencias'
import Transacciones from '../pages/dashboard/Transacciones'
import CierreCaja from '../pages/dashboard/CierreCaja'
import Login from '../pages/auth/Login'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/asistencias" element={<Asistencias />} />
      <Route path="/transacciones" element={<Transacciones />} />
      <Route path="/cierre-caja" element={<CierreCaja />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes