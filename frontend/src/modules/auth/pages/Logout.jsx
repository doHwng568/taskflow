import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../../../stores/authStore'

function Logout() {

  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    logout()
    navigate('/home', { replace: true })
  }, [])

  return null
}

export default Logout