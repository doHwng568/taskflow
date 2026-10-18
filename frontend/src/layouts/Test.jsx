import { useAuthStore } from "../stores/authStore"


function Test() {

    const login = useAuthStore((state) => state.login)
    const logout = useAuthStore((state) => state.logout)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const username = useAuthStore(state => state.username)

    return (
        <>
            <h1>xin chao {username}</h1>


            {
                isAuthenticated ?
                <button onClick={logout}>Logout</button> : <button onClick={login}>Login</button>
            }
        </>

    )
}

export default Test