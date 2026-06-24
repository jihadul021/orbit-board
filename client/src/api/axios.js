import axios from 'axios'
import { API_URL } from '../lib/constants'

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // sends httpOnly cookie (refresh token) automatically
})  

// Attach access token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If access token expired, try to refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const requestUrl = original?.url || ''
    const isAuthRequest = requestUrl.includes('/auth/')

    if (error.response?.status === 401 && !isAuthRequest && !original._retry) {
      original._retry = true

      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        const newToken = res.data.accessToken
        localStorage.setItem('accessToken', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(original)
      } catch {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
