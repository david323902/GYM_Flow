import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  HomeIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ArrowLeftOnRectangleIcon 
} from '@heroicons/react/24/outline'

const Sidebar = () => {
  const { logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Planes', href: '/planes', icon: ChartBarIcon },
    { name: 'Clientes', href: '/clientes', icon: UserGroupIcon },
    { name: 'Ventas', href: '/ventas', icon: CurrencyDollarIcon },
  ]

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-indigo-700 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-white text-2xl font-bold">GYM Flow</h1>
        </div>
        <div className="mt-5 flex-1 flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600'
                  }`
                }
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-indigo-800 p-4">
          <button
            onClick={logout}
            className="flex-shrink-0 w-full group block"
          >
            <div className="flex items-center">
              <div>
                <ArrowLeftOnRectangleIcon className="h-6 w-6 text-indigo-200 group-hover:text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Cerrar Sesión</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar