import { useAuthStore } from "../stores/authStore"


function Test() {

    const login = useAuthStore((state) => state.login)
    const logout = useAuthStore((state) => state.logout)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const username = useAuthStore(state => state.username)

    const handleInput = (e) => {
        login(e.target.value)
    }
    
    return (
        <>
            <h1>xin chao {username}</h1>

            <input type="text" onChange={handleInput}/>
        </>

    )
}

export default Test