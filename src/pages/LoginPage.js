import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSun, FaMoon } from 'react-icons/fa';
import '../styles/global.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const response = await axios.post('/api/users/login', { username, password });
      const { token, role } = response.data;

      Swal.fire('Inicio de sesión exitoso', '¡Has iniciado sesión!', 'success');

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username, role }));

      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'waiter') {
        navigate('/waiter');
      }
    } catch (error) {
      Swal.fire('Error en el inicio de sesión', error.response.data.error, 'error');
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };

  const validateInputs = () => {
    let valid = true;
    if (username.trim() === '') {
      setUsernameError('El nombre de usuario es requerido');
      valid = false;
    } else {
      setUsernameError('');
    }

    if (password.trim() === '') {
      setPasswordError('La contraseña es requerida');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  return (
    <Container className="login-container">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <div className="login-form">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="text-center">Inicio de Sesión</h2>
              <Button variant="outline-secondary" onClick={toggleDarkMode} className="theme-toggle-button">
                {darkMode ? <FaSun /> : <FaMoon />}
              </Button>
            </div>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formBasicUsername">
                <InputGroup>
                  <InputGroup.Text>
                    <FaUser />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={usernameError ? 'is-invalid' : ''}
                  />
                  {usernameError && <div className="invalid-feedback">{usernameError}</div>}
                </InputGroup>
              </Form.Group>

              <Form.Group controlId="formBasicPassword">
                <InputGroup>
                  <InputGroup.Text>
                    <FaLock />
                  </InputGroup.Text>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={passwordError ? 'is-invalid' : ''}
                  />
                  <InputGroup.Text className="toggle-password" onClick={toggleShowPassword}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </InputGroup.Text>
                  {passwordError && <div className="invalid-feedback">{passwordError}</div>}
                </InputGroup>
              </Form.Group>

              <Button variant="primary" type="submit" className="login-button">
                Iniciar Sesión
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
