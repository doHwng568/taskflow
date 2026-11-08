import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

function getInitialAuth() {
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      const { sub, exp } = jwtDecode(token);
      if (exp > Date.now() / 1000) {
        return { isLogged: true, username: sub || '' };
      }
      localStorage.removeItem('accessToken');
    } catch {
      localStorage.removeItem('accessToken');
    }
  }
  return { isLogged: false, username: '' };
}

function Header() {
  const [{ isLogged, username }] = useState(getInitialAuth);

  return (
    <Navbar expand="lg" className="bg-white border-bottom shadow-sm py-2">
      <Container>
        <Navbar.Brand as={Link} to="/home" className="fw-bold text-primary fs-4">
          TaskFlow
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center gap-2">
            {!isLogged ? (
              <>
                <Nav.Link as={Link} to="/login" className="btn btn-outline-primary btn-sm px-3">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="btn btn-outline-primary btn-sm px-3">
                  Register
                </Nav.Link>
              </>
            ) : (
              <>
                <span className="navbar-text me-2 text-muted">
                  Hello, <strong className="text-dark">{username}</strong>
                </span>
                <Nav.Link as={Link} to="/logout" className="btn btn-outline-danger btn-sm px-3">
                  Logout
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;