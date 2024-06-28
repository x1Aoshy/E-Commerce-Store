import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Table } from 'react-bootstrap';

const Logs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  return (
    <div className="logs container">
      <h1>Registro de Actividades</h1>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>ID de Usuario</th>
            <th>Acción</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.user_id}</td>
              <td>{log.action}</td>
              <td>{log.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Logs;
