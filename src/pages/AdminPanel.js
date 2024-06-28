import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Sidebar from '../components/Sidebar';
import '../styles/global.css';

const AdminPanel = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡Estás a punto de cerrar sesión!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
        Swal.fire('¡Cerraste sesión!', '', 'success');
      }
    });
  };

  return (
    <div className="admin-panel">
      <Sidebar handleLogout={handleLogout} />
      <div className="admin-content">
        <h1>Panel de Administración</h1>
        {/* Agrega aquí el contenido del panel de administración */}
      </div>
    </div>
  );
};

export default AdminPanel;
