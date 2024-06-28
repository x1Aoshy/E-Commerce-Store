import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaProductHunt, FaUser, FaMoneyBill, FaList, FaFileAlt, FaSignOutAlt, FaBars } from 'react-icons/fa';
import '../styles/global.css';

const Sidebar = ({ handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        <FaBars />
      </div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <h2>Admin Panel</h2>
        <ul>
          <li>
            <NavLink to="/admin" activeClassName="active">
              <FaHome /> Inicio
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/products" activeClassName="active">
              <FaProductHunt /> Productos
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/users" activeClassName="active">
              <FaUser /> Usuarios
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/earnings" activeClassName="active">
              <FaMoneyBill /> Ganancias
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/orders" activeClassName="active">
              <FaList /> Ordenes
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/logs" activeClassName="active">
              <FaFileAlt /> Logs
            </NavLink>
          </li>
          <li>
            <button className="logout-button" onClick={handleLogout}>
              <FaSignOutAlt /> Cerrar Sesión
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
