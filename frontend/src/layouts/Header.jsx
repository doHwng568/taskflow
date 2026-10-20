import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'

function Header() {

  const [isLogged, setIsLogged] = useState(false)
  const location = useLocation();

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      const { sub, exp } = jwtDecode(localStorage.getItem('accessToken'))

      const currentTime = Date.now() / 1000;

      if (exp > currentTime) {
        setIsLogged(true)
      } else {
        localStorage.removeItem('accessToken');
        setIsLogged(false);
      }
    } else {
      setIsLogged(false);
    }
  }, [location.pathname])

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand as={Link} to="/home">Task Flow</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {!isLogged && <>
              <Nav.Link as={Link} to="/register">Register</Nav.Link>
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            </>}

            {isLogged &&
              <Nav.Link as={Link} to="/logout">Logout</Nav.Link>
            }
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;