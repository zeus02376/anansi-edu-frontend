import { Navigate, Outlet } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuthStore } from '../stores/authStore'

function ProtectedRoute({ allowedRoles }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
}

export default ProtectedRoute
