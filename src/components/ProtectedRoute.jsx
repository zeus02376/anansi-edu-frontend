import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuthStore } from '../stores/authStore'
import { CHANGE_PASSWORD_PATH } from '../utils/dashboard'

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }

  if (
    user.doitChangerMotDePasse &&
    location.pathname !== CHANGE_PASSWORD_PATH
  ) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }

  return <Outlet />
}

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
}

export default ProtectedRoute
