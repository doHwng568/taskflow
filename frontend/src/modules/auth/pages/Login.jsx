import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import api from "../../../services/api"
import { useAuthStore } from "../../../stores/authStore"

function Login() {

    const navigate = useNavigate()

    const [form, setForm] = useState({
        username: "",
        password: ""
    })

    const [response, setResponse] = useState('')

    const login = useAuthStore(state => state.login)

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const res = await api.post('/auth/login', form)

            const accessToken = res.data.data.accessToken
            login(accessToken)
            
            navigate('/home')
        } catch (err) {
            setResponse(err.response.data)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((pre) => ({
            ...pre,
            [name]: value
        }))
    }

    useEffect(() => {
        console.log('giá trị hiện tại của form ', form)
    }, [form])

    return (
        <>
            <h1>LOGIN</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" name="username" onChange={handleChange} />
                {response.errors?.map((item, index) => {
                    if (item.field === 'username') {
                        return <p key={index}>{item.message}</p>
                    }
                    return
                })}
                <br />
                <input type="password" placeholder="Password" name="password" onChange={handleChange} />
                {response.errors?.map((item, index) => {
                    if (item.field === 'password') {
                        return <p key={index}>{item.message}</p>
                    }
                    return
                })}
                <br />
                <button>Login</button>
                <p>{response.code === 'AUTH_001' ? response.message : null}</p>
            </form>
        </>

    )
}

export default Login