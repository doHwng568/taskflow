import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
    baseURL: 'http://localhost:8080'
})

api.interceptors.request.use(
    (config) => {

        // const accessToken = useAuthStore((state) => state.accessToken)
        const accessToken = useAuthStore.getState().accessToken

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }

        return config
    },
    (error) => Promise.reject(error)
)

export default api