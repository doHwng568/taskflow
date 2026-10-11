import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    axios.get('/api/users')      // proxy tự forward → localhost:8080/api/users
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
  }, [])

  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.username}</li>)}
    </ul>
  )
}

export default App