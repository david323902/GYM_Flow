import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const { user } = useAuth()

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Panel de Control
            </h2>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center">
                <div className="text-sm">
                  <p className="font-medium text-gray-700">{user?.nombre}</p>
                  <p className="text-gray-500">{user?.rol}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar