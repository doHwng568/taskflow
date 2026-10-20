import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Home() {

    const [subject, setSubject] = useState('')
    const [isLogged, setIsLogged] = useState(false)

    useEffect(() => {
        if (localStorage.getItem('accessToken')) {
            const { sub, exp } = jwtDecode(localStorage.getItem('accessToken'))

            const currentTime = Date.now() / 1000;

            if (exp > currentTime) {
                setSubject(sub)
                setIsLogged(true)
            } else {
                localStorage.removeItem('accessToken');
                setIsLogged(false);
            }
        }
    }, [])

    return (
        <>
            <h1>Common Home</h1>
            <h2>Xin chào {subject}</h2>

            <Link to="/workspace">
                <button>My Workspace</button>
            </Link>
        </>
    );
}

export default Home;