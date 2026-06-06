import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('orbitboard-user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })(),

  setAuth: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('orbitboard-user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('orbitboard-user')
    set({ user: null })
  },

  updateUser: (updatedUser) => {
    localStorage.setItem('orbitboard-user', JSON.stringify(updatedUser))
    set({ user: updatedUser })
  }
}))

export default useAuthStore