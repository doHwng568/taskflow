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
      const { sub, exp, role } = jwtDecode(token);
      if (exp > Date.now() / 1000) {
        const cleanRole = role ? (role.startsWith('ROLE_') ? role.substring(5) : role) : '';
        return { isLogged: true, username: sub || '', role: cleanRole };
      }
      localStorage.removeItem('accessToken');
    } catch {
      localStorage.removeItem('accessToken');
    }
  }
  return { isLogged: false, username: '', role: '' };
}

function Header() {
  const [{ isLogged, username, role }] = useState(getInitialAuth);

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
                  Hello, <strong className="text-dark">{username}</strong> {role && <span className="badge bg-secondary ms-1">{role}</span>}
                </span>
                {role === 'PM' && (
                  <>
                    <Nav.Link as={Link} to="/users" className="btn btn-outline-primary btn-sm px-3">
                      Quản lý nhân viên
                    </Nav.Link>
                    <Nav.Link as={Link} to="/permissions" className="btn btn-outline-primary btn-sm px-3">
                      Phân quyền
                    </Nav.Link>
                  </>
                )}
                <Nav.Link as={Link} to="/profile" className="btn btn-outline-secondary btn-sm px-3">
                  Hồ sơ
                </Nav.Link>
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