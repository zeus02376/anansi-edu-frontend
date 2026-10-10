import { create } from 'zustand'
import api from '../services/api'

const readStoredUser = () => {
  try {
    const user = localStorage.getItem('anansi-user')
    return user ? JSON.parse(user) : null
  } catch {
    localStorage.removeItem('anansi-user')
    return null
  }
}

const storedToken = localStorage.getItem('token') || localStorage.getItem('anansi-token')

export const useAuthStore = create((set) => ({
  user: storedToken ? readStoredUser() : null,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })

    try {
      const { data } = await api.post('/auth/login', {
        email,
        motDePasse: password,
      })
      const token = data.access_token

      if (!token || !data.user) {
        throw new Error('La réponse du serveur ne contient pas de session valide.')
      }

      localStorage.setItem('anansi-token', token)
      localStorage.setItem('token', token)
      localStorage.setItem('anansi-user', JSON.stringify(data.user))
      set({ user: data.user, token, isAuthenticated: true, isLoading: false })

      return data.user
    } catch (error) {
      const message =
        error.response?.data?.message ??
        error.message ??
        'La connexion a échoué. Veuillez réessayer.'
      set({
        error: Array.isArray(message) ? message.join(', ') : message,
        isLoading: false,
      })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('anansi-token')
    localStorage.removeItem('token')
    localStorage.removeItem('anansi-user')
    set({ user: null, token: null, isAuthenticated: false, error: null })
  },

  clearError: () => set({ error: null }),
}))
