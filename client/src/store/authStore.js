import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,

  setAuth: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    set({ user: null })
  },
}))

export default useAuthStore