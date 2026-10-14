import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Register() {

    const navigate = useNavigate()

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [response, setResponse] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault(); // prevent auto reload page

        try {
            // axios tự parse json 2 chiều
            const res = await axios.post('http://localhost:8080/auth/register', form)

            navigate('/login')

        } catch (err) {
            console.log(err.response.data)
            setResponse(err.response.data)
        }
    }

    const handleChange = (e) => {

        const { name, value } = e.target

        setForm(pre => ({
            ...pre,
            [name]: value
        }))
    }

    useEffect(() => {
        console.log('giá trị hiện tại của form ', form)
    }, [form])

    return (
        <>
            <h1>REGISTER</h1>
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
                <button>Register</button>
                <p>{response.code === 'USER_002' ? response.message : null}</p>
            </form>
        </>
    )

}

export default Register