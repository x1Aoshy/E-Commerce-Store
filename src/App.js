import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import ProductManagement from './pages/ProductManagement';
import UserManagement from './pages/UserManagement';
import Earnings from './pages/Earnings';
import Orders from './pages/Orders';
import Logs from './pages/Logs';
import './styles/global.css';

const PrivateRoute = ({ element: Component, ...rest }) => {
  const token = localStorage.getItem('token');
  return token ? <Component {...rest} /> : <Navigate to="/" />;
};

const App = () => {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/admin" /> : <LoginPage />} />
        <Route path="/admin" element={<PrivateRoute element={AdminPanel} />} />
        <Route path="/admin/products" element={<PrivateRoute element={ProductManagement} />} />
        <Route path="/admin/users" element={<PrivateRoute element={UserManagement} />} />
        <Route path="/admin/earnings" element={<PrivateRoute element={Earnings} />} />
        <Route path="/admin/orders" element={<PrivateRoute element={Orders} />} />
        <Route path="/admin/logs" element={<PrivateRoute element={Logs} />} />
      </Routes>
    </Router>
  );
};

export default App;
