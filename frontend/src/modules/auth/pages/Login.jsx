import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function Login() {

    const navigate = useNavigate()

    const [form, setForm] = useState({
        username: "",
        password: ""
    })

    const [response, setResponse] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const res = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form), // convert object js to json
            });

            if (res.ok) {
                navigate('/home')
            } else {
                const data = await res.json()
                setResponse(data)
                console.log(data)
            }

        } catch (err) {
            console.log(`Error: ${err}`)
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
                {response.data?.map((item, index) => {
                    if (item.field === 'username') {
                        return <p key={index}>{item.message}</p>
                    }
                    return
                })}
                <br />
                <input type="password" placeholder="Password" name="password" onChange={handleChange} />
                {response.data?.map((item, index) => {
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