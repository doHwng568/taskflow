import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { jwtDecode } from 'jwt-decode';
import Header from '../../layouts/Header';

function getInitialAuth() {
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      const { sub, exp } = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (exp > currentTime) {
        return { isLogged: true, subject: sub || '' };
      }
      localStorage.removeItem('accessToken');
    } catch {
      localStorage.removeItem('accessToken');
    }
  }
  return { isLogged: false, subject: '' };
}

function Home() {
  const [{ isLogged, subject }] = useState(getInitialAuth);

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <Header />

      <Container className="py-5 text-center my-auto">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <h1 className="display-4 fw-bold text-dark mb-3">
              Smart task management with <span className="text-primary">TaskFlow</span>
            </h1>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Home;
