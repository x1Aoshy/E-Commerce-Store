import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Table, Button, Form, Modal } from 'react-bootstrap';
import Swal from 'sweetalert2';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [show, setShow] = useState(false);
  const [currentUser, setCurrentUser] = useState({ username: '', password: '', role: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleShow = (user) => {
    if (user) {
      setCurrentUser(user);
      setIsEditing(true);
    } else {
      setCurrentUser({ username: '', password: '', role: '' });
      setIsEditing(false);
    }
    setShow(true);
  };

  const handleClose = () => setShow(false);

  const handleChange = (e) => {
    setCurrentUser({ ...currentUser, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/users/${currentUser.ID}`, currentUser);
        Swal.fire('Usuario actualizado', 'El usuario ha sido actualizado exitosamente', 'success');
      } else {
        await api.post('/users', currentUser);
        Swal.fire('Usuario creado', 'El usuario ha sido creado exitosamente', 'success');
      }
      fetchUsers();
      handleClose();
    } catch (error) {
      console.error('Error saving user:', error);
      Swal.fire('Error', 'Hubo un problema al guardar el usuario', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      Swal.fire('Usuario eliminado', 'El usuario ha sido eliminado exitosamente', 'success');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      Swal.fire('Error', 'Hubo un problema al eliminar el usuario', 'error');
    }
  };

  return (
    <div className="user-management container">
      <Button variant="primary" onClick={() => handleShow(null)}>
        Agregar Usuario
      </Button>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre de usuario</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.ID}>
              <td>{user.ID}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <Button variant="warning" onClick={() => handleShow(user)}>
                  Editar
                </Button>
                <Button variant="danger" onClick={() => handleDelete(user.ID)} className="ml-2">
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Editar Usuario' : 'Agregar Usuario'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formUsername">
              <Form.Label>Nombre de usuario</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={currentUser.username}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formPassword" className="mt-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={currentUser.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formRole" className="mt-3">
              <Form.Label>Rol</Form.Label>
              <Form.Control
                type="text"
                name="role"
                value={currentUser.role}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3">
              {isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserManagement;
