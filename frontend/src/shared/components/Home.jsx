import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

function Home() {

    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const username = useAuthStore(state => state.username)

    return (
        <>
            <h1>Common Home</h1>
            <h2>Xin chào {username}</h2>

            {isAuthenticated && <Button as={Link} to="/workspace" > Workspace </Button>}

        </>
    );
}

export default Home;